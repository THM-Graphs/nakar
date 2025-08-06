import { D3Link } from "./D3Link.ts";
import { D3Node } from "./D3Node.ts";
import {
  GraphElements,
  WSEventNodesMoved,
  WSEventSetNodeLocks,
} from "../../../src-gen";
import * as d3 from "d3";
import { ZoomBehavior } from "d3";
import { getBackgroundColor } from "../color/getBackgroundColor.ts";
import { getTextColor } from "../color/getTextColor.ts";
import { Observable, Subject, throttleTime } from "rxjs";
import { D3RendererState } from "./D3RendererState.ts";
import { D3Calculator } from "./D3Calculator.ts";
import { match, P } from "ts-pattern";
import { useBearStore } from "../state/useBearStore.ts";
import { ColorSchema } from "../color/ColorSchema.ts";
import { Theme } from "../theme/Theme.ts";

const fps = 30;
const baseStrokeWidth: number = 3;

export class D3Renderer {
  private graphState: D3RendererState;
  private theme: Theme;
  public colorSchema: ColorSchema;
  private readonly svgElement: SVGSVGElement;
  private hideLabels: boolean;

  private $onDisplayLinkData: Subject<D3Link>;
  private $onDisplayNodeData: Subject<D3Node>;
  private $onDeselectAll: Subject<void>;
  private $onGrabNode: Subject<D3Node>;
  private $onNodeMoved: Subject<D3Node>;
  private $onUngrabNode: Subject<D3Node>;

  private calculator: D3Calculator;

  private svgContainer: d3.Selection<
    SVGSVGElement,
    null,
    null,
    undefined
  > | null;
  private zoomContainer: d3.Selection<
    SVGGElement,
    null,
    null,
    undefined
  > | null;
  private zoomBehaviour: ZoomBehavior<SVGSVGElement, null> | null;
  private nodeSelection: d3.Selection<
    SVGGElement,
    D3Node,
    SVGElement,
    null
  > | null;
  private nodeLockedOverlay: d3.Selection<
    SVGCircleElement,
    D3Node,
    SVGElement,
    null
  > | null;
  private nodeSelectedOverlay: d3.Selection<
    SVGCircleElement,
    D3Node,
    SVGElement,
    null
  > | null;
  private nodeCircle: d3.Selection<
    SVGCircleElement,
    D3Node,
    SVGElement,
    null
  > | null;
  private linkLabelSelection: d3.Selection<
    SVGGElement,
    D3Link,
    SVGGElement,
    null
  > | null;
  private linkPathSelection: d3.Selection<
    SVGPathElement,
    D3Link,
    SVGGElement,
    null
  > | null;

  private smoothedPositionDirty: boolean;

  public constructor(
    theme: Theme,
    svgElement: SVGSVGElement,
    initialGraphElements: GraphElements,
    hideLabels: boolean,
    colorSchema: string,
  ) {
    console.log(`Did create instance of graph renderer. theme: ${theme}`);
    this.graphState = D3RendererState.fromWsData(initialGraphElements);
    this.theme = theme;
    this.svgElement = svgElement;
    this.hideLabels = hideLabels;
    this.colorSchema = ColorSchema.find(colorSchema);

    this.$onDisplayLinkData = new Subject();
    this.$onDisplayNodeData = new Subject();
    this.$onDeselectAll = new Subject();
    this.$onGrabNode = new Subject<D3Node>();
    this.$onNodeMoved = new Subject<D3Node>();
    this.$onUngrabNode = new Subject<D3Node>();

    this.calculator = new D3Calculator();

    this.svgContainer = null;
    this.zoomContainer = null;
    this.zoomBehaviour = null;
    this.nodeSelection = null;
    this.linkLabelSelection = null;
    this.linkPathSelection = null;
    this.nodeCircle = null;
    this.nodeLockedOverlay = null;
    this.nodeSelectedOverlay = null;

    this.smoothedPositionDirty = true;

    this.renderSvgElements();
  }

  public get onDisplayLinkData(): Observable<D3Link> {
    return this.$onDisplayLinkData.asObservable();
  }

  public get onDisplayNodeData(): Observable<D3Node> {
    return this.$onDisplayNodeData.asObservable();
  }

  public get onDeselectAll(): Observable<void> {
    return this.$onDeselectAll.asObservable();
  }

  public get onGrabNode(): Observable<D3Node> {
    return this.$onGrabNode.asObservable();
  }

  public get onNodesMoved(): Observable<D3Node> {
    /*
    throttleTime gibt immer das erste Element aus dem Zeitfenster zurück.
    Um sicherzustellen, dass die letzte Bewegung auch übertragen wird müssen
    wir das im drag-end event machen.
    */
    return this.$onNodeMoved.asObservable().pipe(throttleTime(1000 / fps));
    // return this.$onNodeMoved.asObservable();
  }

  public get onUngrabNode(): Observable<D3Node> {
    return this.$onUngrabNode.asObservable();
  }

  public loadGraphContent(graphElements: GraphElements) {
    this.graphState = D3RendererState.fromWsData(graphElements);
    this.renderSvgElements();
  }

  public updateNodePositions(wsEvent: WSEventNodesMoved) {
    for (const node of wsEvent.nodes) {
      const localNode = this.graphState.getNodeById(node.id);
      if (localNode == null) {
        continue;
      }
      localNode.tx = node.position.x;
      localNode.ty = node.position.y;
    }
    this.smoothedPositionDirty = true;
  }

  public updateLocks(wsEvent: WSEventSetNodeLocks) {
    for (const node of wsEvent.locks) {
      const localNode = this.graphState.nodes.find((n) => n.id === node.id);
      if (localNode == null) {
        continue;
      }
      localNode.locked = node.locked;
    }
    this.applyPropertiesToSVG();
  }

  private renderSvgElements(): void {
    const d3RendererState = this.graphState;
    const width = this.svgElement.getBoundingClientRect().width;
    const height = this.svgElement.getBoundingClientRect().height;

    const svg: d3.Selection<SVGSVGElement, null, null, undefined> = d3
      .select<SVGSVGElement, null>(this.svgElement)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);
    this.svgContainer = svg;

    svg.selectAll("g > *").remove();

    this.zoomContainer = svg.select("g");
    svg.on("click", () => {
      this.$onDeselectAll.next();
    });

    this.zoomContainer
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 Z")
      .attr("fill", () => (this.theme == "dark" ? "#fff" : "#000"));

    const zoomBehaviour: ZoomBehavior<SVGSVGElement, null> = d3
      .zoom<SVGSVGElement, null>()
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, null>) => {
        this.zoomContainer?.attr("transform", event.transform.toString());
        useBearStore.getState().room.canvas.setZoomTransform(event.transform);
      });
    svg.call(zoomBehaviour);
    this.zoomBehaviour = zoomBehaviour;
    zoomBehaviour.transform(
      svg,
      useBearStore.getState().room.canvas.zoomTransform,
    );

    this.linkPathSelection = this.zoomContainer
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(d3RendererState.links)
      .enter()
      .append("path")
      .attr("data-link-id", (l) => l.id)
      .style("cursor", "pointer")
      .attr("fill", "none")
      .attr("stroke-width", (d) => d.width)
      .attr("marker-end", "url(#arrow)");

    this.linkLabelSelection = this.zoomContainer
      .append("g")
      .style("pointer-events", "none")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(d3RendererState.links)
      .enter()
      .append("g")
      .attr("data-link-id", (l) => l.id);

    this.linkLabelSelection
      .append("foreignObject")
      .attr("width", (d) => d.type.length * 20)
      .attr("height", 40)
      .attr("x", (d) => -(d.type.length * 20) / 2)
      .attr("y", () => -11)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .attr("style", () => {
        return `
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        `;
      })
      .append("xhtml:span")
      .attr("style", () => {
        return `
        pointer-events: auto;
        font-weight: bold;
        color: ${this.theme == "dark" ? "#000" : "#fff"};
        font-size: 10px;
        cursor: pointer;
        background-color: ${this.theme == "dark" ? "#fff" : "#000"};
        border-radius: 5px;
        padding: 0px 5px;
        `;
      })
      .text((d) =>
        d.clusterSize > 1 ? `${d.type} (${d.clusterSize.toString()})` : d.type,
      );

    this.linkLabelSelection
      .select("foreignObject")
      .select("div")
      .select("span")
      .on("mouseover", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement);
        el.style("background-color", "#888");
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement);
        el.style("background-color", this.theme == "dark" ? "#fff" : "#000");
      })
      .on("click", (event: PointerEvent, edge: D3Link) => {
        this.$onDisplayLinkData.next(edge);
        event.stopPropagation();
      });

    this.linkPathSelection
      .on("mouseover", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement);
        el.attr("stroke", "#888");
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3.select<SVGElement, D3Link>(
          e.currentTarget as SVGGElement,
        );
        el.attr("stroke", (d: D3Link): string => this._getEdgeStrokeColor(d));
      })
      .on("click", (event: PointerEvent, edge: D3Link) => {
        this.$onDisplayLinkData.next(edge);
        event.stopPropagation();
      });

    this.nodeSelection = this.zoomContainer
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(d3RendererState.nodes)
      .enter()
      .append("g")
      .attr("style", "cursor: pointer;");

    this.nodeSelection
      .append("defs")
      .append("linearGradient")
      .attr("id", (n) => `gradient_${n.id}`)
      .html((n) => {
        let buffer: string = "";
        const colors = this._getBgColorsOfNode(n);
        const stepSize = colors.length > 1 ? 100 / (colors.length - 1) : 0;
        for (let i = 0; i < colors.length; i += 1) {
          buffer += `<stop offset="${(i * stepSize).toString()}%" stop-color="${colors[i]}"></stop>`;
        }
        return buffer;
      });

    this.nodeSelection
      .on("mouseover", (e: MouseEvent) => {
        const el = d3
          .select(e.currentTarget as SVGGElement)
          .selectChildren(`.hover`);
        el.style("opacity", 0.5);
        d3.select(e.currentTarget as SVGGElement)
          .select("foreignObject")
          .attr("hidden", null);
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3
          .select(e.currentTarget as SVGGElement)
          .selectChildren(`.hover`);
        el.style("opacity", 0);
        this._updateShowLabels();
      })
      .on("click", (event: PointerEvent, node: D3Node) => {
        this.$onDisplayNodeData.next(node);
        event.stopPropagation();
      });

    this.nodeCircle = this.nodeSelection
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        const colors = this._getBgColorsOfNode(d);
        if (colors.length > 1) {
          return `url(#gradient_${d.id})`;
        } else {
          return colors[0];
        }
      })
      .attr("stroke-width", (d) => {
        return `${this._getStrokeWidth(d).toFixed()}px`;
      })
      .attr("stroke", () => {
        return this.theme == "dark" ? "#fff" : "#000";
      });

    this.nodeSelection
      .append("circle")
      .attr("r", (n) => n.radius - this._getStrokeWidth(n) / 2)
      .attr("class", () => `hover`)
      .style("opacity", 0)
      .attr("fill", () => "#000000");

    this.nodeSelection
      .append("circle")
      .attr("hidden", (d) => (d.clusterSize === 0 ? true : null))
      .attr(
        "r",
        (n) =>
          n.radius +
          this._getStrokeWidth(n) / 2 +
          this._getStrokeWidth(n) +
          this._getStrokeWidth(n) * 2,
      )
      .attr("fill", () => "none")
      .attr("stroke", (d) => {
        const colors = this._getBgColorsOfNode(d);
        if (colors.length > 1) {
          return `url(#gradient_${d.id})`;
        } else {
          return colors[0];
        }
      })
      .attr("stroke-width", (n) => this._getStrokeWidth(n) * 4);

    this.nodeLockedOverlay = this.nodeSelection
      .append("circle")
      .attr(
        "r",
        (n) =>
          n.radius -
          this._getStrokeWidth(n) / 2 -
          this._getStrokeWidth(n) -
          this._getStrokeWidth(n) * 2,
      )
      .attr("fill", () => "rgba(0, 0, 0, 0)")
      .attr("stroke", () => {
        return this.theme == "dark" ? "#fff" : "#000";
      })
      .attr("stroke-width", (n) => this._getStrokeWidth(n) * 4)
      .attr("stroke-dasharray", (n) => n.radius * 0.1);

    this.nodeSelectedOverlay = this.nodeSelection
      .append("circle")
      .attr(
        "r",
        (n) =>
          n.radius +
          this._getStrokeWidth(n) * 0.5 +
          this._getStrokeWidth(n) * 6,
      )
      .attr("fill", () => "#ff00ff")
      .attr("opacity", 0.5);

    const foreignObjectNode = this.nodeSelection
      .append("foreignObject")
      .attr("x", (d) => -d.radius)
      .attr("y", (d) => -d.radius)
      .attr("width", (d) => d.radius * 2)
      .attr("height", (d) => d.radius * 2)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .attr("style", (d) => {
        const color = this._getTitleColorOfNode(d);

        return `
        font-weight: bolder;
        color: ${color};
        display: flex; 
        align-items: center; 
        justify-content: center;
        width: ${(d.radius * 2).toString()}px; 
        height: ${(d.radius * 2).toString()}px;
        text-align: center;
        font-size: ${(d.radius / 5 + 3).toString()}px;
        position: relative;
        `;
      })
      .attr("width", (d) => d.radius * 2)
      .attr("height", (d) => d.radius * 2);

    foreignObjectNode.append("xhtml:span").text((d) => {
      const titleCut = 50;
      const fullTitle = d.title;
      if (fullTitle.length > titleCut) {
        return fullTitle.substring(0, titleCut) + "…";
      } else {
        return fullTitle;
      }
    });

    foreignObjectNode
      .append("xhtml:span")
      .attr("hidden", (d) => (d.clusterSize === 0 ? true : null))
      .attr(
        "style",
        (d) => `
          position: absolute;
          top: 0;
          background: #000000;
          color: white;
          padding: 0px ${(d.radius / 10).toFixed()}px;
          border-radius: ${(d.radius / 10).toFixed()}px;
        `,
      )
      .text((d) => {
        return d.clusterSize;
      });

    this.nodeSelection.call(
      d3
        .drag<SVGGElement, D3Node>()
        .on(
          "start",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            this.$onGrabNode.next(d);
          },
        )
        .on(
          "drag",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            d.tx = event.x;
            d.ty = event.y;
            d.x = event.x;
            d.y = event.y;
            d.vx = 0;
            d.vy = 0;
            this.smoothedPositionDirty = true;
            this.$onNodeMoved.next(d);
          },
        )
        .on(
          "end",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            this.$onUngrabNode.next(d);
          },
        ),
    );

    this.applyPropertiesToSVG();
    this._updateShowLabels();
  }

  public onAnimationTick(deltaTime: number): void {
    if (!this.smoothedPositionDirty) {
      return;
    }
    this.smoothedPositionDirty = false;

    const smoothTime = (1000 / fps) * 1.5; // compensate slow ws
    const maxSpeed = 10000;
    for (let i = 0; i < this.graphState.nodes.length; i += 1) {
      const node: D3Node = this.graphState.nodes[i];
      [node.x, node.vx] = this.smoothDamp(
        node.x,
        node.tx,
        node.vx,
        smoothTime,
        maxSpeed,
        deltaTime,
      );
      [node.y, node.vy] = this.smoothDamp(
        node.y,
        node.ty,
        node.vy,
        smoothTime,
        maxSpeed,
        deltaTime,
      );

      if (node.vx !== 0 || node.vy !== 0) {
        this.smoothedPositionDirty = true;
      }
    }
    this.applyPositionsToSVG();

    if (deltaTime > (1 / 60) * 1000 * 1.1) {
      console.warn(
        `Request Animation Frame Delta Time is to large for 60 fps: ${deltaTime.toFixed(2)} ms. Target: ${((1 / 60) * 1000).toFixed(2)} ms`,
      );
    }
  }

  public applyPropertiesToSVG(): void {
    this.applyPositionsToSVG();

    this.nodeLockedOverlay?.attr("hidden", (d) => (d.locked ? null : true));

    this.nodeSelectedOverlay?.attr("hidden", (d) =>
      this._nodeIsSelected(d) ? null : true,
    );

    this.linkPathSelection?.attr("stroke", (d) => this._getEdgeStrokeColor(d));
  }

  public applyPositionsToSVG() {
    this.linkPathSelection?.attr("d", (d) => this.calculator.curvedPath(d));
    this.linkLabelSelection?.attr("transform", (d: D3Link) => {
      const c = this.calculator.curvePoints(d);
      return `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`;
    });
    this.nodeSelection?.attr(
      "transform",
      (d: D3Node) => `translate(${d.x.toString()}, ${d.y.toString()})`,
    );
  }

  public zoomIn(): void {
    this.zoomTo(this.getZoom() * 1.3);
  }

  public zoomOut(): void {
    this.zoomTo(this.getZoom() * 0.7);
  }

  public center(): void {
    const [x, y, zoom] = this._getPositionOfSelectedElement();
    this.transform(-x, -y, zoom);
  }

  public zoomOutOverview(): void {
    // TODO
  }

  public zoomTo(zoom: number): void {
    const svgContainerNode = this.svgContainer?.node();
    if (svgContainerNode == null) {
      console.warn("SVG Container Node is null");
      return;
    }
    if (this.zoomBehaviour == null) {
      console.warn("Zoom Behaviour is null");
      return;
    }
    this.svgContainer
      ?.transition()
      .duration(100)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .call(this.zoomBehaviour.scaleTo, zoom);
  }

  public transform(x: number, y: number, zoom: number): void {
    const svgContainerNode = this.svgContainer?.node();
    if (svgContainerNode == null) {
      console.warn("SVG Container Node is null");
      return;
    }
    if (this.zoomBehaviour == null) {
      console.warn("Zoom Behaviour is null");
      return;
    }
    this.svgContainer
      ?.transition()
      .duration(100)
      .call(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        this.zoomBehaviour.transform,
        new d3.ZoomTransform(zoom, x * zoom, y * zoom),
      );
  }

  public getZoomTransform(): d3.ZoomTransform {
    const svgContainerNode = this.svgContainer?.node();
    if (svgContainerNode == null) {
      console.warn("SVG Container Node is null");
      return new d3.ZoomTransform(1, 0, 0);
    }
    const node = svgContainerNode;
    return d3.zoomTransform(node);
  }

  public getZoom(): number {
    return this.getZoomTransform().k;
  }

  public setHideLabels(hideLabels: boolean): void {
    this.hideLabels = hideLabels;
    this._updateShowLabels();
  }

  public setColorSchema(colorSchema: string) {
    this.colorSchema = ColorSchema.find(colorSchema);
    this.renderSvgElements();
  }

  public setTheme(theme: Theme) {
    this.theme = theme;
    this.renderSvgElements();
  }

  private smoothDamp(
    current: number,
    target: number,
    currentVelocity: number,
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number,
  ): [number, number] {
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;

    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);

    let change = current - target;
    const originalTo = target;

    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    change = Math.max(-maxChange, Math.min(maxChange, change));
    target = current - change;

    const temp = (currentVelocity + omega * change) * deltaTime;
    let newVelocity = (currentVelocity - omega * temp) * exp;

    let output = target + (change + temp) * exp;

    // Prevent overshooting
    if (originalTo - current > 0.0 === output > originalTo) {
      output = originalTo;
      newVelocity = (output - originalTo) / deltaTime;
    }

    if (Math.abs(newVelocity) < 0.0001) {
      newVelocity = 0;
    }

    return [output, newVelocity];
  }

  private _updateShowLabels() {
    if (this.hideLabels) {
      this.linkLabelSelection?.attr("hidden", true);
      this.nodeSelection?.select("foreignObject").attr("hidden", true);
      this.linkPathSelection?.attr("marker-end", null);
    } else {
      this.linkLabelSelection?.attr("hidden", null);
      this.nodeSelection?.select("foreignObject").attr("hidden", null);
      this.linkPathSelection?.attr("marker-end", "url(#arrow)");
    }
  }

  private _getTitleColorOfNode(d: D3Node): string {
    return (
      d.customTitleColor ??
      getTextColor(
        this.graphState.originalGraphElements?.labels.find(
          (l) => l.label === d.labels[0],
        )?.color ?? null,
        this.colorSchema,
      )
    );
  }

  private _getBgColorsOfNode(d: D3Node): string[] {
    if (d.customBackgroundColor) {
      return [d.customBackgroundColor];
    } else {
      const colors: (string | null)[] = d.labels.map(
        (dlabel: string): string | null => {
          return getBackgroundColor(
            this.graphState.originalGraphElements?.labels.find(
              (l) => l.label === dlabel,
            )?.color ?? null,
            this.colorSchema,
          );
        },
      );
      return colors.reduce<string[]>((a, n) => (n ? [...a, n] : a), []);
    }
  }

  private _nodeIsSelected(node: D3Node): boolean {
    const element = useBearStore.getState().room.panels.inspector.element;
    if (element?.type === "node") {
      return element.nodeId === node.id;
    }
    return false;
  }

  private _edgeIsSelected(edge: D3Link): boolean {
    const element = useBearStore.getState().room.panels.inspector.element;
    if (element?.type === "edge") {
      return element.edgeId === edge.id;
    }
    return false;
  }

  private _getEdgeStrokeColor(d: D3Link): string {
    return this._edgeIsSelected(d)
      ? "#ff00ff"
      : this.theme == "dark"
        ? "#ffffff"
        : "#000000";
  }

  private _getPositionOfSelectedElement(): [number, number, number] {
    const element = useBearStore.getState().room.panels.inspector.element;
    return match(element)
      .returnType<[number, number, number]>()
      .with(P.nullish, () => [0, 0, 1])
      .with({ type: "node" }, (n) => {
        const node = this.graphState.nodes.find((d) => d.id === n.nodeId);
        if (node == null) {
          return [0, 0, 1];
        }
        return [node.x, node.y, 80 / node.radius / 2];
      })
      .with({ type: "edge" }, (n) => {
        const edge = this.graphState.links.find((d) => d.id === n.edgeId);
        if (edge == null) {
          return [0, 0, 1];
        }
        return [
          (edge.source.x + edge.target.x) / 2,
          (edge.source.y + edge.target.y) / 2,
          1,
        ];
      })
      .exhaustive();
  }

  private _getStrokeWidth(n: D3Node): number {
    return (baseStrokeWidth * n.radius) / 50;
  }
}
