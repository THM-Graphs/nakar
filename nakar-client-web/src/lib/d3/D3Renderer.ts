import { D3Link } from "./D3Link.ts";
import { D3Node } from "./D3Node.ts";
import { Graph, WSEventNodesMoved } from "../../../src-gen";
import * as d3 from "d3";
import { adjustColor } from "../color/colorShade.ts";
import { getBackgroundColor } from "../color/getBackgroundColor.ts";
import { getTextColor } from "../color/getTextColor.ts";
import { UserTheme } from "../theme/UserTheme.ts";
import { BehaviorSubject, combineLatest, Subject, Subscription } from "rxjs";
import { D3RendererState } from "./D3RendererState.ts";
import { D3Calculator } from "./D3Calculator.ts";

export class D3Renderer {
  private $graphState: BehaviorSubject<D3RendererState>;
  private $theme: BehaviorSubject<UserTheme>;
  private $svgElement: BehaviorSubject<SVGSVGElement | null>;

  private $onDisplayLinkData: Subject<D3Link>;
  private $onDisplayNodeData: Subject<D3Node>;
  private $onNodesMoved: Subject<void>;

  private calculator: D3Calculator;

  private nodeSelection: d3.Selection<
    SVGGElement,
    D3Node,
    SVGElement,
    null
  > | null;
  private linkLabelSelection: d3.Selection<
    SVGTextElement,
    D3Link,
    SVGGElement,
    null
  > | null;
  private linkSelection: d3.Selection<
    SVGPathElement,
    D3Link,
    SVGGElement,
    null
  > | null;

  public constructor(theme: UserTheme) {
    this.$graphState = new BehaviorSubject(D3RendererState.empty());
    this.$theme = new BehaviorSubject(theme);
    this.$svgElement = new BehaviorSubject<SVGSVGElement | null>(null);

    this.$onDisplayLinkData = new Subject();
    this.$onDisplayNodeData = new Subject();
    this.$onNodesMoved = new Subject();

    this.calculator = new D3Calculator();

    this.nodeSelection = null;
    this.linkLabelSelection = null;
    this.linkSelection = null;

    combineLatest([this.$svgElement, this.$graphState, this.$theme]).subscribe(
      ([svgElement, graph, theme]) => {
        if (svgElement == null) {
          return;
        }
        this.renderSvgElements(svgElement, graph, theme);
      },
    );
  }

  public setTheme(userTheme: UserTheme): void {
    this.$theme.next(userTheme);
  }

  public setSVGElement(svgElement: SVGSVGElement): void {
    this.$svgElement.next(svgElement);
  }

  public onDisplayLinkData(cb: (link: D3Link) => void): Subscription {
    return this.$onDisplayLinkData.subscribe((link) => {
      cb(link);
    });
  }

  public onDisplayNodeData(cb: (node: D3Node) => void): Subscription {
    return this.$onDisplayNodeData.subscribe((node) => {
      cb(node);
    });
  }

  public onNodesMoved(cb: () => void): Subscription {
    return this.$onNodesMoved.subscribe(() => {
      cb();
    });
  }

  public loadGraphContent(graph: Graph) {
    this.$graphState.next(D3RendererState.fromWsData(graph));
  }

  public get graphState(): D3RendererState {
    return this.$graphState.getValue();
  }

  public updateNodePositions(wsEvent: WSEventNodesMoved) {
    for (const node of wsEvent.nodes) {
      const localNode = this.graphState.nodes.find((n) => n.id === node.id);
      if (localNode == null) {
        continue;
      }
      localNode.position = node.position;
      localNode.x = node.position.x;
      localNode.y = node.position.y;
    }
    this.applyNodePositionsToSVG();
  }

  private renderSvgElements(
    svgElement: SVGSVGElement,
    graph: D3RendererState,
    theme: UserTheme,
  ): void {
    const width = svgElement.getBoundingClientRect().width;
    const height = svgElement.getBoundingClientRect().height;

    const svg: d3.Selection<SVGSVGElement, null, null, undefined> = d3
      .select<SVGSVGElement, null>(svgElement)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    d3.selectAll("g > *").remove();

    const zoomContainer: d3.Selection<SVGGElement, null, null, undefined> =
      svg.select("g");

    zoomContainer
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 10)
      .attr("refY", 5)
      .attr("markerWidth", 4)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 Z")
      .attr("fill", () => (theme == "dark" ? "#fff" : "#000"));

    svg.call(
      d3
        .zoom<SVGSVGElement, null>()
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, null>) => {
          zoomContainer.attr("transform", event.transform.toString());
        }),
    );

    const simulation: d3.Simulation<D3Node, D3Link> = d3
      .forceSimulation(graph.nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(graph.links)
          .id((d) => d.id)
          .distance(
            (d) => d.source.radius + d.type.length * 10 * 2 + d.target.radius,
          ),
      )
      .force(
        "charge",
        d3.forceManyBody<D3Node>().strength((node) => node.radius * -60),
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      // .alphaTarget(1)
      // .tick(1000)
      // .alphaTarget(0)
      .alpha(0);

    this.linkSelection = zoomContainer
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(graph.links)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", theme == "dark" ? "#ffffff" : "#000000")
      .attr("stroke-width", (d) => d.width)
      .attr("marker-end", "url(#arrow)");

    this.linkLabelSelection = zoomContainer
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(graph.links)
      .enter()
      .append("text")
      .text((d) =>
        d.compressedCount > 1
          ? `${d.type} (${d.compressedCount.toString()})`
          : d.type,
      )
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("y", (d) => -(d.width / 2 + 8))
      .style("stroke-linejoin", "round")
      .attr("fill", theme == "dark" ? "#ffffff" : "#000000")
      .attr("stroke-width", 1)
      .attr("style", "cursor: pointer;");

    this.linkLabelSelection
      .on("mouseover", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGTextElement);
        el.attr("data-original-color", el.attr("fill"));
        el.attr(
          "fill",
          adjustColor(el.attr("fill"), theme == "dark" ? -0.5 : 0.5),
        );
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGTextElement);
        el.attr("fill", el.attr("data-original-color"));
      })
      .on("click", (event: PointerEvent, edge: D3Link) => {
        this.$onDisplayLinkData.next(edge);
      });

    this.nodeSelection = zoomContainer
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(graph.nodes)
      .enter()
      .append("g")
      .attr("style", "cursor: pointer;");
    this.nodeSelection.call(
      d3
        .drag<SVGGElement, D3Node>()
        .on(
          "start",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            if (event.active == 0) simulation.alphaTarget(1).restart();
            d.fx = d.x;
            d.fy = d.y;
          },
        )
        .on(
          "drag",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            d.fx = event.x;
            d.fy = event.y;
            d.x = event.x;
            d.y = event.y;
            this.$onNodesMoved.next();
          },
        )
        .on("end", (event: d3.D3DragEvent<SVGGElement, D3Node, null>) => {
          if (event.active == 0) simulation.alphaTarget(0).stop();
          // d.fx = undefined;
          // d.fy = undefined;
        }),
    );
    this.nodeSelection
      .on("mouseover", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement).select("circle");
        el.attr("data-original-color", el.attr("fill"));
        el.attr("fill", adjustColor(el.attr("fill"), -0.5));
      })
      .on("mouseout", (e: MouseEvent) => {
        const el = d3.select(e.currentTarget as SVGGElement).select("circle");
        el.attr("fill", el.attr("data-original-color"));
      })
      .on("click", (event: PointerEvent, node: D3Node) => {
        this.$onDisplayNodeData.next(node);
      });

    this.nodeSelection
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr(
        "fill",
        (d) =>
          d.customBackgroundColor ??
          getBackgroundColor(
            graph.originalGraph.metaData.labels.find(
              (l) => l.label === d.labels[0],
            )?.color ?? null,
          ),
      )
      .attr("stroke", () => (theme == "dark" ? "#fff" : "#000"))
      .attr("stroke-width", "3px");

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
            graph.originalGraph.metaData.labels.find(
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
        font-size: ${(d.radius / 5 + 5).toString()}px;
        `;
      })
      .attr("width", (d) => d.radius * 2)
      .attr("height", (d) => d.radius * 2)
      .append("xhtml:span")
      .text((d) => d.title);

    simulation.on("tick", () => {
      this.$onNodesMoved.next();
      this.applyNodePositionsToSVG();
    });
  }

  public applyNodePositionsToSVG(): void {
    this.linkSelection?.attr("d", (d) => this.calculator.curvedPath(d));
    this.linkLabelSelection?.attr("transform", (d: D3Link) => {
      const c = this.calculator.curvePoints(d);
      return `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`;
    });
    this.nodeSelection?.attr(
      "transform",
      (d: D3Node) => `translate(${d.x.toString()}, ${d.y.toString()})`,
    );
  }
}
