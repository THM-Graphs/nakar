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
import { SSet } from '../Set';
import { LoggerService } from '../../services/logger/LoggerService';
import { Neo4jGraphElementsFactory } from './Neo4jGraphElementsFactory';
import { SessionConfig } from 'neo4j-driver-core/types/driver';

export class Neo4jDatabase {
  private readonly _loginCredentials: Neo4jLoginCredentials;

  public constructor(
    loginCredentials: Neo4jLoginCredentials,
    private readonly _logger: LoggerService,
  ) {
    this._loginCredentials = loginCredentials;
  }

  public async executeQuery(
    query: string,
    parameters?: Record<string, unknown>,
  ): Promise<Neo4jGraphElements> {
    const driver: Driver = createDriver(
      this._loginCredentials.url,
      auth.basic(
        this._loginCredentials.username,
        this._loginCredentials.password,
      ),
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
        return nei4jGraphElementsFactory.fromQueryResult(result);
      } catch (error) {
        await session.close();
        throw error;
      }
    } catch (error) {
      await driver.close();
      throw error;
    }
  }

  public async loadConnectingRelationships(
    nodeIds: SSet<string>,
  ): Promise<Neo4jGraphElements> {
    const nodesIds: string[] = [...nodeIds.values()];
    const additional: Neo4jGraphElements = await this.executeQuery(
      'MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN additionalRelationship;',
      {
        existingNodeIds: nodesIds,
      },
    );
    return additional;
  }
}
