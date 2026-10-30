import type { PropertyValue } from './PropertyValue';
import type { NodeData } from './NodeData';
import type { EdgeData } from './EdgeData';

/**
 * Contains normalized graph and table data returned by a graph source delegate.
 */
export interface QueryResult {
  /**
   * Nodes represented by this graph or source result.
   */
  nodes: NodeData[];

  /**
   * Relationships or per-relationship-type settings in the containing data contract.
   */
  edges: EdgeData[];

  /**
   * Normalized query result rows indexed by column name.
   */
  table: Record<string, PropertyValue>[];

  /**
   * Whether the source stopped because its result limit was reached.
   */
  limitReached: boolean;
}
