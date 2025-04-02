import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import fsSync, { Dirent } from 'node:fs';
import { create, x } from 'tar';
import { FileStream } from '../../tools/fs/FileStream';
import { DatabaseService } from '../database/DatabaseService';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import sanitize from 'sanitize-filename';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { ToolsService } from '../tools/ToolsService';
import { v4 } from 'uuid';
import { DatabaseDTOFactory } from '../database/DatabaseDTOFactory';
import { InsertResult } from './InsertResult';

export class BackupService implements ApplicationService {
  public constructor(
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
    private readonly _tools: ToolsService,
  ) {}

  public async createBackupFile(): Promise<FileStream> {
    const folderName: string = `nakar_backup_${this._tools.createFileNameDate(new Date())}`;
    const basePath: string = path.join(this._temporaryDirectory(), folderName);
    this._logger.debug(this, `Base Path: ${basePath}`);

    await fs.mkdir(basePath, { recursive: true });

    const databases: GetDatabaseDBDTO[] = await this._database.getDatabases();
    for (const database of databases) {
      const databaseFileName: string = `database_${this._safeFileName(database.title ?? '')}_${this._safeFileName(database.documentId)}`;
      const databasePath: string = path.join(basePath, databaseFileName);
      await fs.mkdir(databasePath);
      await fs.writeFile(
        path.join(basePath, `${databaseFileName}.json`),
        JSON.stringify(database, null, 2),
      );

      const scenarioGroups: GetScenarioGroupDBDTO[] =
        await this._database.getScenarioGroups(database.documentId);
      for (const scenarioGroup of scenarioGroups) {
        const scenarioGroupFileName: string = `scenarioGroup_${this._safeFileName(scenarioGroup.title ?? '')}_${this._safeFileName(scenarioGroup.documentId)}`;
        const scenarioGroupPath: string = path.join(
          databasePath,
          scenarioGroupFileName,
        );
        await fs.mkdir(scenarioGroupPath);
        await fs.writeFile(
          path.join(databasePath, `${scenarioGroupFileName}.json`),
          JSON.stringify(scenarioGroup, null, 2),
        );

        const scenarios: GetScenarioDBDTO[] = await this._database.getScenarios(
          scenarioGroup.documentId,
        );
        for (const scenario of scenarios) {
          const scenarioFileName: string = `scenario_${this._safeFileName(scenario.title ?? '')}_${this._safeFileName(scenario.documentId)}`;
          const scenarioPath: string = path.join(
            scenarioGroupPath,
            scenarioFileName,
          );
          await fs.mkdir(scenarioPath);
          await fs.writeFile(
            path.join(scenarioGroupPath, `${scenarioFileName}.json`),
            JSON.stringify(scenario, null, 2),
          );
          if (scenario.cover != null) {
            const coverStream: FileStream | null = this._database.getFileStream(
              'cover',
              scenario.cover,
            );
            if (coverStream != null) {
              await fs.writeFile(
                path.join(scenarioPath, coverStream.fileName),
                fsSync.createReadStream(coverStream.filePath),
              );
            }
          }
        }
      }
    }

    const fileName: string = `${folderName}.tar.gz`;
    const outputFilePath: string = path.join(
      this._temporaryDirectory(),
      fileName,
    );
    await create(
      { gzip: true, file: outputFilePath, cwd: this._temporaryDirectory() },
      [folderName],
    );

    return new FileStream(outputFilePath, 'application/tar+gzip', fileName);
  }

  public async importBackupFile(inputPath: string): Promise<InsertResult> {
    this._logger.debug(this, `Will import file from ${inputPath}`);

    const basePath: string = path.join(this._temporaryDirectory(), v4());
    const fileName: string = 'import.tar.gz';
    const zipFilePath: string = path.join(basePath, fileName);
    await fs.mkdir(basePath, { recursive: true });
    await fs.rename(inputPath, zipFilePath);

    this._logger.debug(this, `Import file: ${zipFilePath}`);

    await x({
      file: zipFilePath,
      gzip: true,
      cwd: basePath,
    });

    const insertResult: InsertResult = new InsertResult();

    for (const rootFolder of await this._getFoldersInDirectory(basePath)) {
      this._logger.debug(this, `Will import root folder ${rootFolder}`);

      for (const databaseFile of await this._getJsonFilesInDirectory(
        path.join(basePath, rootFolder),
      )) {
        await this._importDatabaseFile(
          path.join(basePath, rootFolder, databaseFile),
          insertResult,
        );
      }

      for (const sceanrioGroupFolder of await this._getFoldersInDirectory(
        path.join(basePath, rootFolder),
      )) {
        for (const scenarioGroupFile of await this._getJsonFilesInDirectory(
          path.join(basePath, rootFolder, sceanrioGroupFolder),
        )) {
          this._logger.debug(
            this,
            `Will import scenario group file ${scenarioGroupFile}`,
          );
        }
        for (const sceanriopFolder of await this._getFoldersInDirectory(
          path.join(basePath, rootFolder, sceanrioGroupFolder),
        )) {
          for (const scenarioFile of await this._getJsonFilesInDirectory(
            path.join(
              basePath,
              rootFolder,
              sceanrioGroupFolder,
              sceanriopFolder,
            ),
          )) {
            this._logger.debug(
              this,
              `Will import scenario file ${scenarioFile}`,
            );
          }
        }
      }
    }

    return insertResult;
  }

  public async bootstrap(): Promise<void> {
    await this._cleanup();
  }

  public async destroy(): Promise<void> {
    await this._cleanup();
  }

  private async _importDatabaseFile(
    filePath: string,
    insertResult: InsertResult,
  ): Promise<void> {
    try {
      this._logger.debug(this, `Will import database file ${filePath}`);
      const contents: string = await fs.readFile(filePath, {
        encoding: 'utf-8',
      });
      const factory: DatabaseDTOFactory = new DatabaseDTOFactory();
      const json: unknown = JSON.parse(contents);
      const getDatabaseObject: GetDatabaseDBDTO =
        factory.createGetDatabaseDTOFromUnknown(json);
      if (await this._database.databaseExists(getDatabaseObject.documentId)) {
        throw new Error(
          `Database with id ${getDatabaseObject.documentId} already exists.`,
        );
      }
      const insertedObject: GetDatabaseDBDTO =
        await this._database.saveDatabase(getDatabaseObject);
      insertResult.insertedDatabases.set(
        getDatabaseObject.documentId,
        insertedObject,
      );
    } catch (error: unknown) {
      this._logger.error(this, 'Insert database failed. Will log error.');
      this._logger.error(this, error);
      insertResult.errors.push(error);
    }
  }

  private async _getFoldersInDirectory(
    directoryPath: string,
  ): Promise<string[]> {
    const files: Dirent[] = await fs.readdir(directoryPath, {
      withFileTypes: true,
    });
    const directories: string[] = files
      .filter((file: Dirent): boolean => file.isDirectory())
      .map((file: Dirent): string => file.name);
    return directories;
  }

  private async _getJsonFilesInDirectory(
    directoryPath: string,
  ): Promise<string[]> {
    const files: Dirent[] = await fs.readdir(directoryPath, {
      withFileTypes: true,
    });
    const directories: string[] = files
      .filter(
        (file: Dirent): boolean => file.isFile() && file.name.endsWith('.json'),
      )
      .map((file: Dirent): string => file.name);
    return directories;
  }

  private async _cleanup(): Promise<void> {
    const tmpDir: string = this._temporaryDirectory();
    this._logger.debug(this, `Will delete ${tmpDir} if exists.`);
    try {
      await fs.rm(tmpDir, { recursive: true });
      this._logger.debug(this, `Did delete ${tmpDir}`);
    } catch {
      // ok
    }
  }

  private _temporaryDirectory(): string {
    return path.join(os.tmpdir(), 'nakar', 'backups');
  }

  private _safeFileName(fileName: string): string {
    return sanitize(fileName);
  }
}
