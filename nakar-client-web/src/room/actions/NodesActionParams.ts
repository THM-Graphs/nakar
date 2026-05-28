import { CanvasContextData } from "../../pages/Canvas.tsx";
import { NodeDto } from "api-client";

export type NodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContextData;
  isLoggedIn: boolean;
};
