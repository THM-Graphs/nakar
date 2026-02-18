import { ScaleType } from '../../physics/ScaleType';
import { Range } from '../../range/Range';
import { LiveCanvasViewSettingsDto } from '../../schema/dtos/LiveCanvasViewSettingsDto';
import { LiveCanvasLabelViewSettings } from './LiveCanvasLabelViewSettings';
import { SMap } from '../../map/Map';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import z from 'zod';
import { GraphNode } from '../graph/GraphNode';

export class LiveCanvasViewSettings {
  public static readonly defaultGrowNodesBasedOnDegreeFactor: number = 2;
  public static readonly defaultGrowNodesBasedOnDegree: boolean = false;
  public static readonly defaultCompressRelationshipsWidthFactor: number = 10;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    compressRelationshipsWidthFactor: z.number(),
    growNodesBasedOnDegree: z.boolean(),
    growNodesBasedOnDegreeFactor: z.number(),
    scaleType: z.enum(['linear', 'log2', 'logn', 'log10']),
    labelSettings: z.record(z.string(), LiveCanvasLabelViewSettings.schema),
  });

  private readonly _compressRelationshipsWidthFactor: number;
  private readonly _growNodesBasedOnDegree: boolean;
  private readonly _growNodesBasedOnDegreeFactor: number;
  private readonly _scaleType: ScaleType;
  private readonly _labelSettings: SMap<string, LiveCanvasLabelViewSettings>;

  public constructor(params: {
    compressRelationshipsWidthFactor: number;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    scaleType: ScaleType;
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
    this._scaleType = params.scaleType;
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

  public static fromPlain(
    data: z.infer<typeof LiveCanvasViewSettings.schema>,
  ): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor: data.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: data.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: data.growNodesBasedOnDegreeFactor,
      scaleType: data.scaleType,
      labelSettings: SMap.fromRecord(data.labelSettings).map(
        (
          labelSetting: z.infer<typeof LiveCanvasLabelViewSettings.schema>,
        ): LiveCanvasLabelViewSettings =>
          LiveCanvasLabelViewSettings.fromPlain(labelSetting),
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
      scaleType: 'linear',
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
      scaleType: 'linear',
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
              customRadius: viewSetting.customRadius,
              radius: viewSetting.radius,
            } satisfies LiveCanvasLabelViewSettingsDto,
          ];
        },
        [],
      ),
    };
  }

  public toPlain(): z.infer<typeof LiveCanvasViewSettings.schema> {
    return {
      compressRelationshipsWidthFactor: this.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this.growNodesBasedOnDegreeFactor,
      scaleType: this.scaleType,
      labelSettings: this.labelSettings
        .map(
          (
            labelSetting: LiveCanvasLabelViewSettings,
          ): z.infer<typeof LiveCanvasLabelViewSettings.schema> =>
            labelSetting.toPlain(),
        )
        .toRecord(),
    };
  }

  public getLabelSettings(label: string): LiveCanvasLabelViewSettings {
    const existing: LiveCanvasLabelViewSettings | null =
      this._labelSettings.get(label) ?? null;
    if (existing != null) {
      return existing;
    }
    const newEntry: LiveCanvasLabelViewSettings =
      new LiveCanvasLabelViewSettings({
        radius: GraphNode.defaultRadius,
        customRadius: false,
        colorIndex: LiveCanvasLabelViewSettings.getLeastOftenColorIndex(
          this._labelSettings
            .toValueArray()
            .map(
              (
                a: LiveCanvasLabelViewSettings,
              ): LiveCanvasLabelViewSettings['colorIndex'] => a.colorIndex,
            ),
        ),
      });
    this._labelSettings.set(label, newEntry);
    return newEntry;
  }
}
