import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { EdgeDto } from "../../../src-gen";

export type RelationshipsActionParams = {
  edges: EdgeDto[];
  roomContext: CanvasContext;
};
