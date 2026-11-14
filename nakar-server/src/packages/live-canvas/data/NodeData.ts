import type { Position } from './Position';
import type { ElementData } from './ElementData';
import type { ScenarioGroupData } from './ScenarioGroupData';

/**
 * Describes a canvas node, its layout state and the associated notes and scenarios.
 */
export interface NodeData extends ElementData {
  /**
   * Node labels or per-label visualization settings, according to the containing data contract.
   */
  labels: string[];

  /**
   * Position in canvas coordinates; null means that no cursor position is available.
   */
  position: Position;

  /**
   * Whether physics must preserve the node position.
   */
  locked: boolean;

  /**
   * Optional adapter-resolved URL associated with the node.
   */
  url: string | null;

  /**
   * Optional adapter-resolved URL for the node cover image.
   */
  coverImageUrl: string | null;

  /**
   * Identities of notes associated with this node.
   */
  noteIds: string[];

  /**
   * Scenario groups applicable to the node’s labels.
   */
  scenarioGroups: ScenarioGroupData[];
}
