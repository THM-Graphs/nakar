import { SchemaCanvasViewSettings } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { ScaleType } from '../../physics/ScaleType';
import { Range } from '../../range/Range';

export class LiveCanvasViewSettings {
  public static readonly defaultGrowNodesBasedOnDegreeFactor: number = 2;
  public static readonly defaultGrowNodesBasedOnDegree: boolean = false;
  public static readonly defaultCompressRelationshipsWidthFactor: number = 10;

  private readonly _compressRelationshipsWidthFactor: number;
  private readonly _growNodesBasedOnDegree: boolean;
  private readonly _growNodesBasedOnDegreeFactor: number;
  private readonly _scaleType: ScaleType;

  public constructor(params: {
    compressRelationshipsWidthFactor: number;
    growNodesBasedOnDegree: boolean;
    growNodesBasedOnDegreeFactor: number;
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

  public static fromDB(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
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
    });
  }

  public static fromSchema(
    input: SchemaCanvasViewSettings,
  ): LiveCanvasViewSettings {
    return new LiveCanvasViewSettings({
      compressRelationshipsWidthFactor: input.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: input.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: input.growNodesBasedOnDegreeFactor,
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
    });
  }

  public toSchema(): SchemaCanvasViewSettings {
    return {
      compressRelationshipsWidthFactor: this._compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: this._growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: this._growNodesBasedOnDegreeFactor,
    };
  }
}
