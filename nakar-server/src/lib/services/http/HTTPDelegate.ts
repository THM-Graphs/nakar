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
import { GetDatabaseDBDTO } from '../../services/database/dto/GetDatabaseDBDTO';
import { GetScenarioDBDTO } from '../../services/database/dto/GetScenarioDBDTO';
import { GetScenarioGroupDBDTO } from '../../services/database/dto/GetScenarioGroupDBDTO';
import { GetRoomDBDTO } from '../../services/database/dto/GetRoomDBDTO';
import { ConfigService } from '../../services/config/ConfigService';
import z from 'zod';
import { NotFound } from 'http-errors';
import { BackupService } from '../../services/backup/BackupService';
import { FileStream } from '../../tools/fs/FileStream';

export class HTTPDelegate {
  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
    private readonly _backup: BackupService,
  ) {}

  public async getScenario(req: Request): Promise<SchemaScenarios> {
    const scenarioGroupId: string = this._getQueryParameter(
      req,
      'scenarioGroupId',
    );
    const dbResult: GetScenarioDBDTO[] =
      await this._database.getScenarios(scenarioGroupId);
    return {
      scenarios: dbResult.map(
        (scenario: GetScenarioDBDTO): SchemaScenario =>
          scenario.toDto(this._config),
      ),
    };
  }

  public async getScenarioGroup(req: Request): Promise<SchemaScenarioGroups> {
    const databaseId: string = this._getQueryParameter(req, 'databaseId');
    const dbResult: GetScenarioGroupDBDTO[] =
      await this._database.getScenarioGroups(databaseId);
    return {
      scenarioGroups: dbResult.map(
        (scenarioGroup: GetScenarioGroupDBDTO): SchemaScenarioGroup =>
          scenarioGroup.toDto(),
      ),
    };
  }

  public async getDatabase(): Promise<SchemaDatabases> {
    const databases: GetDatabaseDBDTO[] = await this._database.getDatabases();
    return {
      databases: databases.map(
        (database: GetDatabaseDBDTO): SchemaDatabase => database.toDto(),
      ),
    };
  }

  public async getRoom(): Promise<SchemaRooms> {
    const dbResult: GetRoomDBDTO[] = await this._database.getRooms();
    return {
      rooms: dbResult.map((room: GetRoomDBDTO): SchemaRoom => room.toDto()),
    };
  }

  public async getRoomById(req: Request): Promise<SchemaRoom> {
    const id: string = this._getPathParameter(req, 'id');
    const dbResult: GetRoomDBDTO | null = await this._database.getRoom(id);
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

  public async getBackup(): Promise<FileStream> {
    const stream: FileStream = await this._backup.createBackupFile();
    return stream;
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
