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
import { AdditionalQueryDBDTO } from './dto/AdditionalQueryDBDTO';
import z from 'zod';
import { GetScenarioParameterDBDTO } from './dto/GetScenarioParameterDBDTO';
import { GetScenarioQueryDBDTO } from './dto/GetScenarioQueryDBDTO';
import { MergeNodeConfigurationDBDTO } from './dto/MergeNodeConfigurationDBDTO';

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
    };
  }

  public createGetRoomDTOFromStrapi(
    db: Result<'api::room.room', { populate: [] }>,
  ): GetRoomDBDTO {
    return {
      documentId: db.documentId,
      title: db.title ?? null,
      graphJson: db.graphJson ?? null,
    };
  }

  public createGetDatabaseDTOFromUnknown(input: unknown): GetDatabaseDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      documentId: z.string(),
      title: z.string().nullable(),
      url: z.string().nullable(),
      username: z.string().nullable(),
      password: z.string().nullable(),
      browserUrl: z.string().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      documentId: parsed.documentId,
      title: parsed.title,
      url: parsed.url,
      username: parsed.username,
      password: parsed.password,
      browserUrl: parsed.browserUrl,
    };
  }

  public createGetScenarioGroupDTOFromUnknown(
    input: unknown,
  ): GetScenarioGroupDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      documentId: z.string(),
      title: z.string().nullable(),
      room: z.unknown().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      documentId: parsed.documentId,
      title: parsed.title,
      room:
        parsed.room != null
          ? this.createGetRoomDTOFromUnknown(parsed.room)
          : null,
    };
  }

  public createGetRoomDTOFromUnknown(input: unknown): GetRoomDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      documentId: z.string(),
      title: z.string().nullable(),
      graphJson: z.string().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      documentId: parsed.documentId,
      title: parsed.title,
      graphJson: parsed.graphJson,
    };
  }

  public createScenarioParameterFromUnknown(
    input: unknown,
  ): GetScenarioParameterDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      title: z.string(),
      identifier: z.string(),
      defaultValue: z.string().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      identifier: parsed.identifier,
      title: parsed.title,
      defaultValue: parsed.defaultValue,
    };
  }

  public createScenarioQueryFromUnknown(input: unknown): GetScenarioQueryDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      query: z.string(),
      database: z.unknown().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      query: parsed.query,
      database:
        parsed.database != null
          ? this.createGetDatabaseDTOFromUnknown(parsed.database)
          : null,
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
          originalLabel: mergeNodeConfiguration.originalLabel ?? null,
          originalProperties: mergeNodeConfiguration.originalProperties ?? null,
          originalDatabaseId:
            mergeNodeConfiguration.originalDatabase?.documentId ?? null,
          mergeLabel: mergeNodeConfiguration.mergeLabel ?? null,
          mergeProperties: mergeNodeConfiguration.mergeProperties ?? null,
          mergeDatabaseId:
            mergeNodeConfiguration.mergeDatabase?.documentId ?? null,
        }),
      ),
    };
  }

  private _createAdditionalQueryDTOFromStrapi(
    additionalQuery: Result<
      'graph.additional-query',
      { populate: 'mergeDatabase' }
    >,
  ): AdditionalQueryDBDTO {
    return {
      originalLabel: additionalQuery.originalLabel ?? '',
      originalProperties:
        additionalQuery.originalProperties
          ?.split(',')
          .map((element: string): string => element.trim()) ?? [],
      mergeLabel: additionalQuery.mergeLabel ?? '',
      mergeProperties:
        additionalQuery.mergeProperties
          ?.split(',')
          .map((element: string): string => element.trim()) ?? [],
      mergeQuery: additionalQuery.mergeQuery ?? '',
      mergeDatabase: additionalQuery.mergeDatabase
        ? this.createGetDatabaseDTOFromStrapi(additionalQuery.mergeDatabase)
        : null,
    };
  }

  private _createAdditionalQueryDTOFromUnknown(
    input: unknown,
  ): AdditionalQueryDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      originalLabel: z.string(),
      originalProperties: z.array(z.string()),
      mergeLabel: z.string(),
      mergeProperties: z.array(z.string()),
      mergeQuery: z.string(),
      mergeDatabase: z.unknown(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      originalLabel: parsed.originalLabel,
      originalProperties: parsed.originalProperties,
      mergeLabel: parsed.mergeLabel,
      mergeProperties: parsed.mergeProperties,
      mergeQuery: parsed.mergeQuery,
      mergeDatabase:
        parsed.mergeDatabase != null
          ? this.createGetDatabaseDTOFromUnknown(parsed.mergeDatabase)
          : null,
    };
  }

  private _createNodeDisplayConfigurationDTOFromStrapi(
    db: Result<'graph.node-display-configuration'>,
  ): NodeDisplayConfigurationDBDTO {
    return {
      targetLabel: db.targetLabel ?? null,
      displayText: db.displayText ?? null,
      radius: db.radius ?? null,
      backgroundColor: db.backgroundColor ?? null,
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
      documentId: db.documentId,
      url: db.url ?? null,
      ext: db.ext ?? null,
      hash: db.hash ?? null,
    };
  }

  private _createGetMediaDTOFromUnknown(input: unknown): GetMediaDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      documentId: z.string(),
      url: z.string().nullable(),
      ext: z.string().nullable(),
      hash: z.string().nullable(),
    });
    const parsed: z.infer<typeof schema> = schema.parse(input);
    return {
      documentId: parsed.documentId,
      url: parsed.url,
      ext: parsed.ext,
      hash: parsed.hash,
    };
  }

  private _createScaleTypeFromUnknown(input: unknown): ScaleType | null {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.enum(['linear', 'log2', 'logN', 'log10']).nullable();

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return match(parsed)
      .returnType<ScaleType | null>()
      .with(null, (): null => null)
      .with('linear', (): ScaleType => ScaleType.linear)
      .with('log2', (): ScaleType => ScaleType.log2)
      .with('logN', (): ScaleType => ScaleType.logN)
      .with('log10', (): ScaleType => ScaleType.log10)
      .exhaustive();
  }

  private _createNodeDisplayConfigurationDTOFromUnknown(
    input: unknown,
  ): NodeDisplayConfigurationDBDTO {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      targetLabel: z.string().nullable(),
      displayText: z.string().nullable(),
      radius: z.string().nullable(),
      backgroundColor: z.string().nullable(),
    });

    const parsed: z.infer<typeof schema> = schema.parse(input);

    return {
      targetLabel: parsed.targetLabel,
      displayText: parsed.displayText,
      radius: parsed.radius,
      backgroundColor: parsed.backgroundColor,
    };
  }
}
