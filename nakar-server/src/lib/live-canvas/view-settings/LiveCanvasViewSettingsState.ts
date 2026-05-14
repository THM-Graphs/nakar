import { ScaleType } from '../../physics/ScaleType';
import { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';

/**
 * Complete runtime state for live canvas visualization settings.
 */
export interface LiveCanvasViewSettingsState {
  /**
   * Factor used to scale the visual width of compressed relationships.
   */
  compressRelationshipsWidthFactor: number;

  /**
   * Whether nodes should grow visually according to their graph degree.
   */
  growNodesBasedOnDegree: boolean;

  /**
   * Factor used as the upper bound for degree-based node growth.
   */
  growNodesBasedOnDegreeFactor: number;

  /**
   * Scale type used when mapping graph metrics to visual values.
   */
  scaleType: ScaleType;

  /**
   * Materialized settings keyed by node label.
   */
  labelSettings: Record<string, LiveCanvasLabelViewSettingsState | undefined>;

  /**
   * Materialized settings keyed by relationship type.
   */
  edgeSettings: Record<string, LiveCanvasEdgeViewSettingsState | undefined>;
}
