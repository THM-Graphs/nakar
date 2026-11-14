import type { PropertyValue } from './PropertyValue';

/**
 * Stores the common identities, properties and cluster membership of a node or relationship.
 */
export interface ElementData {
  /**
   * Canonical identity of this domain object.
   */
  id: string;

  /**
   * Element identity assigned by the graph source.
   */
  nativeId: string;

  /**
   * Identity of the graph source used for the operation.
   */
  sourceId: string;

  /**
   * Optional display title of the graph source.
   */
  sourceTitle: string | null;

  /**
   * Source properties indexed by their original property names.
   */
  properties: Record<string, PropertyValue>;

  /**
   * Variable names under which the element occurred in the source query.
   */
  namesInQuery: string[];

  /**
   * Source-native identities represented by this cluster; empty for an individual element.
   */
  compressed: string[];

  /**
   * Canonical canvas identities represented by this cluster.
   */
  compressedIds: string[];

  /**
   * Origin recorded on graph elements inserted by this action.
   */
  creationReason: string;
}
