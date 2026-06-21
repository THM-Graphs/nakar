import type { Range } from '../../../packages/range/Range';
import type { LiveCanvasEdgeViewSettingsDto } from '../../schema/dtos/LiveCanvasEdgeViewSettingsDto';
import type { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import type { LiveCanvasViewSettingsColorIndex } from './LiveCanvasViewSettingsColorIndex';

/**
 * Centralizes defensive normalization rules for view settings values.
 */
export class LiveCanvasViewSettingsValidator {
  /**
   * Runtime color indexes keyed by persisted plain values.
   */
  private readonly _colorIndexByPlain: Record<
    '0' | '1' | '2' | '3' | '4' | '5',
    LiveCanvasViewSettingsColorIndex
  > = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
  };

  /**
   * Persisted plain color values keyed by runtime color indexes.
   */
  private readonly _plainByColorIndex: ['0', '1', '2', '3', '4', '5'] = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
  ];

  /**
   * Creates a validator for the configured numeric factor range.
   */
  public constructor(private readonly _factorRange: Range) {}

  /**
   * Clamps a global factor into the supported range.
   */
  public clampFactor(factor: number): number {
    return this._factorRange.clamp(factor);
  }

  /**
   * Returns only label settings for labels that exist in the current canvas.
   */
  public filterLabelSettings(
    labelSettings: LiveCanvasLabelViewSettingsDto[],
    labels: string[],
  ): LiveCanvasLabelViewSettingsDto[] {
    return labelSettings.filter(
      (labelSetting: LiveCanvasLabelViewSettingsDto): boolean =>
        labels.includes(labelSetting.label),
    );
  }

  /**
   * Returns only edge settings for edge types that exist in the current canvas.
   */
  public filterEdgeSettings(
    edgeSettings: LiveCanvasEdgeViewSettingsDto[],
    edgeTypes: string[],
  ): LiveCanvasEdgeViewSettingsDto[] {
    return edgeSettings.filter(
      (edgeSetting: LiveCanvasEdgeViewSettingsDto): boolean =>
        edgeTypes.includes(edgeSetting.edgeType),
    );
  }

  /**
   * Converts a possibly missing plain color value into a runtime color index.
   */
  public colorIndexFromPlain(
    colorIndex: '0' | '1' | '2' | '3' | '4' | '5' | undefined,
  ): LiveCanvasViewSettingsColorIndex {
    return this._colorIndexByPlain[colorIndex ?? '0'];
  }

  /**
   * Converts a runtime color index into the persisted plain representation.
   */
  public colorIndexToPlain(
    colorIndex: LiveCanvasViewSettingsColorIndex,
  ): '0' | '1' | '2' | '3' | '4' | '5' {
    return this._plainByColorIndex[colorIndex];
  }
}
