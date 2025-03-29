import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { create } from 'tar';
import { FileStream } from '../../tools/fs/FileStream';
import { DatabaseService } from '../database/DatabaseService';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import sanitize from 'sanitize-filename';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { ToolsService } from '../tools/ToolsService';

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

  public async bootstrap(): Promise<void> {
    await this._cleanup();
  }

  public async destroy(): Promise<void> {
    await this._cleanup();
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
