import { ScaleType } from '../../physics/ScaleType';
import { Range } from '../../range/Range';
import { LiveCanvasViewSettingsDto } from '../../schema/dtos/LiveCanvasViewSettingsDto';
import { LiveCanvasLabelViewSettings } from './LiveCanvasLabelViewSettings';
import { SMap } from '../../map/Map';
import { LiveCanvasLabelViewSettingsDto } from '../../schema/dtos/LiveCanvasLabelViewSettingsDto';
import z from 'zod';
import { GraphNode } from '../graph/GraphNode';
import { LiveCanvasEdgeViewSettings } from './LiveCanvasEdgeViewSettings';
import { LiveCanvasEdgeViewSettingsDto } from '../../schema/dtos/LiveCanvasEdgeViewSettingsDto';
import { GraphEdge } from '../graph/GraphEdge';

export class LiveCanvasViewSettings {
  public static readonly defaultGrowNodesBasedOnDegreeFactor: number = 2;
  public static readonly defaultGrowNodesBasedOnDegree: boolean = false;
  public static readonly defaultCompressRelationshipsWidthFactor: number = 10;
  public static readonly defaultScaleType: ScaleType = 'linear';

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    compressRelationshipsWidthFactor: z.number().optional(),
    growNodesBasedOnDegree: z.boolean().optional(),
    growNodesBasedOnDegreeFactor: z.number().optional(),
    scaleType: z.enum(['linear', 'log2', 'logn', 'log10']).optional(),
    labelSettings: z
      .record(z.string(), LiveCanvasLabelViewSettings.schema)
      .optional(),
    edgeSettings: z
      .record(z.string(), LiveCanvasEdgeViewSettings.schema)
      .optional(),
  });

  private readonly _compressRelationshipsWidthFactor: number;
  private readonly _growNodesBasedOnDegree: boolean;
  private readonly _growNodesBasedOnDegreeFactor: number;
  private readonly _scaleType: ScaleType;
  private readonly _labelSettings: SMap<string, LiveCanvasLabelViewSettings>;
  private readonly _edgeSettings: SMap<string, LiveCanvasEdgeViewSettings>;

  public constructor(params: {
    compressRelationshipsWidthFactor: number;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
    scaleType: ScaleType;
    labelSettings: SMap<string, LiveCanvasLabelViewSettings>;
    edgeSettings: SMap<string, LiveCanvasEdgeViewSettings>;
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
    this._edgeSettings = params.edgeSettings;
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

  public get edgeSettings(): SMap<string, LiveCanvasEdgeViewSettings> {
    return this._edgeSettings;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasViewSettings.schema>,
  ): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor:
        data.compressRelationshipsWidthFactor ??
        LiveCanvasViewSettings.defaultCompressRelationshipsWidthFactor,
      growNodesBasedOnDegree:
        data.growNodesBasedOnDegree ??
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor:
        data.growNodesBasedOnDegreeFactor ??
        LiveCanvasViewSettings.defaultGrowNodesBasedOnDegreeFactor,
      scaleType: data.scaleType ?? LiveCanvasViewSettings.defaultScaleType,
      labelSettings: SMap.fromRecord(data.labelSettings ?? {}).map(
        (
          labelSetting: z.infer<typeof LiveCanvasLabelViewSettings.schema>,
        ): LiveCanvasLabelViewSettings =>
          LiveCanvasLabelViewSettings.fromPlain(labelSetting),
      ),
      edgeSettings: SMap.fromRecord(data.edgeSettings ?? {}).map(
        (
          edgeSetting: z.infer<typeof LiveCanvasEdgeViewSettings.schema>,
        ): LiveCanvasEdgeViewSettings =>
          LiveCanvasEdgeViewSettings.fromPlain(edgeSetting),
      ),
    });
  }

  public static fromSchema(
    input: LiveCanvasViewSettingsDto,
    labels: string[],
    edgeTypes: string[],
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
      edgeSettings: input.edgeSettings
        .filter((edgeSetting: LiveCanvasEdgeViewSettingsDto): boolean =>
          // Do not accept edge settings of edge types that don't exist.
          edgeTypes.includes(edgeSetting.edgeType),
        )
        .reduce<SMap<string, LiveCanvasEdgeViewSettings>>(
          (
            akku: SMap<string, LiveCanvasEdgeViewSettings>,
            next: LiveCanvasEdgeViewSettingsDto,
          ): SMap<string, LiveCanvasEdgeViewSettings> => {
            return akku.bySetting(
              next.edgeType,
              LiveCanvasEdgeViewSettings.fromSchema(next),
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
      edgeSettings: new SMap(),
      scaleType: LiveCanvasViewSettings.defaultScaleType,
    });
  }

  public byMergingWith(other: LiveCanvasViewSettings): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor: other.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: other.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: other.growNodesBasedOnDegreeFactor,
      scaleType: other.scaleType,
      labelSettings: this.labelSettings.byMergingAndOverwritingWith(
        other.labelSettings,
      ),
      edgeSettings: this.edgeSettings.byMergingAndOverwritingWith(
        other.edgeSettings,
      ),
    });
  }

  public toSchema(
    labels: string[],
    edgeTypes: string[],
  ): LiveCanvasViewSettingsDto {
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
          return [...akku, viewSetting.toSchema(label)];
        },
        [],
      ),
      edgeSettings: edgeTypes.reduce<LiveCanvasEdgeViewSettingsDto[]>(
        (
          akku: LiveCanvasEdgeViewSettingsDto[],
          edgeType: string,
        ): LiveCanvasEdgeViewSettingsDto[] => {
          const viewSetting: LiveCanvasEdgeViewSettings =
            this.getEdgeSettings(edgeType);
          return [...akku, viewSetting.toSchema(edgeType)];
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
      edgeSettings: this.edgeSettings
        .map(
          (
            labelSetting: LiveCanvasEdgeViewSettings,
          ): z.infer<typeof LiveCanvasEdgeViewSettings.schema> =>
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
        customTitleProperty: false,
        titleProperty: '',
      });
    this._labelSettings.set(label, newEntry);
    return newEntry;
  }

  public getEdgeSettings(edgeType: string): LiveCanvasEdgeViewSettings {
    const existing: LiveCanvasEdgeViewSettings | null =
      this._edgeSettings.get(edgeType) ?? null;
    if (existing != null) {
      return existing;
    }
    const newEntry: LiveCanvasEdgeViewSettings = new LiveCanvasEdgeViewSettings(
      {
        width: GraphEdge.defaultWidth,
        customWidth: false,
        colorIndex: 0,
        customColor: false,
      },
    );
    this._edgeSettings.set(edgeType, newEntry);
    return newEntry;
  }
}
