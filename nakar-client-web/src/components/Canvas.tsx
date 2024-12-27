import { createRef, ReactNode, useEffect } from "react";
import { useBearStore } from "../lib/State.ts";
import * as d3 from "d3";
import { EdgeDto, NodeDto } from "../shared/dto.ts";
import { useTheme } from "../lib/Theme.ts";

export function Canvas(props: { children?: ReactNode }) {
  const graph = useBearStore((state) => state.canvas.graph);
  const svgRef = createRef<SVGSVGElement>();
  const [theme] = useTheme();

  useEffect(() => {
    if (svgRef.current == null) return;

    const width = svgRef.current.getBoundingClientRect().width;
    const height = svgRef.current.getBoundingClientRect().height;

    const svg: d3.Selection<SVGSVGElement, null, null, undefined> = d3
      .select<SVGSVGElement, null>(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

    d3.selectAll("g > *").remove();

    const zoomContainer: d3.Selection<SVGGElement, null, null, undefined> =
      svg.select("g");

    svg.call(
      d3
        .zoom<SVGSVGElement, null>()
        .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, null>) => {
          zoomContainer.attr("transform", event.transform.toString());
        }),
    );

    type D3Node = NodeDto & { x: number; y: number; fx?: number; fy?: number };
    type D3Link = EdgeDto & { source: D3Node; target: D3Node };

    const nodes: D3Node[] = graph.nodes.map((node: NodeDto): D3Node => {
      return {
        ...node,
        x: node.position.x,
        y: node.position.y,
      };
    });

    const edges: D3Link[] = graph.edges.map((edge: EdgeDto): D3Link => {
      return {
        ...edge,
        source: nodes.find((n) => n.id == edge.startNodeId)!,
        target: nodes.find((n) => n.id == edge.endNodeId)!,
      };
    });

    const simulation: d3.Simulation<D3Node, D3Link> = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<D3Node, D3Link>(edges)
          .id((d) => d.id)
          .distance(300),
      )
      .force(
        "charge",
        d3.forceManyBody<D3Node>().strength((node) => node.size * -60),
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .tick(300);

    const link: d3.Selection<SVGLineElement, D3Link, SVGGElement, null> =
      zoomContainer
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", theme == "dark" ? "#ffffff" : "#000000")
        .attr("stroke-width", 2);

    const linkLabel: d3.Selection<SVGTextElement, D3Link, SVGGElement, null> =
      zoomContainer
        .append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(edges)
        .enter()
        .append("text")
        .text((d) => d.type)
        .attr("text-anchor", "middle")
        .attr("fill", theme == "dark" ? "#ffffff" : "#000000");

    const node: d3.Selection<SVGGElement, D3Node, SVGElement, null> =
      zoomContainer
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("g");
    node.call(
      d3
        .drag<SVGGElement, D3Node>()
        .on(
          "start",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            if (!event.active) simulation.alphaTarget(1).restart();
            d.fx = d.x;
            d.fy = d.y;
          },
        )
        .on(
          "drag",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            d.fx = event.x;
            d.fy = event.y;
          },
        )
        .on(
          "end",
          (event: d3.D3DragEvent<SVGGElement, D3Node, null>, d: D3Node) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = undefined;
            d.fy = undefined;
          },
        ),
    );
    node
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => d.backgroundColor)
      .attr("stroke", () => (theme == "dark" ? "#fff" : "#000"))
      .attr("stroke-width", "3px");

    node
      .append("text")
      .text((d) => d.displayTitle)
      .attr("fill", (d) => d.displayTitleColor)
      .attr("text-anchor", "middle");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: D3Link) => d.source.x)
        .attr("y1", (d: D3Link) => d.source.y)
        .attr("x2", (d: D3Link) => d.target.x)
        .attr("y2", (d: D3Link) => d.target.y);

      linkLabel
        .attr("x", (d: D3Link) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: D3Link) => (d.source.y + d.target.y) / 2);

      node.attr(
        "transform",
        (d: D3Node) => `translate(${d.x.toString()}, ${d.y.toString()})`,
      );

      // nodeLabel.attr("x", (d: D3Node) => d.x).attr("y", (d: D3Node) => d.y);
    });
  }, [svgRef, graph, theme]);

  return (
    <div className={"flex-grow-1 d-flex"}>
      {props.children}
      <svg ref={svgRef} className={"flex-grow-1 flex-shrink-1"}>
        <g></g>
      </svg>
    </div>
  );
}
