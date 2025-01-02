import { z } from "zod";

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

export const ColorDtoSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("preset"),
    index: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
  }),
  z.object({
    type: z.literal("custom"),
    backgroundColor: z.string(),
    textColor: z.string(),
  }),
]);
export type ColorDto = z.infer<typeof ColorDtoSchema>;

export const PositionDtoSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionDtoSchema>;

export const GraphMetaDataLabelSchema = z.object({
  label: z.string(),
  color: ColorDtoSchema,
  count: z.number(),
});
export type GraphMetaDataLabel = z.infer<typeof GraphMetaDataLabelSchema>;

export const NodeDtoSchema = z.object({
  id: z.string(),
  displayTitle: z.string(),
  labels: z.array(GraphMetaDataLabelSchema),
  properties: z.array(GraphPropertyDtoSchema),
  size: z.number(),
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
});
export type GraphDto = z.infer<typeof GraphDtoSchema>;

export const GetDatabaseStructureDtoSchema = z.object({
  id: z.string(),
  stats: StatsDtoSchema,
});
export type GetDatabaseStructureDto = z.infer<
  typeof GetDatabaseStructureDtoSchema
>;

export const GraphMetaDataSchema = z.object({
  labels: z.array(GraphMetaDataLabelSchema),
});
export type GraphMetaData = z.infer<typeof GraphMetaDataSchema>;

export const GetInitialGraphDtoSchema = z.object({
  graph: GraphDtoSchema,
  graphMetaData: GraphMetaDataSchema,
  tableData: z.array(z.record(z.string(), z.string())),
});
export type GetInitialGraphDto = z.infer<typeof GetInitialGraphDtoSchema>;

export const GetScenariosDtoDatabaseScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  query: z.string(),
  description: z.string(),
  databaseId: z.string(),
  databaseTitle: z.string(),
  databaseUrl: z.string(),
  coverUrl: z.string().nullable(),
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
