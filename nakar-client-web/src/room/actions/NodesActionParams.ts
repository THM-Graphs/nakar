import { Node } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type NodesActionParams = {
  nodes: Node[];
  roomContext: CanvasContext;
};
