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

  private _createNodeDisplayConfigurationDTOFromStrapi(
    db: Result<'graph.node-display-configuration'>,
  ): NodeDisplayConfigurationDBDTO {
    return {
      targetLabel: db.targetLabel ?? null,
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
