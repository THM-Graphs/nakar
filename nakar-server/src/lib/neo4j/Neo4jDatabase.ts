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

export class Neo4jDatabase {
  private readonly loginCredentials: Neo4jLoginCredentials;

  public constructor(loginCredentials: Neo4jLoginCredentials) {
    this.loginCredentials = loginCredentials;
  }

  public async executeQuery(
    query: string,
    parameters?: Record<string, unknown>,
  ): Promise<Neo4jGraphElements> {
    const driver: Driver = createDriver(
      this.loginCredentials.url,
      auth.basic(
        this.loginCredentials.username,
        this.loginCredentials.password,
      ),
    );
    try {
      const session: Session = driver.session({
        defaultAccessMode: neo4j.session.READ,
      });
      try {
        const result: QueryResult = await session.run<
          RecordShape<string, string>
        >(query, parameters);

        return Neo4jGraphElements.fromQueryResult(result);
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
    nodeIds: Set<string>,
  ): Promise<Neo4jGraphElements> {
    const nodesIds = [...nodeIds.values()];
    const additional = await this.executeQuery(
      'MATCH (a)-[additionalRelationship]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN additionalRelationship;',
      { existingNodeIds: nodesIds },
    );
    return additional;
  }
}
