import neo4j, {
  auth,
  driver as createDriver,
  Driver,
  QueryResult,
  RecordShape,
  Session,
} from 'neo4j-driver';
import { Neo4jGraph } from './types/Neo4jGraph';
import { Neo4jWrapperErrorNoLoginData } from './errors/Neo4jWrapperErrorNoLoginData';
import { Neo4jEdge } from './types/Neo4jEdge';

export class Neo4jWrapper {
  private url: string;
  private username: string;
  private password: string;

  public constructor(
    database?: {
      url?: string | null;
      username?: string | null;
      password?: string | null;
    } | null,
  ) {
    if (database?.url == null) {
      throw new Neo4jWrapperErrorNoLoginData('url');
    }
    if (database.username == null) {
      throw new Neo4jWrapperErrorNoLoginData('username');
    }
    if (database.password == null) {
      throw new Neo4jWrapperErrorNoLoginData('password');
    }
    this.url = database.url;
    this.username = database.username;
    this.password = database.password;
  }

  public async executeQueryRaw(
    query?: string | null,
    parameters?: Record<string, unknown>,
  ): Promise<QueryResult> {
    if (query == null) {
      throw new Error('No cypher query configured.');
    }

    const driver: Driver = createDriver(
      this.url,
      auth.basic(this.username, this.password),
    );
    try {
      const session: Session = driver.session({
        defaultAccessMode: neo4j.session.READ,
      });
      try {
        const result: QueryResult = await session.run<
          RecordShape<string, string>
        >(query, parameters);
        return result;
      } catch (error) {
        await session.close();
        throw error;
      }
    } catch (error) {
      await driver.close();
      throw error;
    }
  }

  public async executeQuery(
    query?: string | null,
    parameters?: Record<string, unknown>,
  ): Promise<Neo4jGraph> {
    const result = await this.executeQueryRaw(query, parameters);
    const graph: Neo4jGraph = Neo4jGraph.fromQueryResult(result);
    return graph;
  }

  public async loadConnectingRelationships(
    nodeIds: Set<string>,
  ): Promise<Map<string, Neo4jEdge>> {
    const nodesIds = [...nodeIds.values()];
    const additional = await this.executeQuery(
      'MATCH (a)-[r]->(b) WHERE elementId(a) IN $existingNodeIds AND elementId(b) IN $existingNodeIds RETURN r;',
      { existingNodeIds: nodesIds },
    );
    return additional.edges;
  }
}
