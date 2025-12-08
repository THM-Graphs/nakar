/* eslint-disable @typescript-eslint/typedef */
import z from 'zod';

export const creationActionSchema = z.enum([
  'loadScenario',
  'expand',
  'query',
  'merge',
  'compress',
  'connectResultNodes',
  'search',
]);

export const propertyCollectionSchema = z.record(z.unknown());

export const nodeSchema = z.object({
  id: z.string(),
  nativeLabels: z.array(z.string()),
  properties: propertyCollectionSchema,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  namesInQuery: z.array(z.string()),
  locked: z.boolean(),
  source: z.string(),
  compressed: z.array(z.string()),
  creationAction: creationActionSchema,
});

export const relationshipSchema = z.object({
  id: z.string(),
  startNodeId: z.string(),
  endNodeId: z.string(),
  type: z.string(),
  compressed: z.array(z.string()),
  properties: propertyCollectionSchema,
  namesInQuery: z.array(z.string()),
  source: z.string(),
  creationAction: creationActionSchema,
});

export const graphSchema = z.object({
  id: z.string(),
  nodes: z.array(nodeSchema),
  relationships: z.array(relationshipSchema),
  metaData: z.object({
    scenarioId: z.string().nullable(),
    arguments: z.record(z.string(), z.string()),
  }),
  tableData: z.array(z.record(z.unknown())),
});

export type NAKARGraphNode = z.infer<typeof nodeSchema>;
export type NAKARGraphRelationship = z.infer<typeof relationshipSchema>;

export type NAKARGraphCreationReason = z.infer<typeof creationActionSchema>;

export type NAKARGraphState = z.infer<typeof graphSchema>;
