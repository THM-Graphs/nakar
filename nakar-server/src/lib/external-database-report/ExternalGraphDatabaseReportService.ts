import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import type { Logger } from '@strapi/logger';
import type { Modules } from '@strapi/types';
import { SMap } from '../../packages/map/Map';
import { SSet } from '../../packages/set/Set';
import { DatabaseService } from '../database/DatabaseService';
import { createChildLogger } from '../logger/createChildLogger';
import type { ExternalGraphDatabaseCredentials } from '../external-database/data/ExternalGraphDatabaseCredentials';
import { ExternalGraphDatabaseService } from '../external-database/ExternalGraphDatabaseService';
import type { ReportDatabase } from './ReportDatabase';
import type { ReportDatabaseCollection } from './ReportDatabaseCollection';
import type { ReportDatabaseCollectionError } from './ReportDatabaseCollectionError';
import type { ReportDatabaseResult } from './ReportDatabaseResult';

@Injectable()
export class ExternalGraphDatabaseReportService implements OnModuleInit {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _externalGraphDatabase: ExternalGraphDatabaseService,
  ) {}

  public onModuleInit(): void {
    this.logReport().catch((error: unknown): void => {
      this._logger.error('Could not create database connection report.');
      this._logger.error(error);
    });
  }

  public async logReport(): Promise<void> {
    const collection: ReportDatabaseCollection = await this._collectDatabases();
    const results: ReportDatabaseResult[] = await this._testDatabases(
      collection.databases,
    );
    this._logResults(results, collection.errors);
  }

  private async _collectDatabases(): Promise<ReportDatabaseCollection> {
    const errors: ReportDatabaseCollectionError[] = [];
    let projects: Modules.Documents.Result<'api::project.project'>[];

    try {
      projects = await this._database.getProjects();
    } catch (error: unknown) {
      errors.push({
        projectLabel: null,
        databaseLabel: null,
        connectionUrl: null,
        error: error instanceof Error ? error.message : String(error),
      });
      return { databases: [], errors };
    }

    this._logger.info(
      `Will collect database connections for ${projects.length.toString()} projects.`,
    );

    const databases: ReportDatabase[] = (
      await Promise.all(
        projects.map(
          async (
            project: Modules.Documents.Result<'api::project.project'>,
          ): Promise<ReportDatabase[]> => {
            const projectLabel: string = `${project.title ?? 'Untitled project'} (${project.documentId})`;

            try {
              const connections: Modules.Documents.Result<'api::database-connection.database-connection'>[] =
                await this._database.getDatabaseConnectionsOfProject(project);

              const projectDatabases: (ReportDatabase | null)[] =
                await Promise.all(
                  connections.map(
                    async (
                      connection: Modules.Documents.Result<'api::database-connection.database-connection'>,
                    ): Promise<ReportDatabase | null> => {
                      const databaseLabel: string = `${connection.title ?? 'Untitled database'} (${connection.documentId})`;

                      try {
                        const database: Modules.Documents.Result<'api::database-connection.database-connection'> =
                          await this._database.getDatabase(
                            connection.documentId,
                          );
                        const credentials: ExternalGraphDatabaseCredentials =
                          this._externalGraphDatabase.parseCredentials(
                            database,
                          );

                        return {
                          projectLabels: [projectLabel],
                          databaseLabels: [databaseLabel],
                          credentials,
                        };
                      } catch (error: unknown) {
                        errors.push({
                          projectLabel,
                          databaseLabel,
                          connectionUrl: connection.connectionUrl ?? null,
                          error:
                            error instanceof Error
                              ? error.message
                              : String(error),
                        });
                        return null;
                      }
                    },
                  ),
                );
              return projectDatabases.filter(
                (database: ReportDatabase | null): database is ReportDatabase =>
                  database != null,
              );
            } catch (error: unknown) {
              errors.push({
                projectLabel,
                databaseLabel: null,
                connectionUrl: null,
                error: error instanceof Error ? error.message : String(error),
              });
              return [];
            }
          },
        ),
      )
    ).flat();

    const uniqueDatabases: SMap<string, ReportDatabase> = new SMap<
      string,
      ReportDatabase
    >();
    for (const database of databases) {
      try {
        const key: string = this._externalGraphDatabase.equalityHashKey(
          database.credentials,
        );
        const existingDatabase: ReportDatabase | undefined =
          uniqueDatabases.get(key);

        if (existingDatabase == null) {
          // Keep the first connection's credentials, regardless of request completion order.
          uniqueDatabases.set(key, database);
        } else {
          existingDatabase.projectLabels = new SSet([
            ...existingDatabase.projectLabels,
            ...database.projectLabels,
          ]).toArray();
          existingDatabase.databaseLabels = new SSet([
            ...existingDatabase.databaseLabels,
            ...database.databaseLabels,
          ]).toArray();
        }
      } catch (error: unknown) {
        errors.push({
          projectLabel: database.projectLabels.join(', '),
          databaseLabel: database.databaseLabels.join(', '),
          connectionUrl: database.credentials.connectionUrl,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { databases: uniqueDatabases.toValueArray(), errors };
  }

  private async _testDatabases(
    databases: ReportDatabase[],
  ): Promise<ReportDatabaseResult[]> {
    this._logger.info(
      `Will start connection tests for ${databases.length.toString()} unique databases.`,
    );

    return await Promise.all(
      databases.map(
        async (database: ReportDatabase): Promise<ReportDatabaseResult> => {
          const result: ReportDatabaseResult = {
            projectLabels: database.projectLabels,
            databaseLabels: database.databaseLabels,
            connectionUrl: database.credentials.connectionUrl,
            databaseType: database.credentials.databaseType,
            status: '✅ Reachable',
            error: null,
          };

          try {
            await this._externalGraphDatabase.testConnection(
              database.credentials,
            );
            return result;
          } catch (error: unknown) {
            return {
              ...result,
              status: '❌ Unreachable',
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
      ),
    );
  }

  private _logResults(
    results: ReportDatabaseResult[],
    errors: ReportDatabaseCollectionError[],
  ): void {
    const statuses: ReportDatabaseResult['status'][] = [
      '❌ Unreachable',
      '✅ Reachable',
    ];
    const sections: string[] = ['## Database connection report'];

    if (errors.length > 0) {
      const errorRows: string[][] = [...errors]
        .sort(
          (
            left: ReportDatabaseCollectionError,
            right: ReportDatabaseCollectionError,
          ): number =>
            (left.projectLabel ?? '').localeCompare(right.projectLabel ?? '') ||
            (left.databaseLabel ?? '').localeCompare(
              right.databaseLabel ?? '',
            ) ||
            left.error.localeCompare(right.error),
        )
        .map((error: ReportDatabaseCollectionError): string[] => [
          error.projectLabel ?? '-',
          error.databaseLabel ?? '-',
          error.connectionUrl ?? '-',
          error.error,
        ]);
      sections.push(
        `### ⚠️ Collection errors (${errors.length.toString()})`,
        this._formatTable(
          ['Project', 'Database', 'Connection URL', 'Error'],
          errorRows,
        ),
      );
    }

    for (const status of statuses) {
      const statusResults: ReportDatabaseResult[] = results
        .filter(
          (result: ReportDatabaseResult): boolean => result.status === status,
        )
        .sort(
          (left: ReportDatabaseResult, right: ReportDatabaseResult): number =>
            left.projectLabels
              .join(', ')
              .localeCompare(right.projectLabels.join(', ')) ||
            left.databaseLabels
              .join(', ')
              .localeCompare(right.databaseLabels.join(', ')),
        );

      if (statusResults.length > 0) {
        sections.push(
          `### ${status} (${statusResults.length.toString()})`,
          this._formatTable(
            [
              'Project',
              'Database',
              'Connection URL',
              'Type',
              'Status',
              'Error',
            ],
            statusResults.map((result: ReportDatabaseResult): string[] => [
              result.projectLabels.join(', '),
              result.databaseLabels.join(', '),
              result.connectionUrl ?? '-',
              result.databaseType,
              result.status,
              result.error ?? '-',
            ]),
          ),
        );
      }
    }

    if (results.length === 0 && errors.length === 0) {
      sections.push('No database connections found.');
    }

    this._logger.info(`\n${sections.join('\n\n')}`);
  }

  private _formatTable(headers: string[], rows: string[][]): string {
    const normalizedRows: string[][] = [headers, ...rows].map(
      (row: string[]): string[] =>
        row.map((cell: string): string =>
          cell
            .replace(/\s+/gu, ' ')
            .replaceAll('\\', '\\\\')
            .replaceAll('|', '\\|'),
        ),
    );
    const widths: number[] = normalizedRows.reduce(
      (columnWidths: number[], row: string[]): number[] =>
        row.map((cell: string, index: number): number =>
          Math.max(columnWidths[index] ?? 3, cell.length),
        ),
      [],
    );
    const lines: string[] = normalizedRows.map(
      (row: string[]): string =>
        `| ${row
          .map((cell: string, index: number): string =>
            cell.padEnd(widths[index]),
          )
          .join(' | ')} |`,
    );
    lines.splice(
      1,
      0,
      `| ${widths.map((width: number): string => '-'.repeat(width)).join(' | ')} |`,
    );

    return lines.join('\n');
  }
}
