import { Neo4jDatabaseInfo } from './Neo4jDatabaseInfo';
import neo4j, {
  auth,
  driver as createDriver,
  Driver,
  QueryResult,
  RecordShape,
  Session,
} from 'neo4j-driver';
import { Neo4jGraphElements } from './Neo4jGraphElements';
import { SSet } from '../tools/Set';
import { LoggerService } from '../logger/LoggerService';
import { Neo4jGraphElementsFactory } from './Neo4jGraphElementsFactory';
import { SessionConfig } from 'neo4j-driver-core/types/driver';
import { ApplicationService } from '../application/ApplicationService';
import { ExpandNodePreview } from './expand-node-preview/ExpandNodePreview';
import { ExpandNodePreviewEntry } from './expand-node-preview/ExpandNodePreviewEntry';
import { SMap } from '../tools/Map';
import { ToManyElementsError } from './ToManyElementsError';
import { SchemaDatabaseStats } from '../../../src-gen/schema';
import { z } from 'zod';

export class Neo4jService implements ApplicationService {
  public static readonly maximalElements: number = 500;

  public constructor(private readonly _logger: LoggerService) {}

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public async executeQuery(
    databaseInfo: Neo4jDatabaseInfo,
    query: string,
    parameters: Record<string, unknown>,
    checkLimit: boolean,
  ): Promise<Neo4jGraphElements> {
    const driver: Driver = createDriver(
      databaseInfo.url,
      auth.basic(databaseInfo.username, databaseInfo.password),
    );
    this._logger.debug(
      this,
      `Did create driver: ${JSON.stringify(await driver.getServerInfo())}`,
    );
    try {
      const sessionConfig: SessionConfig = {
        defaultAccessMode: neo4j.session.READ,
        database: databaseInfo.database ?? undefined,
      };
      const session: Session = driver.session(sessionConfig);
      this._logger.debug(
        this,
        `Did open session: ${JSON.stringify(sessionConfig)}`,
      );
      try {
        this._logger.debug(
          this,
          `Will run query: ${query} with data: ${JSON.stringify(parameters).length.toString()} bytes`,
        );
        const result: QueryResult = await session.run<
          RecordShape<string, unknown>
        >(query, parameters, { timeout: 2 * 60000 });

        if (
          result.records.length > Neo4jService.maximalElements &&
          checkLimit
        ) {
          throw new ToManyElementsError(result.records.length);
        }
        this._logger.debug(
          this,
          `Did receive ${result.records.length.toString()} records.`,
        );

        const nei4jGraphElementsFactory: Neo4jGraphElementsFactory =
          new Neo4jGraphElementsFactory(this._logger);
        return nei4jGraphElementsFactory.fromQueryResult(result, databaseInfo);
      } catch (error) {
        await session.close();
        this._logger.error(this, error);
        throw error;
      }
    } catch (error) {
      await driver.close();
      this._logger.error(this, error);
      throw error;
    }
  }

  public async loadConnectingRelationships(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    this._logger.log(
      this,
      `Will load connecting relationships of ${nodesIds.length.toString()} nodes in ${databaseInfo.url}`,
    );
    const additional: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN DISTINCT additionalRelationship;`,
      {
        existingNodeIds: nodesIds,
      },
      false,
    );
    return additional;
  }

  public async expandNode(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
    limit: { relationships: SSet<string>; labels: SSet<string> } | null,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    if (limit) {
      return await this.executeQuery(
        databaseInfo,
        `MATCH (a)-[additionalRelationship]-(b)
        WHERE elementId(a) IN $nodesIds
        AND (type(additionalRelationship) in $relationships OR ANY(label IN labels(b) WHERE label IN $labels))
        RETURN a, additionalRelationship, b
        LIMIT ${Neo4jService.maximalElements.toString()};`,
        {
          nodesIds: nodesIds,
          relationships: limit.relationships,
          labels: limit.labels,
        },
        true,
      );
    } else {
      return await this.executeQuery(
        databaseInfo,
        `MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $nodesIds RETURN a, additionalRelationship, b LIMIT ${(Neo4jService.maximalElements + 1).toString()};`,
        {
          nodesIds: nodesIds,
        },
        true,
      );
    }
  }

  public async expandNodePreview(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
  ): Promise<ExpandNodePreview> {
    const nodesIds: string[] = [...nodeIds.values()];
    const relationships: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[neighbor]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
RETURN type(neighbor) AS rtype, count(*) AS rcount
ORDER BY rcount DESC, rtype ASC`,
      {
        nodesIds: nodesIds,
      },
      true,
    );
    const expandNodePreviewRelationshipEntries: ExpandNodePreviewEntry[] =
      relationships.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewEntry =>
          new ExpandNodePreviewEntry(
            String(entry.get('rtype')),
            Number(entry.get('rcount')),
          ),
      );

    const labels: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
UNWIND labels(b) as label
RETURN label, count(*) AS lcount
ORDER BY lcount DESC, label ASC`,
      {
        nodesIds: nodesIds,
      },
      true,
    );
    const expandNodePreviewLabelEntries: ExpandNodePreviewEntry[] =
      labels.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewEntry =>
          new ExpandNodePreviewEntry(
            String(entry.get('label')),
            Number(entry.get('lcount')),
          ),
      );

    return new ExpandNodePreview(
      expandNodePreviewLabelEntries,
      expandNodePreviewRelationshipEntries,
    );
  }

  public async getStats(params: {
    credentials: Neo4jDatabaseInfo;
  }): Promise<SchemaDatabaseStats> {
    return this._fetchDbStats(params.credentials);
  }

  private async _getLabels(
    credentials: Neo4jDatabaseInfo,
  ): Promise<SSet<string>> {
    const labelsResult: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'CALL db.labels() YIELD label RETURN label ORDER BY label ASC',
      {},
      false,
    );
    const labels: SSet<string> = new SSet<string>(
      labelsResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('label')),
      ),
    );
    return labels;
  }

  private async _getRelationshipTypes(
    credentials: Neo4jDatabaseInfo,
  ): Promise<SSet<string>> {
    const relTypesResult: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType ORDER BY relationshipType ASC',
      {},
      false,
    );
    const relTypes: SSet<string> = new SSet<string>(
      relTypesResult.tableData.map((line: SMap<string, unknown>): string =>
        String(line.get('relationshipType')),
      ),
    );
    return relTypes;
  }

  private async _fetchDbStats(
    credentials: Neo4jDatabaseInfo,
  ): Promise<SchemaDatabaseStats> {
    const labels: SSet<string> = await this._getLabels(credentials);
    const relTypes: SSet<string> =
      await this._getRelationshipTypes(credentials);
    const stats: SchemaDatabaseStats = {
      labelCount: labels.size,
      labels: labels.flatMap(
        (
          label: string,
        ): { label: string; count: number; exploreQuery: string } => ({
          label: label,
          count: -1,
          exploreQuery: this._exploreQueryOfLabel(label),
        }),
      ),
      relTypeCount: relTypes.size,
      rels: relTypes.flatMap(
        (
          relType: string,
        ): { relType: string; count: number; exploreQuery: string } => ({
          relType: relType,
          count: -1,
          exploreQuery: this._exploreQueryOfRelationshipType(relType),
        }),
      ),
      nodeCount: await this._getNodesCount(credentials),
      relCount: await this._getRelationshipsCount(credentials),
    };
    return stats;
  }

  private _exploreQueryOfLabel(label: string): string {
    return `MATCH (n:\`${label}\`) RETURN * LIMIT ${Neo4jService.maximalElements.toString()};`;
  }

  private _exploreQueryOfRelationshipType(relType: string): string {
    return `MATCH (a)-[r:\`${relType}\`]-(b) RETURN * LIMIT ${Neo4jService.maximalElements.toString()};`;
  }

  private async _getNodesCount(
    credentials: Neo4jDatabaseInfo,
  ): Promise<number> {
    const result: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'MATCH (n) RETURN count(n) AS nodeCount',
      {},
      false,
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get node count from query.');
    }
    return Number(result.tableData[0].get('nodeCount'));
  }

  private async _getRelationshipsCount(
    credentials: Neo4jDatabaseInfo,
  ): Promise<number> {
    const result: Neo4jGraphElements = await this.executeQuery(
      credentials,
      'MATCH ()-[r]->() RETURN count(r) AS relationshipCount',
      {},
      false,
    );
    if (result.tableData.length === 0) {
      throw new Error('Unable to get relationship count from query.');
    }
    return Number(result.tableData[0].get('relationshipCount'));
  }
}
