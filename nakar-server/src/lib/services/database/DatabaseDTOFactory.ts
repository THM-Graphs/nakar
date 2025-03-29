import type { Result } from '@strapi/types/dist/modules/documents/result';
import { GetGraphDisplayConfigurationDBDTO } from './dto/GetGraphDisplayConfigurationDBDTO';
import { GetDatabaseDBDTO } from './dto/GetDatabaseDBDTO';
import { GetScenarioGroupDBDTO } from './dto/GetScenarioGroupDBDTO';
import { GetMediaDBDTO } from './others/GetMediaDBDTO';
import { GetScenarioDBDTO } from './dto/GetScenarioDBDTO';
import { GetRoomDBDTO } from './dto/GetRoomDBDTO';
import { DBNullableBoolean } from './others/DBNullableBoolean';
import { GetNodeDisplayConfigurationDBDTO } from './dto/GetNodeDisplayConfigurationDBDTO';
import { DBNullableScaleType } from './others/DBNullableScaleType';
import { match, P } from 'ts-pattern';
import { ScaleType } from '../../tools/ScaleType';
import z from 'zod';
import { DBStringList } from './others/DBStringList';

export class DatabaseDTOFactory {
  public createGetDatabaseDTO(
    db: Result<
      'api::database.database',
      { populate: ['graphDisplayConfiguration'] }
    >,
  ): GetDatabaseDBDTO {
    return new GetDatabaseDBDTO({
      documentId: db.documentId,
      title: db.title ?? null,
      url: db.url ?? null,
      username: db.username ?? null,
      password: db.password ?? null,
      browserUrl: db.browserUrl ?? null,
      graphDisplayConfiguration:
        this.createGetGraphDisplayConfigurationDTOOrNull(
          db.graphDisplayConfiguration,
        ),
    });
  }

  public createGetScenarioGroupDTO(
    db: Result<
      'api::scenario-group.scenario-group',
      { populate: ['graphDisplayConfiguration', 'database'] }
    >,
  ): GetScenarioGroupDBDTO {
    return new GetScenarioGroupDBDTO({
      documentId: db.documentId,
      title: db.title ?? null,
      database: db.database ? this.createGetDatabaseDTO(db.database) : null,
      graphDisplayConfiguration:
        this.createGetGraphDisplayConfigurationDTOOrNull(
          db.graphDisplayConfiguration,
        ),
    });
  }

  public createGetScenarioDTO(
    db: Result<
      'api::scenario.scenario',
      { populate: ['graphDisplayConfiguration', 'scenarioGroup'] }
    > & {
      cover?: Result<'plugin::upload.file'> | null;
    },
  ): GetScenarioDBDTO {
    return new GetScenarioDBDTO({
      documentId: db.documentId,
      title: db.title ?? null,
      query: db.query ?? null,
      description: db.description ?? null,
      cover: db.cover != null ? this.createGetMediaDTO(db.cover) : null,
      scenarioGroup: db.scenarioGroup
        ? this.createGetScenarioGroupDTO(db.scenarioGroup)
        : null,
      graphDisplayConfiguration:
        this.createGetGraphDisplayConfigurationDTOOrNull(
          db.graphDisplayConfiguration,
        ),
    });
  }

  public createGetRoomDTO(db: Result<'api::room.room'>): GetRoomDBDTO {
    return new GetRoomDBDTO({
      documentId: db.documentId,
      title: db.title ?? null,
      graphJson: db.graphJson ?? null,
    });
  }

  public createGetGraphDisplayConfigurationDTOOrNull(
    db:
      | Result<
          'graph.graph-display-configuration',
          { populate: ['nodeDisplayConfigurations'] }
        >
      | null
      | undefined,
  ): GetGraphDisplayConfigurationDBDTO {
    return new GetGraphDisplayConfigurationDBDTO({
      connectResultNodes: this.createNullableBoolean(db?.connectResultNodes),
      growNodesBasedOnDegree: this.createNullableBoolean(
        db?.growNodesBasedOnDegree,
      ),
      growNodesBasedOnDegreeFactor: db?.growNodesBasedOnDegreeFactor ?? null,
      nodeDisplayConfigurations:
        db?.nodeDisplayConfigurations?.map(
          (
            nodeDisplayConfiguration: Result<'graph.node-display-configuration'>,
          ): GetNodeDisplayConfigurationDBDTO =>
            this.createGetNodeDisplayConfigurationDTO(nodeDisplayConfiguration),
        ) ?? [],
      compressRelationships: this.createNullableBoolean(
        db?.compressRelationships,
      ),
      compressRelationshipsWidthFactor:
        db?.compressRelationshipsWidthFactor ?? null,
      scaleType: this.createNullableScaleType(db?.scaleType),
    });
  }

  public createGetNodeDisplayConfigurationDTO(
    db: Result<'graph.node-display-configuration'>,
  ): GetNodeDisplayConfigurationDBDTO {
    return new GetNodeDisplayConfigurationDBDTO({
      targetLabel: db.targetLabel ?? null,
      displayText: db.displayText ?? null,
      radius: db.radius ?? null,
      backgroundColor: db.backgroundColor ?? null,
    });
  }

  public createNullableBoolean(
    input: 'inherit' | 'true' | 'false' | null | undefined,
  ): DBNullableBoolean {
    const value: boolean | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('true', (): boolean => true)
      .with('false', (): boolean => false)
      .exhaustive();
    return new DBNullableBoolean(value);
  }

  public createNullableScaleType(
    input: 'inherit' | 'linear' | 'log2' | 'logn' | 'log10' | null | undefined,
  ): DBNullableScaleType {
    const value: ScaleType | null = match(input)
      .with(P.nullish, (): null => null)
      .with('inherit', (): null => null)
      .with('linear', (): ScaleType => ScaleType.linear)
      .with('log10', (): ScaleType => ScaleType.log10)
      .with('logn', (): ScaleType => ScaleType.logN)
      .with('log2', (): ScaleType => ScaleType.log2)
      .exhaustive();
    return new DBNullableScaleType(value);
  }

  public createStringList(input: unknown): DBStringList {
    try {
      const parsedValue: string[] = z.array(z.string()).parse(input);
      return new DBStringList({ values: parsedValue });
    } catch {
      return new DBStringList({ values: [] });
    }
  }

  public createGetMediaDTO(db: Result<'plugin::upload.file'>): GetMediaDBDTO {
    return new GetMediaDBDTO({
      documentId: db.documentId,
      url: db.url ?? null,
      ext: db.ext ?? null,
      hash: db.hash ?? null,
    });
  }
}
