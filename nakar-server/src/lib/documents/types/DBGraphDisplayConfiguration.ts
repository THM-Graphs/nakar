import { DBGraphDisplayConfigurationBoolean } from './DBGraphDisplayConfigurationBoolean';
import { DBNodeDisplayConfiguration } from './DBNodeDisplayConfiguration';

export type DBGraphDisplayConfiguration = Readonly<{
  connectResultNodes?: DBGraphDisplayConfigurationBoolean | null;
  growNodesBasedOnDegree?: DBGraphDisplayConfigurationBoolean | null;
  nodeDisplayConfigurations?: DBNodeDisplayConfiguration[] | null;
}>;
