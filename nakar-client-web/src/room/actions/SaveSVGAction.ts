import { Action, ActionShortcut } from "./Action.ts";
import { saveAs } from "file-saver";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export type SaveSVGActionParams = {
  selectedTab: SelectedCanvasTab;
};

export class SaveSVGAction extends Action<SaveSVGActionParams> {
  public static shared: SaveSVGAction = new SaveSVGAction();

  protected action(): Promise<void> | void {
    const svgCanvas: HTMLElement | null = document.getElementById("svg-canvas");
    if (svgCanvas == null) {
      throw new Error("Canvas not found.");
    }

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const sourceGroup = svgCanvas.querySelector<SVGGElement>("g");
    const boundingBox = sourceGroup?.getBBox();
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
    svg.setAttribute("width", dimensions.width.toString());
    svg.setAttribute("height", dimensions.height.toString());
    svg.setAttribute("viewBox", dimensions.viewBox);

    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = "NAKAR Export";
    svg.appendChild(title);
    const desc = document.createElementNS("http://www.w3.org/2000/svg", "desc");
    desc.textContent = "Created using NAKAR";
    svg.appendChild(desc);
    // svg
    //   .append("rect")
    //   .attr("x", `${boundingBox.x.toString()}pt`)
    //   .attr("y", `${boundingBox.y.toString()}pt`)
    //   .attr("width", `${boundingBox.width.toString()}pt`)
    //   .attr("height", `${boundingBox.height.toString()}pt`)
    //   .attr("fill", theme == "dark" ? "rgb(33, 37, 41)" : "#fff");
    const style = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "style",
    );
    style.textContent = "* { font-family: system-ui }";
    svg.appendChild(style);

    const clone = sourceGroup?.cloneNode(true);
    if (clone == null) {
      throw new Error("Unable to clone canvas element.");
    }
    svg.appendChild(clone);

    const clonedGroup = svg.querySelector("g");
    if (clonedGroup != null) {
      clonedGroup.setAttribute("transform", "");
    }
    svg.querySelectorAll("[hidden]").forEach((el) => {
      el.remove();
    });
    // svg.selectAll(".nodeLockedOverlay").remove();
    // svg.selectAll(".nodeSelectedOverlay").remove();
    svg.querySelectorAll(".bi").forEach((el) => {
      el.remove();
    });

    const htmlCharacterRefToNumericalRef = (node: SVGSVGElement) =>
      new window.XMLSerializer()
        .serializeToString(node)
        .replace(/&nbsp;/g, "&#160;");

    const svgData = htmlCharacterRefToNumericalRef(svg);

    saveAs(
      new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      }),
      "nakar-graph.svg",
      { autoBom: false },
    );
  }

  disabled(input: SaveSVGActionParams): boolean {
    return (
      document.getElementById("svg-canvas") == null ||
      input.selectedTab !== "graph"
    );
  }

  icon(): string {
    return "floppy";
  }

  slug(): string {
    return "save-svg";
  }

  title(): string {
    return "Save as SVG-File";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+s");
  }
}
