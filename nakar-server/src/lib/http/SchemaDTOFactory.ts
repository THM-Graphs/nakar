import {
  SchemaDatabase,
  SchemaRoom,
  SchemaScenario,
  SchemaScenarioGroup,
  SchemaScenarioParameter,
  SchemaScenarioQuery,
} from '../../../src-gen/schema';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { ConfigService } from '../config/ConfigService';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetMediaDBDTO } from '../database/dto/GetMediaDBDTO';
import { GetScenarioParameterDBDTO } from '../database/dto/GetScenarioParameterDBDTO';
import { GetScenarioQueryDBDTO } from '../database/dto/GetScenarioQueryDBDTO';

export class SchemaDTOFactory {
  private _configService: ConfigService;

  public constructor(configService: ConfigService) {
    this._configService = configService;
  }
  public createSchemaDatabase(databaseDBDTO: GetDatabaseDBDTO): SchemaDatabase {
    return {
      id: databaseDBDTO.documentId,
      title: databaseDBDTO.title,
      url: databaseDBDTO.url,
      browserUrl: databaseDBDTO.browserUrl,
      editUrl: this._getDatabaseEditUrl(databaseDBDTO),
    };
  }

  public createSchemaRoom(
    room: GetRoomDBDTO,
    currentScenario: GetScenarioDBDTO | null,
  ): SchemaRoom {
    return {
      id: room.documentId,
      title: room.title,
      scenario: currentScenario
        ? {
            current: this.createSchemaScenario(currentScenario),
          }
        : null,
      editUrl: this._getRoomEditUrl(room),
    };
  }

  public createSchemaScenario(scenario: GetScenarioDBDTO): SchemaScenario {
    return {
      id: scenario.documentId,
      title: scenario.title,
      queries: scenario.queries.map(
        (q: GetScenarioQueryDBDTO): SchemaScenarioQuery => ({
          query: q.query,
          database: q.database
            ? {
                current: this.createSchemaDatabase(q.database),
              }
            : null,
        }),
      ),
      description: scenario.description,
      coverUrl: scenario.cover
        ? this._getPublicUrlOfMedia(scenario.cover)
        : null,
      editUrl: this._getScenarioEditUrl(scenario),
      parameters: scenario.parameters.map(
        (parameter: GetScenarioParameterDBDTO): SchemaScenarioParameter =>
          this.createSchemaScenarioParameter(parameter),
      ),
      additive: scenario.additive,
    };
  }

  public createSchemaScenarioParameter(
    scenarioParameter: GetScenarioParameterDBDTO,
  ): SchemaScenarioParameter {
    return {
      identifier: scenarioParameter.identifier,
      title: scenarioParameter.title,
      defaultValue: scenarioParameter.defaultValue,
    };
  }

  public createSchemaScenarioGroup(
    scenarioGroup: GetScenarioGroupDBDTO,
    scenarios: SchemaScenario[],
  ): SchemaScenarioGroup {
    return {
      id: scenarioGroup.documentId,
      title: scenarioGroup.title,
      editUrl: this._getScenarioGroupEditUrl(scenarioGroup),
      scenarios: scenarios,
    };
  }

  private _getPublicUrlOfMedia(media: GetMediaDBDTO): string | null {
    if (media.url == null) {
      return null;
    }
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    return host + media.url;
  }

  private _getDatabaseEditUrl(database: GetDatabaseDBDTO): string {
    const host: string | null = this._configService.publicURL ?? '';
    const url: string = `${host}/admin/content-manager/collection-types/api::database.database/${database.documentId}`;
    return url;
  }

  private _getScenarioGroupEditUrl(
    scenarioGroup: GetScenarioGroupDBDTO,
  ): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::scenario-group.scenario-group/${scenarioGroup.documentId}`;
    return url;
  }

  private _getScenarioEditUrl(scenario: GetScenarioDBDTO): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::scenario.scenario/${scenario.documentId}`;
    return url;
  }

  private _getRoomEditUrl(room: GetRoomDBDTO): string | null {
    const host: string | null = this._configService.publicURL;
    if (host == null) {
      return null;
    }
    const url: string = `${host}/admin/content-manager/collection-types/api::room.room/${room.documentId}`;
    return url;
  }
}
