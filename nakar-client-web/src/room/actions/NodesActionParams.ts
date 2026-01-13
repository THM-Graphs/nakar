import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { NodeDto } from "../../../src-gen";

export type NodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContext;
};
