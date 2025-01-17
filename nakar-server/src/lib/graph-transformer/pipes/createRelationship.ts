import { SchemaEdge, SchemaGraphProperty } from '../../../../src-gen/schema';
import { AugmentedRelationship } from '../../neo4j/types/AugmentedRelationship';

export function createRelationship(
  relationship: AugmentedRelationship,
): SchemaEdge {
  return {
    id: relationship.elementId,
    startNodeId: relationship.startNodeElementId,
    endNodeId: relationship.endNodeElementId,
    type: relationship.type,
    isLoop: relationship.startNodeElementId === relationship.endNodeElementId,
    parallelCount: 1,
    parallelIndex: 0,
    compressedCount: 1,
    width: 2,
    properties: Object.entries(relationship.properties).map(
      (entry): SchemaGraphProperty => ({
        slug: entry[0],
        value: entry[1],
      }),
    ),
    namesInQuery: [...relationship.keys.values()],
  };
}
