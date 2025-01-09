import { GraphElements } from '../../neo4j/types/GraphElements';
import { SchemaGetInitialGraph } from '../../../../src-gen/schema';
import { createNode } from './createNode';
import { createRelationship } from './createRelationship';

export function createGraph(
  graphElements: GraphElements,
): SchemaGetInitialGraph {
  return {
    graph: {
      nodes: graphElements.nodes.map(createNode),
      edges: graphElements.relationships.map(createRelationship),
    },
    tableData: graphElements.tableData,
    graphMetaData: { labels: [] },
  };
}
