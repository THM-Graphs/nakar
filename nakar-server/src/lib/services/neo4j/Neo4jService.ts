import { Neo4jLoginCredentials } from './Neo4jLoginCredentials';
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
  public constructor(private readonly _logger: LoggerService) {}

  public bootstrap(): void | Promise<void> {
    /* */
  }

  public destroy(): void | Promise<void> {
    /* */
  }

  public async executeQuery(
    loginCredentials: Neo4jLoginCredentials,
    query: string,
    sourceId: string,
    parameters?: Record<string, unknown>,
  ): Promise<Neo4jGraphElements> {
    const driver: Driver = createDriver(
      loginCredentials.url,
      auth.basic(loginCredentials.username, loginCredentials.password),
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

        const nei4jGraphElementsFactory: Neo4jGraphElementsFactory =
          new Neo4jGraphElementsFactory(this._logger);
        return nei4jGraphElementsFactory.fromQueryResult(result, sourceId);
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
    loginCredentials: Neo4jLoginCredentials,
    nodeIds: SSet<string>,
    sourceId: string,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    const additional: Neo4jGraphElements = await this.executeQuery(
      loginCredentials,
      'MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN additionalRelationship;',
      sourceId,
      {
        existingNodeIds: nodesIds,
      },
    );
    return additional;
  }
}
