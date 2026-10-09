import { WebGLIndexedContainer } from "./WebGLIndexedContainer.ts";
import { WebGLEdge } from "./WebGLEdge.ts";

export class WebGLEdgesContainer extends WebGLIndexedContainer<WebGLEdge> {
  public constructor() {
    super("edges-container");
  }
}
