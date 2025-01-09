export type NodeDisplayConfigurationContext = Readonly<{
  id: string;
  labels: Record<string, true>;
  nameInQuery: Record<string, true>;
  properties: Record<string, unknown>;
  inDegree: number;
  outDegree: number;
  degree: number;
}>;
