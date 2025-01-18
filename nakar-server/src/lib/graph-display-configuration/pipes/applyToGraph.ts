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
import { compressRelationships } from './transformers/compressRelationships';
import { profileAsync } from '../../profile/pipes/profile';

export async function applyToGraph(
  graph: SchemaGetInitialGraph,
  displayConfiguration: GraphDisplayConfiguration,
  credentials: LoginCredentials,
): Promise<SchemaGetInitialGraph> {
  const transformers: Record<string, Transformer> = {
    applyConnectNodes: applyConnectNodes(credentials),
    compressRelationships: compressRelationships(),
    applyLabels: applyLabels(),
    applyNodeDegrees: applyNodeDegrees(),
    applyEdgeParallelCounts: applyEdgeParallelCounts(),
    applyNodeConfigurationContext: applyNodeConfigurationContext(),
    applyNodeDisplayText: applyNodeDisplayText(),
    applyNodeRadius: applyNodeRadius(),
    applyNodeBackgroundColor: applyNodeBackgroundColor(),
    applyGrowNodeBasedOnDegree: applyGrowNodeBasedOnDegree(),
  };

  return await Object.entries(transformers).reduce<
    Promise<SchemaGetInitialGraph>
  >(
    (
      previousGraph: Promise<SchemaGetInitialGraph>,
      [key, transformer],
    ): Promise<SchemaGetInitialGraph> =>
      previousGraph.then(
        (
          transformedGraph: SchemaGetInitialGraph,
        ): Promise<SchemaGetInitialGraph> | SchemaGetInitialGraph =>
          profileAsync(
            key,
            async () =>
              await transformer(transformedGraph, displayConfiguration),
          ),
      ),
    Promise.resolve(graph),
  );
}
