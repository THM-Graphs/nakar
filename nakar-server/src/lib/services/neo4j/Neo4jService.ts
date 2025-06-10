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

export class Neo4jService implements ApplicationService {
  private static readonly _maximalElements: number = 500;

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
    parameters?: Record<string, unknown>,
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
        >(query, parameters);

        if (result.records.length > Neo4jService._maximalElements) {
          throw new Error(
            `To many elements: ${result.records.length.toString()} (maximum: ${Neo4jService._maximalElements.toString()})`,
          );
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
      'MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN a, additionalRelationship, b;',
      {
        existingNodeIds: nodesIds,
      },
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
      'MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $fromNodeIds AND elementId(b) IN $toNodeIds RETURN a, additionalRelationship, b;',
      {
        fromNodeIds: [...fromNodeIds.values()],
        toNodeIds: [...toNodeIds.values()],
      },
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
      'MATCH (a)-[additionalRelationship]-(b) WHERE elementId(a) IN $nodesIds RETURN a, additionalRelationship, b;',
      {
        nodesIds: nodesIds,
      },
    );
    return additional;
  }
}
