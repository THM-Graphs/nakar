import { GraphEdge } from '../graph/GraphEdge';
import { GraphNode } from '../graph/GraphNode';
import type { LiveCanvasEdgeViewSettingsDto } from '../../schema/dtos/LiveCanvasEdgeViewSettingsDto';
import type { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import type { LiveCanvasViewSettingsDto } from '../../schema/dtos/LiveCanvasViewSettingsDto';
import type { LiveCanvasEdgeViewSettingsPlain } from './LiveCanvasEdgeViewSettingsPlain';
import type { LiveCanvasEdgeViewSettingsState } from './LiveCanvasEdgeViewSettingsState';
import type { LiveCanvasLabelViewSettingsPlain } from './LiveCanvasLabelViewSettingsPlain';
import type { LiveCanvasLabelViewSettingsState } from './LiveCanvasLabelViewSettingsState';
import type { LiveCanvasViewSettingsDefaultValues } from './LiveCanvasViewSettingsDefaultValues';
import type { LiveCanvasViewSettingsPlain } from './LiveCanvasViewSettingsPlain';
import type { LiveCanvasViewSettingsState } from './LiveCanvasViewSettingsState';
import type { LiveCanvasViewSettingsValidator } from './LiveCanvasViewSettingsValidator';

/**
 * Maps view settings between runtime state, persisted plain data, and API DTOs.
 */
export class LiveCanvasViewSettingsMapper {
  /**
   * Creates a mapper with explicit default values and validation rules.
   */
  public constructor(
    private readonly _defaultValues: LiveCanvasViewSettingsDefaultValues,
    private readonly _validator: LiveCanvasViewSettingsValidator,
  ) {}

  /**
   * Creates a complete runtime state from persisted plain data.
   */
  public stateFromPlain(
    plain: LiveCanvasViewSettingsPlain,
  ): LiveCanvasViewSettingsState {
    return {
      compressRelationshipsWidthFactor: this._validator.clampFactor(
        plain.compressRelationshipsWidthFactor ??
          this._defaultValues.compressRelationshipsWidthFactor,
      ),
      growNodesBasedOnDegree:
        plain.growNodesBasedOnDegree ??
        this._defaultValues.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this._validator.clampFactor(
        plain.growNodesBasedOnDegreeFactor ??
          this._defaultValues.growNodesBasedOnDegreeFactor,
      ),
      scaleType: plain.scaleType ?? this._defaultValues.scaleType,
      labelSettings: Object.fromEntries(
        Object.entries(plain.labelSettings ?? {}).map(
          (
            entry: [string, LiveCanvasLabelViewSettingsPlain],
          ): [string, LiveCanvasLabelViewSettingsState] => {
            const [label, labelSettings]: [
              string,
              LiveCanvasLabelViewSettingsPlain,
            ] = entry;
            return [label, this._labelSettingsFromPlain(labelSettings)];
          },
        ),
      ),
      edgeSettings: Object.fromEntries(
        Object.entries(plain.edgeSettings ?? {}).map(
          (
            entry: [string, LiveCanvasEdgeViewSettingsPlain],
          ): [string, LiveCanvasEdgeViewSettingsState] => {
            const [edgeType, edgeSettings]: [
              string,
              LiveCanvasEdgeViewSettingsPlain,
            ] = entry;
            return [edgeType, this._edgeSettingsFromPlain(edgeSettings)];
          },
        ),
      ),
    };
  }

  /**
   * Creates a complete runtime state from the public API DTO.
   */
  public stateFromSchema(
    input: LiveCanvasViewSettingsDto,
    labels: string[],
    edgeTypes: string[],
  ): LiveCanvasViewSettingsState {
    return {
      compressRelationshipsWidthFactor: this._validator.clampFactor(
        input.compressRelationshipsWidthFactor,
      ),
      growNodesBasedOnDegree: input.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this._validator.clampFactor(
        input.growNodesBasedOnDegreeFactor,
      ),
      scaleType: this._defaultValues.scaleType,
      labelSettings: Object.fromEntries(
        this._validator
          .filterLabelSettings(input.labelSettings, labels)
          .map(
            (
              labelSettings: LiveCanvasLabelViewSettingsDto,
            ): [string, LiveCanvasLabelViewSettingsState] => [
              labelSettings.label,
              this._labelSettingsFromSchema(labelSettings),
            ],
          ),
      ),
      edgeSettings: Object.fromEntries(
        this._validator
          .filterEdgeSettings(input.edgeSettings, edgeTypes)
          .map(
            (
              edgeSettings: LiveCanvasEdgeViewSettingsDto,
            ): [string, LiveCanvasEdgeViewSettingsState] => [
              edgeSettings.edgeType,
              this._edgeSettingsFromSchema(edgeSettings),
            ],
          ),
      ),
    };
  }

  /**
   * Converts a runtime state into the persisted plain representation.
   */
  public toPlain(
    state: LiveCanvasViewSettingsState,
  ): LiveCanvasViewSettingsPlain {
    return {
      compressRelationshipsWidthFactor: state.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: state.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: state.growNodesBasedOnDegreeFactor,
      scaleType: state.scaleType,
      labelSettings: Object.fromEntries(
        Object.entries(state.labelSettings).flatMap(
          (
            entry: [string, LiveCanvasLabelViewSettingsState | undefined],
          ): [string, LiveCanvasLabelViewSettingsPlain][] => {
            const [label, labelSettings]: [
              string,
              LiveCanvasLabelViewSettingsState | undefined,
            ] = entry;
            return labelSettings != null
              ? [[label, this._labelSettingsToPlain(labelSettings)]]
              : [];
          },
        ),
      ),
      edgeSettings: Object.fromEntries(
        Object.entries(state.edgeSettings).flatMap(
          (
            entry: [string, LiveCanvasEdgeViewSettingsState | undefined],
          ): [string, LiveCanvasEdgeViewSettingsPlain][] => {
            const [edgeType, edgeSettings]: [
              string,
              LiveCanvasEdgeViewSettingsState | undefined,
            ] = entry;
            return edgeSettings != null
              ? [[edgeType, this._edgeSettingsToPlain(edgeSettings)]]
              : [];
          },
        ),
      ),
    };
  }

  /**
   * Converts one plain label settings object into runtime state.
   */
  private _labelSettingsFromPlain(
    labelSettings: LiveCanvasLabelViewSettingsPlain,
  ): LiveCanvasLabelViewSettingsState {
    return {
      radius: labelSettings.radius ?? GraphNode.defaultRadius,
      customRadius: labelSettings.customRadius ?? false,
      colorIndex: this._validator.colorIndexFromPlain(labelSettings.colorIndex),
      titleProperty: labelSettings.titleProperty ?? '',
      customTitleProperty: labelSettings.customTitleProperty ?? false,
    };
  }

  /**
   * Converts one plain edge settings object into runtime state.
   */
  private _edgeSettingsFromPlain(
    edgeSettings: LiveCanvasEdgeViewSettingsPlain,
  ): LiveCanvasEdgeViewSettingsState {
    return {
      width: edgeSettings.width ?? GraphEdge.defaultWidth,
      customWidth: edgeSettings.customWidth ?? false,
      colorIndex: this._validator.colorIndexFromPlain(edgeSettings.colorIndex),
      customColor: edgeSettings.customColor ?? false,
    };
  }

  /**
   * Converts one label settings DTO into runtime state.
   */
  private _labelSettingsFromSchema(
    labelSettings: LiveCanvasLabelViewSettingsDto,
  ): LiveCanvasLabelViewSettingsState {
    return {
      radius: labelSettings.radius,
      customRadius: labelSettings.customRadius,
      colorIndex: labelSettings.colorIndex,
      titleProperty: labelSettings.titleProperty,
      customTitleProperty: labelSettings.customTitleProperty,
    };
  }

  /**
   * Converts one edge settings DTO into runtime state.
   */
  private _edgeSettingsFromSchema(
    edgeSettings: LiveCanvasEdgeViewSettingsDto,
  ): LiveCanvasEdgeViewSettingsState {
    return {
      width: edgeSettings.width,
      customWidth: edgeSettings.customWidth,
      colorIndex: edgeSettings.colorIndex,
      customColor: edgeSettings.customColor,
    };
  }

  /**
   * Converts one runtime label settings object into persisted plain data.
   */
  private _labelSettingsToPlain(
    labelSettings: LiveCanvasLabelViewSettingsState,
  ): LiveCanvasLabelViewSettingsPlain {
    return {
      radius: labelSettings.radius,
      customRadius: labelSettings.customRadius,
      colorIndex: this._validator.colorIndexToPlain(labelSettings.colorIndex),
      titleProperty: labelSettings.titleProperty,
      customTitleProperty: labelSettings.customTitleProperty,
    };
  }

  /**
   * Converts one runtime edge settings object into persisted plain data.
   */
  private _edgeSettingsToPlain(
    edgeSettings: LiveCanvasEdgeViewSettingsState,
  ): LiveCanvasEdgeViewSettingsPlain {
    return {
      width: edgeSettings.width,
      customWidth: edgeSettings.customWidth,
      colorIndex: this._validator.colorIndexToPlain(edgeSettings.colorIndex),
      customColor: edgeSettings.customColor,
    };
  }
}
