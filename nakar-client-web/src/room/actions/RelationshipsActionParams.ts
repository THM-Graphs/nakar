import { CanvasContextData } from "../../pages/CanvasPage.tsx";
import { EdgeDto } from "../../../src-gen";

export type RelationshipsActionParams = {
  edges: EdgeDto[];
  roomContext: CanvasContextData;
};
