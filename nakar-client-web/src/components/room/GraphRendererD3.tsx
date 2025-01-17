import { createRef, useEffect, useState } from "react";
import { useTheme } from "../../lib/theme/useTheme.ts";
import * as d3 from "d3";
import { Edge, GetInitialGraph, Node } from "../../../src-gen";
import { getTextColor } from "../../lib/color/getTextColor.ts";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";

type D3Node = Node & { x: number; y: number; fx?: number; fy?: number };
type D3Link = Edge & { source: D3Node; target: D3Node };

export function GraphRendererD3(props: { graph: GetInitialGraph }) {
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();

  const [graphContent, setGraphContent] = useState<{
    nodes: D3Node[];
    links: D3Link[];
  }>({ nodes: [], links: [] });

  useEffect(() => {
    const nodes = props.graph.graph.nodes.map((node: Node): D3Node => {
      return {
        ...node,
        x: node.position.x,
        y: node.position.y,
      };
    });
    const links = props.graph.graph.edges.reduce(
      (acc: D3Link[], edge: Edge) => {
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

    setGraphContent({ nodes: nodes, links: links });
  }, [props.graph]);

  useEffect(() => {
    const nodes = graphContent.nodes;
    const edges = graphContent.links;

    if (svgRef.current == null) return;

    const width = svgRef.current.getBoundingClientRect().width;
    const height = svgRef.current.getBoundingClientRect().height;

    const svg: d3.Selection<SVGSVGElement, null, null, undefined> = d3
      .select<SVGSVGElement, null>(svgRef.current)
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
      .attr("markerWidth", 8)
      .attr("markerHeight", 10)
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
        d3.forceManyBody<D3Node>().strength((node) => node.radius * -60),
      )
      .force("x", d3.forceX())
      .force("y", d3.forceY())
      .alphaTarget(1)
      .tick(1000)
      .alphaTarget(0)
      .alpha(0);

    const link: d3.Selection<SVGPathElement, D3Link, SVGGElement, null> =
      zoomContainer
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", theme == "dark" ? "#ffffff" : "#000000")
        .attr("stroke-width", (d) => d.width)
        .attr("marker-end", "url(#arrow)");

    const linkLabel: d3.Selection<SVGTextElement, D3Link, SVGGElement, null> =
      zoomContainer
        .append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(edges)
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
        .attr("stroke-width", 1);

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
          if (event.active == 0) simulation.alphaTarget(0).stop();
          // d.fx = undefined;
          // d.fy = undefined;
        }),
    );
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr(
        "fill",
        (d) =>
          d.backgroundColor ??
          getBackgroundColor(
            props.graph.graph.metaData.labels.find(
              (l) => l.label === d.labels[0],
            )?.color ?? null,
          ),
      )
      .attr("stroke", () => (theme == "dark" ? "#fff" : "#000"))
      .attr("stroke-width", "3px");

    node
      .append("text")
      .text((d) => d.displayTitle)
      .attr("fill", (d) =>
        getTextColor(
          props.graph.graph.metaData.labels.find((l) => l.label === d.labels[0])
            ?.color ?? null,
        ),
      )
      .attr("font-weight", "bolder")
      .attr("text-anchor", "middle");

    simulation.on("tick", () => {
      link.attr("d", (d) => curvedPath(d));

      linkLabel.attr("transform", (d: D3Link) => {
        const c = curvePoints(d);
        return `translate(${c.center.x.toString()},${c.center.y.toString()})rotate(${c.angle.toString()})`;
      });

      node.attr(
        "transform",
        (d: D3Node) => `translate(${d.x.toString()}, ${d.y.toString()})`,
      );
    });
  }, [graphContent, theme]);

  return (
    <svg
      ref={svgRef}
      className={"flex-grow-1 flex-shrink-1"}
      style={{ flexBasis: "50%" }}
    >
      <g></g>
    </svg>
  );
}

function closestPointsOnNodes(d: D3Link) {
  const x1 = d.source.x;
  const y1 = d.source.y;
  const x2 = d.target.x;
  const y2 = d.target.y;

  if (d.isLoop) {
    const loopSize = Math.min(90, 360 / d.source.degree) / 2;
    const angle = (d.parallelIndex / d.parallelCount) * 360 - 90;
    const length = d.source.radius;
    const ps = vector(x1, y1, angle - loopSize, length);
    const pe = vector(x1, y1, angle + loopSize, length);

    return {
      x1: ps.x,
      y1: ps.y,
      x2: pe.x,
      y2: pe.y,
    };
  } else {
    const r1 = d.source.radius;
    const r2 = d.target.radius;

    // Vector from c1 to c2
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Distance between the centers
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize the vector to get the direction
    const ux = dx / distance;
    const uy = dy / distance;

    return {
      x1: x1 + r1 * ux,
      y1: y1 + r1 * uy,
      x2: x2 - r2 * ux,
      y2: y2 - r2 * uy,
    };
  }
}

function curvedPath(d: D3Link) {
  const control = curvePoints(d);
  const points: [number, number][] = control.points.map(
    (c): [number, number] => [c.x, c.y],
  );

  if (d.isLoop) {
    return d3.line().curve(d3.curveCardinal.tension(-3))(points);
  } else if (d.parallelCount > 0) {
    return d3.line().curve(d3.curveCatmullRom)(points);
  } else {
    return d3.line()(points);
  }
}

function vector(
  x1: number,
  y1: number,
  angle: number,
  length: number,
): { x: number; y: number } {
  const angleInRadians = angle * (Math.PI / 180);
  const rx = length * Math.cos(angleInRadians);
  const ry = length * Math.sin(angleInRadians);
  const p = {
    x: x1 + rx,
    y: y1 + ry,
  };
  return p;
}

function fixDegAngle(angle: number): number {
  return angle > 90 || angle < -90 ? angle - 180 : angle;
}

function pushVectorOfCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  distance: number,
): { x: number; y: number } {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const orthX = y2 - y1;
  const orthY = -(x2 - x1);
  const orthLength = Math.sqrt(orthX * orthX + orthY * orthY);
  const dx = (orthX / orthLength) * distance;
  const dy = (orthY / orthLength) * distance;

  const controlX = midX + dx;
  const controlY = midY + dy;

  const p = {
    x: controlX,
    y: controlY,
  };
  return p;
}

function curvePoints(d: D3Link): {
  center: { x: number; y: number };
  angle: number;
  points: { x: number; y: number }[];
} {
  const { x1, y1, x2, y2 } = closestPointsOnNodes(d);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  const curvAmount = 13 + d.width;

  const p = pushVectorOfCurve(
    x1,
    y1,
    x2,
    y2,
    d.isLoop ? curvAmount * 4 : d.parallelIndex * curvAmount,
  );

  return {
    center: p,
    points: [{ x: x1, y: y1 }, p, { x: x2, y: y2 }],
    angle: fixDegAngle(angle),
  };
}
