import { createRef, ReactNode, useEffect } from "react";
import * as d3 from "d3";
import { EdgeDto, NodeDto } from "../shared/dto.ts";
import { Stack } from "react-bootstrap";
import { useStore } from "../lib/state/useStore.ts";
import { useTheme } from "../lib/theme/useTheme.ts";
import { getBackgroundColor } from "../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../lib/color/getTextColor.ts";

export function Canvas(props: { children?: ReactNode }) {
  const graph = useStore((state) => state.canvas.graph);
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();

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

    const nodes: D3Node[] = graph.graph.nodes.map((node: NodeDto): D3Node => {
      return {
        ...node,
        x: node.position.x,
        y: node.position.y,
      };
    });

    const edges: D3Link[] = graph.graph.edges.reduce(
      (acc: D3Link[], edge: EdgeDto) => {
        const sourceNode = nodes.find((n) => n.id === edge.startNodeId);
        const targetNode = nodes.find((n) => n.id === edge.endNodeId);

        if (sourceNode && targetNode) {
          acc.push({
            ...edge,
            source: sourceNode,
            target: targetNode,
          });
        }

        return acc;
      },
      [],
    );

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
      .tick(500);

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
        .attr("font-weight", "bolder")
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
          },
        )
        .on("end", (event: d3.D3DragEvent<SVGGElement, D3Node, null>) => {
          if (event.active == 0) simulation.alphaTarget(0);
          // d.fx = undefined;
          // d.fy = undefined;
        }),
    );
    node
      .append("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => getBackgroundColor(d.labels[0].color))
      .attr("stroke", () => (theme == "dark" ? "#fff" : "#000"))
      .attr("stroke-width", "3px");

    node
      .append("text")
      .text((d) => d.displayTitle)
      .attr("fill", (d) => getTextColor(d.labels[0].color))
      .attr("font-weight", "bolder")
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
    });
  }, [svgRef, graph, theme]);

  return (
    <div className={"flex-grow-1 d-flex"}>
      {props.children}
      <svg ref={svgRef} className={"flex-grow-1 flex-shrink-1"}>
        <g></g>
      </svg>
      <Stack className={"position-absolute m-2 gap-2"} direction={"horizontal"}>
        {graph.graphMetaData.labels.map((label) => (
          <span
            className={"badge"}
            style={{
              backgroundColor: getBackgroundColor(label.color),
              color: getTextColor(label.color),
            }}
            key={label.label}
          >
            {label.label} ({label.count})
          </span>
        ))}
      </Stack>
    </div>
  );
}
