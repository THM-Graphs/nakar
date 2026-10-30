import type { ElementData } from './ElementData';

/**
 * Describes a relationship with canonical and source-native endpoint identities.
 */
export interface EdgeData extends ElementData {
  /**
   * Canonical identity of the relationship start node.
   */
  startNodeId: string;

  /**
   * Canonical identity of the relationship end node.
   */
  endNodeId: string;

  /**
   * Source-native identity of the relationship start node.
   */
  startNativeNodeId: string;

  /**
   * Source-native identity of the relationship end node.
   */
  endNativeNodeId: string;

  /**
   * Discriminator selecting the concrete event, operation or relationship type.
   */
  type: string;
}
