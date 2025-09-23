import type { Result } from '@strapi/types/dist/modules/documents/result';
import { GraphDisplayConfigurationDBDTO } from './dto/GraphDisplayConfigurationDBDTO';
import { GetDatabaseDBDTO } from './dto/GetDatabaseDBDTO';
import { GetScenarioGroupDBDTO } from './dto/GetScenarioGroupDBDTO';
import { GetMediaDBDTO } from './dto/GetMediaDBDTO';
import { GetScenarioDBDTO } from './dto/GetScenarioDBDTO';
import { GetRoomDBDTO } from './dto/GetRoomDBDTO';
import { NodeDisplayConfigurationDBDTO } from './dto/NodeDisplayConfigurationDBDTO';
import { match, P } from 'ts-pattern';
import { ScaleType } from '../tools/ScaleType';
import { GetScenarioParameterDBDTO } from './dto/GetScenarioParameterDBDTO';
import { GetScenarioQueryDBDTO } from './dto/GetScenarioQueryDBDTO';
import { MergeNodeConfigurationDBDTO } from './dto/MergeNodeConfigurationDBDTO';
import { LayoutAlgorithm } from '../tools/LayoutAlgorithm';
import { GetNoteDBDTO } from './dto/GetNoteDBDTO';
import z from 'zod';
import { SSet } from '../tools/Set';
import { GetColorDBDTO } from './dto/GetColorDBDTO';
import { GetColorPresetDBDTO } from './dto/GetColorPresetDBDTO';
import { GetColorCustomDBDTO } from './dto/GetColorCustomDBDTO';
import {
  SchemaColor,
  SchemaCustomColor,
  SchemaPresetColor,
} from '../../../src-gen/schema';
import { Input } from '@strapi/types/dist/modules/documents/params/data';
import { GetColorPresetIndexDBDTO } from './dto/GetColorPresetIndexDBDTO';

export class DatabaseDTOFactory {
  public createGetDatabaseDTOFromStrapi(
    db: Result<'api::database.database'>,
  ): GetDatabaseDBDTO {
    return {
      documentId: db.documentId,
      title: db.title ?? null,
      url: db.url ?? null,
      username: db.username ?? null,
      password: db.password ?? null,
      browserUrl: db.browserUrl ?? null,
      database: db.database ?? null,
    };
  }

  public createGetScenarioGroupDTOFromStrapi(
    db: Result<'api::scenario-group.scenario-group', { populate: ['room'] }>,
  ): GetScenarioGroupDBDTO {
    return {
      documentId: db.documentId,
      title: db.title ?? null,
      room: db.room ? this.createGetRoomDTOFromStrapi(db.room) : null,
    };
  }

  public createGetScenarioDTOFromStrapi(
    db: Result<
      'api::scenario.scenario',
      {
        populate: ['scenarioGroup', 'parameters', 'queries'];
      }
    > & {
      cover?: Result<'plugin::upload.file'> | null;
    },
  ): GetScenarioDBDTO {
    return {
      documentId: db.documentId,
      title: db.title ?? null,
      description: db.description ?? null,
      cover:
        db.cover != null ? this._createGetMediaDTOFromStrapi(db.cover) : null,
      scenarioGroup: db.scenarioGroup
        ? this.createGetScenarioGroupDTOFromStrapi(db.scenarioGroup)
        : null,
      parameters:
        db.parameters?.map(
          (parameter: Result<'graph.parameter'>): GetScenarioParameterDBDTO =>
            this.createGetScenarioParameter(parameter),
        ) ?? [],
      queries:
        db.queries?.map(
          (q: Result<'graph.query'>): GetScenarioQueryDBDTO =>
            this.createGetScenarioQuery(q),
        ) ?? [],
      additive: db.additive ?? false,
    };
  }

  public createGetScenarioParameter(
    db: Result<'graph.parameter'>,
  ): GetScenarioParameterDBDTO {
    return {
      identifier: db.identifier ?? '',
      title: db.title ?? '',
      defaultValue: db.defaultValue ?? null,
    };
  }

  public createGetScenarioQuery(
    db: Result<'graph.query', { populate: ['database'] }>,
  ): GetScenarioQueryDBDTO {
    return {
      query: db.query ?? '',
      database: db.database
        ? this.createGetDatabaseDTOFromStrapi(db.database)
        : null,
      isTableQuery: db.isTableQuery ?? false,
    };
  }

  public createGetRoomDTOFromStrapi(
    db: Result<'api::room.room'> & {
      graph?: Result<'plugin::upload.file'> | null;
    },
  ): GetRoomDBDTO {
    return {
      documentId: db.documentId,
      title: db.title ?? null,
      graph:
        db.graph != null ? this._createGetMediaDTOFromStrapi(db.graph) : null,
    };
  }

  public createGraphDisplayConfigurationDTOFromStrapi(
    db:
      | Result<
          'graph.graph-display-configuration',
          { populate: ['nodeDisplayConfigurations', 'mergeNodeConfigurations'] }
        >
      | null
      | undefined,
  ): GraphDisplayConfigurationDBDTO {
    return {
      connectResultNodes: this._createNullableBooleanFromStrapi(
        db?.connectResultNodes,
      ),
      growNodesBasedOnDegree: this._createNullableBooleanFromStrapi(
        db?.growNodesBasedOnDegree,
      ),
      growNodesBasedOnDegreeFactor: db?.growNodesBasedOnDegreeFactor ?? null,
      nodeDisplayConfigurations:
        db?.nodeDisplayConfigurations?.map(
          (
            nodeDisplayConfiguration: Result<'graph.node-display-configuration'>,
          ): NodeDisplayConfigurationDBDTO =>
            this._createNodeDisplayConfigurationDTOFromStrapi(
              nodeDisplayConfiguration,
            ),
        ) ?? [],
      compressRelationships: this._createNullableBooleanFromStrapi(
        db?.compressRelationships,
      ),
      compressRelationshipsWidthFactor:
        db?.compressRelationshipsWidthFactor ?? null,
      scaleType: this._createNullableScaleTypeFromStrapi(db?.scaleType),
      mergeNodeConfigurations: (db?.mergeNodeConfigurations ?? []).map(
        (
          mergeNodeConfiguration: Result<
            'graph.merge-node-configuration',
            { populate: ['originalDatabase', 'mergeDatabase'] }
          >,
        ): MergeNodeConfigurationDBDTO => ({
          originalLabel: mergeNodeConfiguration.originalLabel?.trim() ?? null,
          originalProperties:
            mergeNodeConfiguration.originalProperties?.trim() ?? null,
          originalDatabaseId:
            mergeNodeConfiguration.originalDatabase?.documentId ?? null,
          mergeLabel: mergeNodeConfiguration.mergeLabel?.trim() ?? null,
          mergeProperties:
            mergeNodeConfiguration.mergeProperties?.trim() ?? null,
          mergeDatabaseId:
            mergeNodeConfiguration.mergeDatabase?.documentId ?? null,
        }),
      ),
      treatNameInQueryAsLabel: this._createNullableBooleanFromStrapi(
        db?.treatNameInQueryAsLabel,
      ),
    };
  }

  public createGetNoteDBDTO(
    result: Result<'api::note.note', { populate: ['room', 'color'] }>,
  ): GetNoteDBDTO {
    return {
      id: result.documentId,
      author: result.author ?? null,
      content: result.content ?? '',
      nodeIds: new SSet(
        this._tryParseStringArrayJson(result.elementIds ?? '') ?? [],
      ),
      createdAt: this._parseStrapiDate(result.createdAt) ?? new Date(),
      updatedAt: this._parseStrapiDate(result.updatedAt),
      roomId: result.room?.documentId ?? null,
      color: this.createGetColorDBDTO(result.color ?? null),
    } satisfies GetNoteDBDTO;
  }

  public createGetColorDBDTO(
    result: Result<'graph.color'> | null,
  ): GetColorDBDTO | null {
    if (result == null) {
      return null;
    }
    if (result.index != null) {
      return {
        index: this.createGetColorPresetIndexDBDTO(result.index),
        type: 'preset',
      } satisfies GetColorPresetDBDTO;
    }
    if (result.background != null && result.text != null) {
      return {
        type: 'custom',
        backgroundColor: result.background,
        textColor: result.text,
      } satisfies GetColorCustomDBDTO;
    }
    return null;
  }

  public createGetColorPresetIndexDBDTO(
    index: number,
  ): GetColorPresetIndexDBDTO {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return index as GetColorPresetIndexDBDTO;
  }

  public createGetColorDBDTOFromSchema(
    result: SchemaColor | null,
  ): GetColorDBDTO | null {
    return match(result)
      .returnType<GetColorDBDTO | null>()
      .with(
        { type: 'PresetColor' },
        (c: SchemaPresetColor): GetColorPresetDBDTO => ({
          type: 'preset',
          index: c.index,
        }),
      )
      .with(
        { type: 'CustomColor' },
        (c: SchemaCustomColor): GetColorCustomDBDTO => ({
          type: 'custom',
          backgroundColor: c.backgroundColor,
          textColor: c.textColor,
        }),
      )
      .with(P.nullish, (): null => null)
      .exhaustive();
  }

  public createColorComponent(
    color: GetColorDBDTO | null,
  ): Input<'graph.color'> | null {
    return match(color)
      .returnType<Input<'graph.color'> | null>()
      .with(
        { type: 'preset' },
        (c: GetColorPresetDBDTO): Input<'graph.color'> =>
          ({
            index: c.index,
            background: undefined,
            text: undefined,
          }) satisfies Input<'graph.color'>,
      )
      .with(
        { type: 'custom' },
        (c: GetColorCustomDBDTO): Input<'graph.color'> =>
          ({
            index: undefined,
            background: c.backgroundColor,
            text: c.textColor,
          }) satisfies Input<'graph.color'>,
      )
      .with(P.nullish, (): null => null)
      .exhaustive();
  }

  private _tryParseStringArrayJson(input: string): string[] | null {
    try {
      return z.array(z.string()).parse(JSON.parse(input));
    } catch {
      return null;
    }
  }

  private _parseStrapiDate(
    input: string | Date | null | undefined,
  ): Date | null {
    if (input == null) {
      return null;
    }
    if (typeof input === 'string') {
      return new Date(input);
    }
    return input;
  }

  private _createNodeDisplayConfigurationDTOFromStrapi(
    db: Result<'graph.node-display-configuration'>,
  ): NodeDisplayConfigurationDBDTO {
    return {
      targetLabel: db.targetLabel?.trim() ?? null,
      displayText: db.displayText ?? null,
      radius: db.radius ?? null,
      backgroundColor: db.backgroundColor ?? null,
      compress: this._createNullableBooleanFromStrapi(db.compress),
      circleLayoutDistance: db.circleLayoutDistance ?? null,
      layoutAlgorithm: match(db.layoutAlgorithm)
        .with(P.nullish, (): null => null)
        .with('inherit', (): null => null)
        .with(
          'forceDirected',
          (): LayoutAlgorithm => LayoutAlgorithm.forceDirected,
        )
        .with('circle', (): LayoutAlgorithm => LayoutAlgorithm.circle)
        .exhaustive(),
    };
  }

  private _createNullableBooleanFromStrapi(
    input: 'inherit' | 'true' | 'false' | null | undefined,
  ): boolean | null {
    const value: boolean | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('true', (): boolean => true)
      .with('false', (): boolean => false)
      .exhaustive();
    return value;
  }

  private _createNullableScaleTypeFromStrapi(
    input: 'inherit' | 'linear' | 'log2' | 'logn' | 'log10' | null | undefined,
  ): ScaleType | null {
    const value: ScaleType | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('linear', (): ScaleType => ScaleType.linear)
      .with('log10', (): ScaleType => ScaleType.log10)
      .with('logn', (): ScaleType => ScaleType.logN)
      .with('log2', (): ScaleType => ScaleType.log2)
      .exhaustive();
    return value;
  }

  private _createGetMediaDTOFromStrapi(
    db: Result<'plugin::upload.file'>,
  ): GetMediaDBDTO {
    return {
      id: db.id,
      documentId: db.documentId,
      url: db.url ?? null,
      ext: db.ext ?? null,
      hash: db.hash ?? null,
    };
  }
}
