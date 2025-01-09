import { NodeDisplayConfiguration } from '../types/NodeDisplayConfiguration';
import { DBNodeDisplayConfiguration } from '../../documents/types/DBNodeDisplayConfiguration';

export function createNodeDisplayConfigurationFromDb(
  nodeDisplayConfig: DBNodeDisplayConfiguration,
): NodeDisplayConfiguration {
  return {
    targetLabel: nodeDisplayConfig.targetLabel ?? null,
    displayText: nodeDisplayConfig.displayText ?? null,
    radius: nodeDisplayConfig.radius ?? null,
    backgroundColor: nodeDisplayConfig.backgroundColor ?? null,
  };
}
