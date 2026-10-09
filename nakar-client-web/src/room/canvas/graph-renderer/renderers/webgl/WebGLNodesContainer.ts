import { WebGLIndexedContainer } from "./WebGLIndexedContainer.ts";
import { WebGLNode } from "./WebGLNode.ts";

export class WebGLNodesContainer extends WebGLIndexedContainer<WebGLNode> {
  public constructor() {
    super("nodes-container");
  }
}
