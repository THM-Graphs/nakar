import { Request } from 'express';
import { LoggerService } from '../logger/LoggerService';
import { DatabaseService } from '../database/DatabaseService';
import {
  SchemaDatabases,
  SchemaRooms,
  SchemaRoom,
  SchemaVersion,
  SchemaScenario,
  SchemaScenarioGroup,
  SchemaDatabase,
} from '../../../../src-gen/schema';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { ConfigService } from '../config/ConfigService';
import z from 'zod';
import { BadRequest, NotFound } from 'http-errors';
import { BackupService } from '../backup/BackupService';
import { FileStream } from '../../tools/fs/FileStream';
import { SchemaDTOFactory } from './SchemaDTOFactory';
import { FileArray, UploadedFile } from 'express-fileupload';
import { InsertResult } from '../backup/InsertResult';
import { RoomService } from '../room/RoomService';

export class HTTPDelegate {
  private readonly _schemaDTOFactory: SchemaDTOFactory;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
    private readonly _backup: BackupService,
    private readonly _room: RoomService,
  ) {
    this._schemaDTOFactory = new SchemaDTOFactory(_config);
  }

  public async getScenarios(): Promise<SchemaDatabases> {
    const databases: GetDatabaseDBDTO[] = await this._database.getDatabases();
    const databaseSchema: SchemaDatabase[] = await Promise.all(
      databases.map(
        async (database: GetDatabaseDBDTO): Promise<SchemaDatabase> => {
          const scenarioGroups: GetScenarioGroupDBDTO[] =
            await this._database.getScenarioGroups(database.documentId);
          const scenarioGroupSchemas: SchemaScenarioGroup[] = await Promise.all(
            scenarioGroups.map(
              async (
                scenarioGroup: GetScenarioGroupDBDTO,
              ): Promise<SchemaScenarioGroup> => {
                const scenarios: GetScenarioDBDTO[] =
                  await this._database.getScenarios(scenarioGroup.documentId);
                const scenarioSchemas: SchemaScenario[] = scenarios.map(
                  (scenario: GetScenarioDBDTO): SchemaScenario => {
                    return this._schemaDTOFactory.createSchemaScenario(
                      scenario,
                    );
                  },
                );
                return this._schemaDTOFactory.createSchemaScenarioGroup(
                  scenarioGroup,
                  scenarioSchemas,
                );
              },
            ),
          );
          return this._schemaDTOFactory.createSchemaDatabase(
            database,
            scenarioGroupSchemas,
          );
        },
      ),
    );
    return {
      databases: databaseSchema,
    };
  }

  public async getRoom(): Promise<SchemaRooms> {
    const dbResult: GetRoomDBDTO[] = await this._database.getRooms();
    return {
      rooms: await Promise.all(
        dbResult.map(async (room: GetRoomDBDTO): Promise<SchemaRoom> => {
          return this._schemaDTOFactory.createSchemaRoom(
            room,
            await this._getScenarioOfRoom(room),
          );
        }),
      ),
    };
  }

  public async getRoomById(req: Request): Promise<SchemaRoom> {
    const id: string = this._getPathParameter(req, 'id');
    const dbResult: GetRoomDBDTO | null = await this._database.getRoom(id);
    if (dbResult == null) {
      throw new NotFound('Room not found.');
    }
    return this._schemaDTOFactory.createSchemaRoom(
      dbResult,
      await this._getScenarioOfRoom(dbResult),
    );
  }

  public getVersion(): SchemaVersion {
    const packageVersion: string | undefined =
      process.env['npm_package_version'];
    return {
      version: packageVersion ?? 'unknown',
    };
  }

  public async getBackup(): Promise<FileStream> {
    const stream: FileStream = await this._backup.createBackupFile();
    return stream;
  }

  public async postImport(req: Request): Promise<unknown> {
    const files: FileArray | null | undefined = req.files;
    if (files == null) {
      throw new BadRequest('No files on request body.');
    }
    const file: UploadedFile | UploadedFile[] = files['file'];

    if (Array.isArray(file)) {
      throw new BadRequest('Only one file is allowed.');
    }

    const insertResult: InsertResult = await this._backup.importBackupFile(
      file.tempFilePath,
    );

    if (insertResult.errors.length > 0) {
      throw new BadRequest(
        JSON.stringify(
          insertResult.errors
            .map((error: unknown): string => JSON.stringify(error))
            .join('\n'),
        ),
      );
    }

    return {
      insertedDatabases: insertResult.insertedDatabases.toArray(),
      insertedScenarioGroups: insertResult.insertedScenarioGroups.toArray(),
      insertedScenarios: insertResult.insertedScenarios.toArray(),
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

  private async _getScenarioOfRoom(
    room: GetRoomDBDTO,
  ): Promise<GetScenarioDBDTO | null> {
    const scenarioId: string | null =
      this._room.getGraph(room.documentId)?.metaData?.scenarioInfo?.id ?? null;
    const scenario: GetScenarioDBDTO | null = scenarioId
      ? await this._database.getScenario(scenarioId)
      : null;
    return scenario;
  }
}
