import { CanvasContextData } from "../../pages/Canvas.tsx";
import { EdgeDto } from "api-client";

export type RelationshipsActionParams = {
  edges: EdgeDto[];
  roomContext: CanvasContextData;
};
