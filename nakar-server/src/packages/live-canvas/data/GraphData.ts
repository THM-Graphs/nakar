import type { PropertyValue } from './PropertyValue';
import type { NodeData } from './NodeData';
import type { EdgeData } from './EdgeData';
import type { NoteData } from './NoteData';
import type { ParameterData } from './ParameterData';

/**
 * Contains graph elements, query table, notes and the active scenario parameter state.
 */
export interface GraphData {
  /**
   * Canonical node records currently present on the canvas.
   */
  nodes: NodeData[];

  /**
   * Canonical relationship records currently present on the canvas.
   */
  edges: EdgeData[];

  /**
   * Normalized query result rows indexed by column name.
   */
  table: Record<string, PropertyValue>[];

  /**
   * Notes relevant to the current graph.
   */
  notes: NoteData[];

  /**
   * Active scenario identity; null indicates no selected scenario.
   */
  scenarioId: string | null;

  /**
   * Resolved parameter values indexed by scenario parameter identifier.
   */
  arguments: Record<string, string>;

  /**
   * Parameter definitions exposed by the scenario.
   */
  parameters: ParameterData[];
}
