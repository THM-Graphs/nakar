const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tagName);
}

export function setAttr(
  element: Element,
  name: string,
  value: string | number | boolean | null,
): void {
  if (value === null || value === false) {
    element.removeAttribute(name);
    return;
  }
  if (value === true) {
    element.setAttribute(name, "");
    return;
  }
  element.setAttribute(name, value.toString());
}
