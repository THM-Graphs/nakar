import { Result } from '@strapi/types/dist/modules/documents/result';
import { ScaleType } from '../../physics/ScaleType';
import { Range } from '../../range/Range';
import { LiveCanvasViewSettingsDto } from '../../schema/dtos/LiveCanvasViewSettingsDto';
import { LiveCanvasLabelViewSettings } from './LiveCanvasLabelViewSettings';
import { SMap } from '../../map/Map';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';

export class LiveCanvasViewSettings {
  public static readonly defaultGrowNodesBasedOnDegreeFactor: number = 2;
  public static readonly defaultGrowNodesBasedOnDegree: boolean = false;
  public static readonly defaultCompressRelationshipsWidthFactor: number = 10;

  private readonly _compressRelationshipsWidthFactor: number;
  private readonly _growNodesBasedOnDegree: boolean;
  private readonly _growNodesBasedOnDegreeFactor: number;
  private readonly _scaleType: ScaleType;
  private readonly _labelSettings: SMap<string, LiveCanvasLabelViewSettings>;

  public constructor(params: {
    compressRelationshipsWidthFactor: number;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    labelSettings: SMap<string, LiveCanvasLabelViewSettings>;
  }) {
    this._compressRelationshipsWidthFactor = Range.clamp(
      params.compressRelationshipsWidthFactor,
      1,
      1000,
    );
    this._growNodesBasedOnDegree = params.growNodesBasedOnDegree;
    this._growNodesBasedOnDegreeFactor = Range.clamp(
      params.growNodesBasedOnDegreeFactor,
      1,
      1000,
    );
    this._scaleType = 'linear';
    this._labelSettings = params.labelSettings;
  }

  public get compressRelationshipsWidthFactor(): number {
    return this._compressRelationshipsWidthFactor;
  }

  public get growNodesBasedOnDegree(): boolean {
    return this._growNodesBasedOnDegree;
  }

  public get growNodesBasedOnDegreeFactor(): number {
    return this._growNodesBasedOnDegreeFactor;
  }

  public get scaleType(): ScaleType {
    return this._scaleType;
  }

  public get labelSettings(): SMap<string, LiveCanvasLabelViewSettings> {
    return this._labelSettings;
  }

  public static fromDB(
    canvas: Result<'api::canvas.canvas'>,
    canvasLabelViewSettings: Result<'api::canvas-label-setting.canvas-label-setting'>[],
  ): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor:
        canvas.compressRelationshipsWidthFactor ??
        LiveCanvasViewSettings.defaultCompressRelationshipsWidthFactor,
      growNodesBasedOnDegree:
        canvas.growNodesBasedOnDegree ??
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        canvas.growNodesBasedOnDegreeFactor ??
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegreeFactor,
      labelSettings: canvasLabelViewSettings.reduce(
        (
          akku: SMap<string, LiveCanvasLabelViewSettings>,
          next: Result<'api::canvas-label-setting.canvas-label-setting'>,
        ): SMap<string, LiveCanvasLabelViewSettings> => {
          const label: string | null = next.label ?? null;
          if (label == null) {
            return akku;
          }
          return akku.bySetting(
            label,
            LiveCanvasLabelViewSettings.fromDb(next),
          );
        },
        new SMap(),
      ),
    });
  }

  public static fromSchema(
    input: LiveCanvasViewSettingsDto,
    labels: string[],
  ): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor: input.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: input.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: input.growNodesBasedOnDegreeFactor,
      labelSettings: input.labelSettings
        .filter((labelSetting: LiveCanvasLabelViewSettingsDto): boolean =>
          // Do not accept label settings of labels that don't exist.
          labels.includes(labelSetting.label),
        )
        .reduce<SMap<string, LiveCanvasLabelViewSettings>>(
          (
            akku: SMap<string, LiveCanvasLabelViewSettings>,
            next: LiveCanvasLabelViewSettingsDto,
          ): SMap<string, LiveCanvasLabelViewSettings> => {
            return akku.bySetting(
              next.label,
              LiveCanvasLabelViewSettings.fromSchema(next),
            );
          },
          new SMap(),
        ),
    });
  }

  public static defaultViewSettings(): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor:
        LiveCanvasViewSettings.defaultCompressRelationshipsWidthFactor,
      growNodesBasedOnDegree:
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegreeFactor,
      labelSettings: new SMap(),
    });
  }

  public toSchema(labels: string[]): LiveCanvasViewSettingsDto {
    return {
      compressRelationshipsWidthFactor: this._compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this._growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this._growNodesBasedOnDegreeFactor,
      labelSettings: labels.reduce<LiveCanvasLabelViewSettingsDto[]>(
        (
          akku: LiveCanvasLabelViewSettingsDto[],
          label: string,
        ): LiveCanvasLabelViewSettingsDto[] => {
          const viewSetting: LiveCanvasLabelViewSettings =
            this.getLabelSettings(label);
          return [
            ...akku,
            {
              label: label,
              colorIndex: viewSetting.colorIndex,
              customColorIndex: viewSetting.customColorIndex,
              customRadius: viewSetting.customRadius,
              radius: viewSetting.radius,
            },
          ];
        },
        [],
      ),
    };
  }

  public toDBData(): Input<'api::canvas.canvas'> {
    return {
      compressRelationshipsWidthFactor: this.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this.growNodesBasedOnDegreeFactor,
    };
  }

  public getLabelSettings(label: string): LiveCanvasLabelViewSettings {
    return (
      this._labelSettings.get(label) ?? LiveCanvasLabelViewSettings.default()
    );
  }
}
