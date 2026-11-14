import type { QueryResult } from '../data/QueryResult';
import type { GraphRequest } from './GraphRequest';

/**
 * Resolves normalized graph requests using a host-specific source implementation.
 */
export interface GraphSourceDelegate {
  /**
   * Serializes an authorized action, commits its completed draft and emits the corresponding changes.
   * @param sourceId - Identity of the graph source used for the operation.
   * @param request - Normalized operation forwarded to the source.
   * @returns Normalized graph and table data for the requested source operation.
   */
  execute(sourceId: string, request: GraphRequest): Promise<QueryResult>;
}
