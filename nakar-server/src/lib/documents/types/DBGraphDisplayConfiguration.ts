import { DBGraphDisplayConfigurationBoolean } from './DBGraphDisplayConfigurationBoolean';
import { DBNodeDisplayConfiguration } from './DBNodeDisplayConfiguration';
import { DBScaleType } from './DBScaleType';

export type DBGraphDisplayConfiguration = Readonly<{
  connectResultNodes?: DBGraphDisplayConfigurationBoolean | null;
  growNodesBasedOnDegree?: DBGraphDisplayConfigurationBoolean | null;
  growNodesBasedOnDegreeFactor?: number | null;
  nodeDisplayConfigurations?: DBNodeDisplayConfiguration[] | null;
  compressRelationships?: DBGraphDisplayConfigurationBoolean | null;
  compressRelationshipsWidthFactor?: number | null;
  scaleType?: DBScaleType | null;
}>;
