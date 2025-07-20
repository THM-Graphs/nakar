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
import { UserTheme } from "../theme/UserTheme.ts";
import { Observable, Subject, throttleTime } from "rxjs";
import { D3RendererState } from "./D3RendererState.ts";
import { D3Calculator } from "./D3Calculator.ts";
import { D3PerformanceMode } from "./D3PerformanceMode.ts";
import { match } from "ts-pattern";

const fps = 30;
const strokeWidth: number = 3;

export class D3Renderer {
  private graphState: D3RendererState;
  private readonly theme: UserTheme;
  private readonly svgElement: SVGSVGElement;
  private performanceMode: D3PerformanceMode;

  private $onDisplayLinkData: Subject<D3Link>;
  private $onDisplayNodeData: Subject<D3Node>;
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
    theme: UserTheme,
    svgElement: SVGSVGElement,
    initialGraphElements: GraphElements,
    performanceMode: D3PerformanceMode,
  ) {
    console.log("Did create instance of graph renderer");
    this.graphState = D3RendererState.fromWsData(initialGraphElements);
    this.theme = theme;
    this.svgElement = svgElement;
    this.performanceMode = performanceMode;

    this.$onDisplayLinkData = new Subject();
    this.$onDisplayNodeData = new Subject();
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

    this.smoothedPositionDirty = true;

    this.renderSvgElements();
  }

  public get onDisplayLinkData(): Observable<D3Link> {
    return this.$onDisplayLinkData.asObservable();
  }

  public get onDisplayNodeData(): Observable<D3Node> {
    return this.$onDisplayNodeData.asObservable();
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
      const localNode = this.graphState.nodes.find((n) => n.id === node.id);
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
      });
    svg.call(zoomBehaviour);
    this.zoomBehaviour = zoomBehaviour;

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
      .attr("stroke", this.theme == "dark" ? "#ffffff" : "#000000")
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
        d.compressedCount > 1
          ? `${d.type} (${d.compressedCount.toString()})`
          : d.type,
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
      });

    this.linkPathSelection
      .on("mouseover", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement);
        el.attr("stroke", "#888");
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement);
        el.attr("stroke", this.theme == "dark" ? "#ffffff" : "#000000");
      })
      .on("click", (event: PointerEvent, edge: D3Link) => {
        this.$onDisplayLinkData.next(edge);
      });

    this.nodeSelection = this.zoomContainer
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(d3RendererState.nodes)
      .enter()
      .append("g")
      .attr("style", "cursor: pointer;");

    const bgColorsOfNode = (d: D3Node): string[] => {
      if (d.customBackgroundColor) {
        return [d.customBackgroundColor];
      } else {
        const colors: (string | null)[] = d.labels.map(
          (dlabel: string): string | null => {
            return getBackgroundColor(
              this.graphState.originalGraphElements?.labels.find(
                (l) => l.label === dlabel,
              )?.color ?? null,
            );
          },
        );
        return colors.reduce<string[]>((a, n) => (n ? [...a, n] : a), []);
      }
    };

    this.nodeSelection
      .append("defs")
      .append("linearGradient")
      .attr("id", (n) => `gradient_${n.id}`)
      .html((n) => {
        let buffer: string = "";
        const colors = bgColorsOfNode(n);
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
        this._optimizePerformance();
      })
      .on("click", (event: PointerEvent, node: D3Node) => {
        this.$onDisplayNodeData.next(node);
      });

    this.nodeCircle = this.nodeSelection
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        const colors = bgColorsOfNode(d);
        if (colors.length > 1) {
          return `url(#gradient_${d.id})`;
        } else {
          return colors[0];
        }
      });

    this.nodeSelection
      .append("circle")
      .attr("r", (n) => n.radius - strokeWidth / 2)
      .attr("class", () => `hover`)
      .style("opacity", 0)
      .attr("fill", () => "#000000");

    this.nodeSelection
      .append("foreignObject")
      .attr("x", (d) => -d.radius)
      .attr("y", (d) => -d.radius)
      .attr("width", (d) => d.radius * 2)
      .attr("height", (d) => d.radius * 2)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .attr("style", (d) => {
        const color =
          d.customTitleColor ??
          getTextColor(
            this.graphState.originalGraphElements?.labels.find(
              (l) => l.label === d.labels[0],
            )?.color ?? null,
          );

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
        `;
      })
      .attr("width", (d) => d.radius * 2)
      .attr("height", (d) => d.radius * 2)
      .append("xhtml:span")
      .text((d) => {
        const titleCut = 50;
        const fullTitle =
          d.compressedCount > 1
            ? `${d.title} (${d.compressedCount.toString()})`
            : d.title;
        if (fullTitle.length > titleCut) {
          return fullTitle.substring(0, titleCut) + "…";
        } else {
          return fullTitle;
        }
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
            setTimeout(() => {
              this.$onUngrabNode.next(d);
            }, 500);
          },
        ),
    );

    this.applyPropertiesToSVG();
    this._optimizePerformance();
  }

  public onAnimationTick(deltaTime: number): void {
    if (!this.smoothedPositionDirty) {
      return;
    }
    this.smoothedPositionDirty = false;

    const smoothTime = (1000 / fps) * 1.5; // compensate slow ws
    const maxSpeed = 500;
    for (const node of this.graphState.nodes) {
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
    this.applyPropertiesToSVG();
  }

  public applyPropertiesToSVG(): void {
    this.linkPathSelection?.attr("d", (d) => this.calculator.curvedPath(d));
    this.linkLabelSelection?.attr("transform", (d: D3Link) => {
      const c = this.calculator.curvePoints(d);
      return `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`;
    });
    this.nodeSelection?.attr(
      "transform",
      (d: D3Node) => `translate(${d.x.toString()}, ${d.y.toString()})`,
    );
    this.nodeCircle
      ?.attr("stroke-width", (n: D3Node) => {
        return n.locked
          ? `${(strokeWidth * 2).toString()}px`
          : `${strokeWidth.toString()}px`;
      })
      .attr("stroke-dasharray", (n: D3Node) => {
        return n.locked ? "10,5" : null;
      })
      .attr("stroke", () => {
        return this.theme == "dark" ? "#fff" : "#000";
      });
  }

  public zoomIn(): void {
    this.zoomTo(this.getZoom() * 1.3);
  }

  public zoomOut(): void {
    this.zoomTo(this.getZoom() * 0.7);
  }

  public center(): void {
    this.transform(0, 0, 1);
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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      .call(this.zoomBehaviour.transform, new d3.ZoomTransform(zoom, x, y));
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

  public setPerformanceMode(pm: D3PerformanceMode): void {
    this.performanceMode = pm;
    this._optimizePerformance();
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

  private _optimizePerformance() {
    if (this._shouldUseFastPerformance()) {
      this.linkLabelSelection?.attr("hidden", true);
      this.nodeSelection?.select("foreignObject").attr("hidden", true);
      this.linkPathSelection?.attr("marker-end", null);
    } else {
      this.linkLabelSelection?.attr("hidden", null);
      this.nodeSelection?.select("foreignObject").attr("hidden", null);
      this.linkPathSelection?.attr("marker-end", "url(#arrow)");
    }
  }

  private _shouldUseFastPerformance(): boolean {
    return match(this.performanceMode)
      .with(
        "auto",
        () => this.graphState.nodes.length + this.graphState.links.length > 300,
      )
      .with("on", () => true)
      .with("off", () => false)
      .exhaustive();
  }
}
