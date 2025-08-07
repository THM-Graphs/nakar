import * as d3 from "d3";
import { saveAs } from "file-saver";
import { useBearStore } from "../state/useBearStore.ts";

export function exportSVG() {
  const svgCanvas: HTMLElement | null = document.getElementById("svg-canvas");
  if (svgCanvas == null) {
    throw new Error("Canvas not found.");
  }

  const svg = d3.select(
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  );

  const boundingBox = d3
    .select(svgCanvas)
    .select<SVGGElement>("g")
    .node()
    ?.getBBox();
  if (boundingBox == null) {
    throw new Error("Unable to get bounding box");
  }
  const dimensions = {
    width: boundingBox.width,
    height: boundingBox.height,
    viewBox: [
      boundingBox.x,
      boundingBox.y,
      boundingBox.width,
      boundingBox.height,
    ].join(" "),
  };
  svg.attr("width", dimensions.width);
  svg.attr("height", dimensions.height);
  svg.attr("viewBox", dimensions.viewBox);

  svg.append("title").text("NAKAR Export");
  svg.append("desc").text("Created using NAKAR");
  // svg
  //   .append("rect")
  //   .attr("x", `${boundingBox.x.toString()}pt`)
  //   .attr("y", `${boundingBox.y.toString()}pt`)
  //   .attr("width", `${boundingBox.width.toString()}pt`)
  //   .attr("height", `${boundingBox.height.toString()}pt`)
  //   .attr("fill", theme == "dark" ? "rgb(33, 37, 41)" : "#fff");
  svg.append("style").text("* { font-family: system-ui }");

  d3.select(svgCanvas)
    .select<SVGGElement>("g")
    .each(function () {
      const clone = d3
        .select<SVGGElement, unknown>(this)
        .node()
        ?.cloneNode(true);
      if (clone == null) {
        throw new Error("Unable to clone canvas element.");
      } else {
        svg.node()?.appendChild(clone);
      }
    });

  svg.select("g").attr("transform", "");
  svg.selectAll("[hidden]").remove();
  // svg.selectAll(".nodeLockedOverlay").remove();
  // svg.selectAll(".nodeSelectedOverlay").remove();

  const htmlCharacterRefToNumericalRef = (node: SVGSVGElement) =>
    new window.XMLSerializer()
      .serializeToString(node)
      .replace(/&nbsp;/g, "&#160;");

  const node = svg.node();
  if (node == null) {
    throw new Error("Unable to get node from svg element.");
  }

  const svgData = htmlCharacterRefToNumericalRef(node);

  saveAs(
    new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    }),
    "nakar-graph.svg",
    { autoBom: false },
  );
}
