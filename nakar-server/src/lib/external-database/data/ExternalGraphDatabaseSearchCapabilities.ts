import type { SMap } from '../../../packages/map/Map';
import type { SSet } from '../../../packages/set/Set';

export interface ExternalGraphDatabaseSearchCapabilities {
  canExactMatchNativeId: boolean;
  canExactMatchLabel: boolean;
  exactMatchNodeProperties: SMap<string, SSet<string>>;
  fuzzyMatchNodeProperties: SMap<string, SSet<string>>;
}
