import { GraphEdge } from '../graph/GraphEdge';
import { GraphNode } from '../graph/GraphNode';
import { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import { LiveCanvasViewSettingsColorAssignment } from './LiveCanvasViewSettingsColorAssignment';
import { LiveCanvasViewSettingsDefaultValues } from './LiveCanvasViewSettingsDefaultValues';
import { LiveCanvasViewSettingsState } from './LiveCanvasViewSettingsState';

/**
 * Creates complete, valid view settings state objects.
 */
export class LiveCanvasViewSettingsFactory {
  /**
   * Creates a factory with defaults and a color assignment strategy.
   */
  public constructor(
    private readonly _defaultValues: LiveCanvasViewSettingsDefaultValues = new LiveCanvasViewSettingsDefaultValues(),
    private readonly _colorAssignment: LiveCanvasViewSettingsColorAssignment = new LiveCanvasViewSettingsColorAssignment(),
  ) {}

  /**
   * Creates an empty settings state with all global defaults initialized.
   */
  public createDefaultState(): LiveCanvasViewSettingsState {
    return {
      compressRelationshipsWidthFactor:
        this._defaultValues.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this._defaultValues.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        this._defaultValues.growNodesBasedOnDegreeFactor,
      scaleType: this._defaultValues.scaleType,
      labelSettings: {},
      edgeSettings: {},
    };
  }

  /**
   * Creates complete settings for a new label and assigns a stable initial
   * color based on the labels that already have settings.
   */
  public createLabelSettings(
    existingSettings: Record<
      string,
      LiveCanvasLabelViewSettingsState | undefined
    >,
  ): LiveCanvasLabelViewSettingsState {
    return {
      radius: GraphNode.defaultRadius,
      customRadius: false,
      colorIndex: this._colorAssignment.assign(existingSettings),
      customTitleProperty: false,
      titleProperty: '',
    };
  }

  /**
   * Creates complete settings for a new edge type.
   */
  public createEdgeSettings(): LiveCanvasEdgeViewSettingsState {
    return {
      width: GraphEdge.defaultWidth,
      customWidth: false,
      colorIndex: 0,
      customColor: false,
    };
  }
}
