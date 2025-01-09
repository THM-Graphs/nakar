import { SchemaGetInitialGraph } from '../../../../src-gen/schema';
import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';
import { applyConnectNodes } from './transformers/applyConnectNodes';
import { LoginCredentials } from '../../neo4j/types/LoginCredentials';
import { Transformer } from '../types/Transformer';
import { applyLabels } from './transformers/applyLabels';
import { applyNodeDegrees } from './transformers/applyNodeDegrees';
import { applyEdgeParallelCounts } from './transformers/applyEdgeParallelCounts';
import { applyNodeConfigurationContext } from './transformers/applyNodeConfigurationContext';
import { applyNodeDisplayText } from './transformers/applyNodeDisplayText';
import { applyNodeRadius } from './transformers/applyNodeRadius';
import { applyNodeBackgroundColor } from './transformers/applyNodeBackgroundColor';
import { applyGrowNodeBasedOnDegree } from './transformers/applyGrowNodeBasedOnDegree';

export async function applyToGraph(
  graph: SchemaGetInitialGraph,
  displayConfiguration: GraphDisplayConfiguration,
  credentials: LoginCredentials,
): Promise<SchemaGetInitialGraph> {
  const transformers: Transformer[] = [
    applyConnectNodes(credentials),
    applyLabels(),
    applyNodeDegrees(),
    applyEdgeParallelCounts(),

    applyNodeConfigurationContext(),
    applyNodeDisplayText(),
    applyNodeRadius(),
    applyNodeBackgroundColor(),

    applyGrowNodeBasedOnDegree(),
  ];

  return await transformers.reduce<Promise<SchemaGetInitialGraph>>(
    (
      previousGraph: Promise<SchemaGetInitialGraph>,
      transformer: Transformer,
    ): Promise<SchemaGetInitialGraph> =>
      previousGraph.then(
        (
          transformedGraph: SchemaGetInitialGraph,
        ): Promise<SchemaGetInitialGraph> | SchemaGetInitialGraph =>
          transformer(transformedGraph, displayConfiguration),
      ),
    Promise.resolve(graph),
  );
}
