import { CanvasContextData } from "../../pages/Canvas.tsx";
import { EdgeDto } from "../../../src-gen";

export type RelationshipsActionParams = {
  edges: EdgeDto[];
  roomContext: CanvasContextData;
};
