import { GraphDisplayConfiguration } from '../types/GraphDisplayConfiguration';
import { dbBooleanToNative } from './dbBooleanToNative';
import { NodeDisplayConfiguration } from '../types/NodeDisplayConfiguration';
import { createNodeDisplayConfigurationFromDb } from './createNodeDisplayConfigurationFromDb';
import { DBGraphDisplayConfiguration } from '../../documents/types/DBGraphDisplayConfiguration';
import { dbScaleTypeToNative } from './dbScaleTypeToNative';

export function createGraphDisplayConfigurationFromDb(
  dbConfig: DBGraphDisplayConfiguration | undefined | null,
): GraphDisplayConfiguration {
  return {
    connectResultNodes: dbBooleanToNative(dbConfig?.connectResultNodes),
    growNodesBasedOnDegree: dbBooleanToNative(dbConfig?.growNodesBasedOnDegree),
    growNodesBasedOnDegreeFactor:
      dbConfig?.growNodesBasedOnDegreeFactor ?? null,
    compressRelationships: dbBooleanToNative(dbConfig?.compressRelationships),
    nodeDisplayConfigurations:
      dbConfig?.nodeDisplayConfigurations?.map(
        (c): NodeDisplayConfiguration =>
          createNodeDisplayConfigurationFromDb(c),
      ) ?? [],
    scaleType: dbScaleTypeToNative(dbConfig?.scaleType),
  };
}
