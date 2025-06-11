import { Edge, Node } from "../../../../../src-gen";

export type InspectorElement =
  | { type: "node"; node: Node }
  | { type: "edge"; edge: Edge };
