import type { GraphData } from './GraphData';
import type { ViewSettingsData } from './ViewSettingsData';

/**
 * Contains the complete structured-cloneable canvas snapshot: graph content and visualization settings.
 */
export interface CanvasData {
  /**
   * Complete graph, query, note and scenario state.
   */
  graph: GraphData;

  /**
   * Visualization configuration associated with the graph.
   */
  viewSettings: ViewSettingsData;
}
