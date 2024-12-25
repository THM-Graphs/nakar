import { z } from 'zod';

export const StatsDtoSchema = z.object({
  labelCount: z.string(),
  relTypeCount: z.string(),
  propertyKeyCount: z.string(),
  nodeCount: z.string(),
  relCount: z.string(),
  labels: z.array(
    z.object({
      label: z.string(),
      count: z.string(),
    }),
  ),
  relTypes: z.array(
    z.object({
      relationship: z.string(),
      count: z.string(),
    }),
  ),
  relTypesCount: z.array(
    z.object({
      relationship: z.string(),
      count: z.string(),
    }),
  ),
});
export type StatsDto = z.infer<typeof StatsDtoSchema>;

export const GraphPropertyDtoSchema = z.object({
  slug: z.string(),
  value: z.string(),
});
export type GraphPropertyDto = z.infer<typeof GraphPropertyDtoSchema>;

export const PositionDtoSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export const NodeDtoSchema = z.object({
  id: z.string(),
  displayTitle: z.string(),
  labels: z.array(z.string()),
  properties: z.array(GraphPropertyDtoSchema),
  size: z.number(),
  backgroundColor: z.string(),
  displayTitleColor: z.string(),
  position: PositionDtoSchema,
});
export type NodeDto = z.infer<typeof NodeDtoSchema>;

export const EdgeDtoSchema = z.object({
  id: z.string(),
  startNodeId: z.string(),
  endNodeId: z.string(),
  type: z.string(),
  properties: z.array(GraphPropertyDtoSchema),
});
export type EdgeDto = z.infer<typeof EdgeDtoSchema>;

export const GraphDtoSchema = z.object({
  nodes: z.array(NodeDtoSchema),
  edges: z.array(EdgeDtoSchema),
  tableData: z.array(z.record(z.string(), z.string())),
});
export type GraphDto = z.infer<typeof GraphDtoSchema>;

export const GetDatabaseStructureDtoSchema = z.object({
  id: z.string(),
  stats: StatsDtoSchema,
});
export type GetDatabaseStructureDto = z.infer<
  typeof GetDatabaseStructureDtoSchema
>;

export const GetInitialGraphDtoSchema = z.object({
  graph: GraphDtoSchema,
});
export type GetInitialGraphDto = z.infer<typeof GetInitialGraphDtoSchema>;

export const GetScenariosDtoDatabaseScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  query: z.string(),
  databaseId: z.string(),
  databaseTitle: z.string(),
  databaseUrl: z.string(),
  coverUrl: z.string().optional(),
});
export type GetScenariosDtoDatabaseScenario = z.infer<
  typeof GetScenariosDtoDatabaseScenarioSchema
>;
export const GetScenariosDtoDatabaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  scenarios: z.array(GetScenariosDtoDatabaseScenarioSchema),
});
export type GetScenariosDtoDatabase = z.infer<
  typeof GetScenariosDtoDatabaseSchema
>;
export const GetScenariosDtoSchema = z.object({
  databases: z.array(GetScenariosDtoDatabaseSchema),
});
export type GetScenariosDto = z.infer<typeof GetScenariosDtoSchema>;
