import { CanvasContextData } from "../../pages/Canvas.tsx";
import { NodeDto } from "../../../src-gen";

export type NodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContextData;
  isLoggedIn: boolean;
};
