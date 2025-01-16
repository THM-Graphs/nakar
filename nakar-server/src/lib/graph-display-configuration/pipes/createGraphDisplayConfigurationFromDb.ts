import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';
import { inheritToNull } from './inheritToNull';
import { NodeDisplayConfiguration } from '../types/NodeDisplayConfiguration';
import { createNodeDisplayConfigurationFromDb } from './createNodeDisplayConfigurationFromDb';
import { DBGraphDisplayConfiguration } from '../../documents/types/DBGraphDisplayConfiguration';

export function createGraphDisplayConfigurationFromDb(
  dbConfig: DBGraphDisplayConfiguration | undefined | null,
): GraphDisplayConfiguration {
  return {
    connectResultNodes: inheritToNull(dbConfig?.connectResultNodes),
    growNodesBasedOnDegree: inheritToNull(dbConfig?.growNodesBasedOnDegree),
    compressRelationships: inheritToNull(dbConfig?.compressRelationships),
    nodeDisplayConfigurations:
      dbConfig?.nodeDisplayConfigurations?.map(
        (c): NodeDisplayConfiguration =>
          createNodeDisplayConfigurationFromDb(c),
      ) ?? [],
  };
}
