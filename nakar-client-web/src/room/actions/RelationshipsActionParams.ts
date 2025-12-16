import { Edge } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type RelationshipsActionParams = {
  edges: Edge[];
  roomContext: CanvasContext;
};
