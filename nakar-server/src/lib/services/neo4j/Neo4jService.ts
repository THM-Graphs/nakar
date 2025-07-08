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
import { SSet } from '../../tools/Set';
import { LoggerService } from '../logger/LoggerService';
import { Neo4jGraphElementsFactory } from './Neo4jGraphElementsFactory';
import { SessionConfig } from 'neo4j-driver-core/types/driver';
import { ApplicationService } from '../../application/ApplicationService';
import { ExpandNodePreview } from './expand-node-preview/ExpandNodePreview';
import { ExpandNodePreviewRelationshipEntry } from './expand-node-preview/ExpandNodePreviewRelationshipEntry';
import { SMap } from '../../tools/Map';
import { ExpandNodePreviewLabelEntry } from './expand-node-preview/ExpandNodePreviewLabelEntry';
import { ToManyElementsError } from './ToManyElementsError';

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
        this._logger.debug(this, `Will run query: ${query}`);
        this._logger.debug(this, `Query data: ${JSON.stringify(parameters)}`);
        const result: QueryResult = await session.run<
          RecordShape<string, unknown>
        >(query, parameters, { timeout: 30000 });

        if (
          result.records.length > Neo4jService.maximalElements &&
          checkLimit
        ) {
          throw new ToManyElementsError(result.records.length);
        }

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

  public async loadConnectingRelationshipsFromTo(
    databaseInfo: Neo4jDatabaseInfo,
    fromNodeIds: SSet<string>,
    toNodeIds: SSet<string>,
  ): Promise<Neo4jGraphElements> {
    const additional: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $fromNodeIds AND elementId(b) IN $toNodeIds RETURN DISTINCT additionalRelationship;`,
      {
        fromNodeIds: [...fromNodeIds.values()],
        toNodeIds: [...toNodeIds.values()],
      },
      false,
    );
    return additional;
  }

  public async expandNode(
    databaseInfo: Neo4jDatabaseInfo,
    nodeIds: SSet<string>,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    const additional: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $nodesIds LIMIT ${(Neo4jService.maximalElements + 1).toString()} RETURN a, additionalRelationship, b;`,
      {
        nodesIds: nodesIds,
      },
      true,
    );
    return additional;
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
ORDER BY rcount DESC
LIMIT ${Neo4jService.maximalElements.toString()}`,
      {
        nodesIds: nodesIds,
      },
      true,
    );
    const expandNodePreviewRelationshipEntries: ExpandNodePreviewRelationshipEntry[] =
      relationships.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewRelationshipEntry =>
          new ExpandNodePreviewRelationshipEntry(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            entry.get('rtype') as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            entry.get('rcount') as number,
          ),
      );

    const labels: Neo4jGraphElements = await this.executeQuery(
      databaseInfo,
      `MATCH (a)-[]-(b)
WHERE elementId(a) IN $nodesIds AND a <> b
UNWIND labels(b) as label
RETURN label, count(*) AS lcount
ORDER BY lcount DESC
LIMIT ${Neo4jService.maximalElements.toString()}`,
      {
        nodesIds: nodesIds,
      },
      true,
    );
    const expandNodePreviewLabelEntries: ExpandNodePreviewLabelEntry[] =
      labels.tableData.map(
        (entry: SMap<string, unknown>): ExpandNodePreviewLabelEntry =>
          new ExpandNodePreviewLabelEntry(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            entry.get('label') as string,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            entry.get('lcount') as number,
          ),
      );

    return new ExpandNodePreview(
      expandNodePreviewLabelEntries,
      expandNodePreviewRelationshipEntries,
    );
  }
}
