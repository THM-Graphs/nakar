export type InspectorElement =
  | { type: "node"; nodeId: string }
  | { type: "edge"; edgeId: string };
