import { Request } from 'express';
import { LoggerService } from '../../services/logger/LoggerService';
import { DatabaseService } from '../../services/database/DatabaseService';
import {
  SchemaDatabases,
  SchemaScenarioGroups,
  SchemaScenarios,
  SchemaRooms,
  SchemaRoom,
  SchemaVersion,
  SchemaScenario,
  SchemaScenarioGroup,
  SchemaDatabase,
} from '../../../../src-gen/schema';
import { DBDatabase } from '../../services/database/collection-types/DBDatabase';
import { DBScenario } from '../../services/database/collection-types/DBScenario';
import { DBScenarioGroup } from '../../services/database/collection-types/DBScenarioGroup';
import { DBRoom } from '../../services/database/collection-types/DBRoom';
import { ConfigService } from '../../services/config/ConfigService';
import z from 'zod';
import { NotFound } from 'http-errors';

export class HTTPDelegate {
  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
  ) {}

  public async getScenario(req: Request): Promise<SchemaScenarios> {
    const scenarioGroupId: string = this._getQueryParameter(
      req,
      'scenarioGroupId',
    );
    const dbResult: DBScenario[] =
      await this._database.getScenarios(scenarioGroupId);
    return {
      scenarios: dbResult.map(
        (scenario: DBScenario): SchemaScenario => scenario.toDto(this._config),
      ),
    };
  }

  public async getScenarioGroup(req: Request): Promise<SchemaScenarioGroups> {
    const databaseId: string = this._getQueryParameter(req, 'databaseId');
    const dbResult: DBScenarioGroup[] =
      await this._database.getScenarioGroups(databaseId);
    return {
      scenarioGroups: dbResult.map(
        (scenarioGroup: DBScenarioGroup): SchemaScenarioGroup =>
          scenarioGroup.toDto(),
      ),
    };
  }

  public async getDatabase(): Promise<SchemaDatabases> {
    const databases: DBDatabase[] = await this._database.getDatabases();
    return {
      databases: databases.map(
        (database: DBDatabase): SchemaDatabase => database.toDto(),
      ),
    };
  }

  public async getRoom(): Promise<SchemaRooms> {
    const dbResult: DBRoom[] = await this._database.getRooms();
    return {
      rooms: dbResult.map((room: DBRoom): SchemaRoom => room.toDto()),
    };
  }

  public async getRoomById(req: Request): Promise<SchemaRoom> {
    const id: string = this._getPathParameter(req, 'id');
    const dbResult: DBRoom | null = await this._database.getRoom(id);
    if (dbResult == null) {
      throw new NotFound('Room not found.');
    }
    return dbResult.toDto();
  }

  public getVersion(): SchemaVersion {
    const packageVersion: string | undefined = process.env.npm_package_version;
    return {
      version: packageVersion ?? 'unknown',
    };
  }

  private _getQueryParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.query[name]);
    return value;
  }

  private _getPathParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.params[name]);
    return value;
  }
}
