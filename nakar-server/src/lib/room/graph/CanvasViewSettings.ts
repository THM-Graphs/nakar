import { SchemaCanvasViewSettings } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { ScaleType } from '../../physics/ScaleType';
import { Range } from '../../range/Range';

export class CanvasViewSettings {
  public static readonly defaultGrowNodesBasedOnDegreeFactor: number = 2;
  public static readonly defaultCompressRelationshipsWidthFactor: number = 10;

  private readonly _compressRelationshipsWidthFactor: number;
  private readonly _growNodesBasedOnDegree: boolean;
  private readonly _growNodesBasedOnDegreeFactor: number;

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
    return 'linear';
  }

  public static fromDB(
    canvas: Result<'api::v2-canvas.v2-canvas'>,
  ): CanvasViewSettings {
    return new CanvasViewSettings({
      compressRelationshipsWidthFactor:
        canvas.compressRelationshipsWidthFactor ??
        CanvasViewSettings.defaultCompressRelationshipsWidthFactor,
      growNodesBasedOnDegree: canvas.growNodesBasedOnDegree ?? false,
      growNodesBasedOnDegreeFactor:
        canvas.growNodesBasedOnDegreeFactor ??
        CanvasViewSettings.defaultGrowNodesBasedOnDegreeFactor,
    });
  }

  public static fromSchema(
    input: SchemaCanvasViewSettings,
  ): CanvasViewSettings {
    return new CanvasViewSettings({
      compressRelationshipsWidthFactor: input.compressRelationshipsWidthFactor,
      growNodesBasedOnDegree: input.growNodesBasedOnDegree,
      growNodesBasedOnDegreeFactor: input.growNodesBasedOnDegreeFactor,
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
