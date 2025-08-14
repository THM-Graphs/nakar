import { Edge } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export type RelationshipsActionParams = {
  edges: Edge[];
  roomContext: RoomContext;
};
