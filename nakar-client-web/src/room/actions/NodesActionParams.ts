import { CanvasContextData } from "../../pages/CanvasPage.tsx";
import { NodeDto } from "../../../src-gen";

export type NodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContextData;
  isLoggedIn: boolean;
};
