import neo4j, {
  auth,
  Driver,
  driver as createDriver,
  Node,
  QueryResult,
  RecordShape,
  Relationship,
  Session,
  Integer,
} from 'neo4j-driver';
const executeQueryRaw = async (
  database?: {
    url?: string | null;
    username?: string | null;
    password?: string | null;
  } | null,
  query?: string | null,
): Promise<QueryResult> => {
  if (!database?.url) {
    throw new Error('No database url configured.');
  }
  if (!database.username) {
    throw new Error('No database username configured.');
  }
  if (!database.password) {
    throw new Error('No database password configured.');
  }
  if (!query) {
    throw new Error('No cypher query configured.');
  }

  const driver: Driver = createDriver(
    database.url,
    auth.basic(database.username, database.password),
  );
  try {
    const session: Session = driver.session({
      defaultAccessMode: neo4j.session.READ,
    });
    try {
      const result: QueryResult =
        await session.run<RecordShape<string, string>>(query);
      return result;
    } catch (error) {
      await session.close();
      throw error;
    }
  } catch (error) {
    await driver.close();
    throw error;
  }
};

export const executeQuery = async (
  database?: {
    url?: string | null;
    username?: string | null;
    password?: string | null;
  } | null,
  query?: string | null,
): Promise<Neo4jGraph> => {
  const result = await executeQueryRaw(database, query);
  const dto: Neo4jGraph = transform(result);
  return dto;
};

export const getStats = async (
  database?: {
    host?: string | null;
    port?: number | null;
    username?: string | null;
    password?: string | null;
  } | null,
): Promise<Neo4jStats> => {
  const result = await executeQueryRaw(database, 'CALL apoc.meta.stats');
  const firstRecord = result.records[0];

  return {
    labelCount: (firstRecord.get('labelCount') as Integer).toString(),
    relTypeCount: (firstRecord.get('relTypeCount') as Integer).toString(),
    propertyKeyCount: (
      firstRecord.get('propertyKeyCount') as Integer
    ).toString(),
    nodeCount: (firstRecord.get('nodeCount') as Integer).toString(),
    relCount: (firstRecord.get('relCount') as Integer).toString(),
    labels: Object.entries(
      firstRecord.get('labels') as Record<string, Integer>,
    ).map(([key, integer]): Neo4jStatsLabel => {
      return {
        label: key,
        count: integer.toString(),
      };
    }),
    relTypes: Object.entries(
      firstRecord.get('relTypes') as Record<string, Integer>,
    ).map(([key, integer]): Neo4jStatsRelType => {
      return {
        relationship: key,
        count: integer.toString(),
      };
    }),
    relTypesCount: Object.entries(
      firstRecord.get('relTypesCount') as Record<string, Integer>,
    ).map(([key, integer]): Neo4jStatsRelType => {
      return {
        relationship: key,
        count: integer.toString(),
      };
    }),
  };
};

const transform = (queryResult: QueryResult): Neo4jGraph => {
  const nodes: Neo4jNode[] = [];
  const edges: Neo4jEdge[] = [];

  for (const record of queryResult.records) {
    for (const field of record) {
      if (field instanceof Node) {
        if (nodes.find((n) => n.id === field.elementId)) {
          continue;
        }

        const id: string = field.elementId;
        const labels: string[] = field.labels as string[];

        const properties: Neo4JProperty[] = [];

        for (const [slug, value] of Object.entries(
          field.properties as Record<string, unknown>,
        )) {
          properties.push({ slug, value: JSON.stringify(value) });
        }

        nodes.push({ id, labels, properties });
      }
      if (field instanceof Relationship) {
        if (edges.find((n) => n.id === field.elementId)) {
          continue;
        }

        const id: string = field.elementId;
        const startNodeId: string = field.startNodeElementId;
        const endNodeId: string = field.endNodeElementId;
        const type: string = field.type as string;

        const properties: Neo4JProperty[] = [];
        for (const [slug, value] of Object.entries(
          field.properties as Record<string, unknown>,
        )) {
          properties.push({ slug, value: JSON.stringify(value) });
        }

        edges.push({ id, startNodeId, endNodeId, type, properties });
      }
    }
  }

  return { nodes, edges };
};

export interface Neo4jGraph {
  nodes: Array<Neo4jNode>;
  edges: Array<Neo4jEdge>;
}

export interface Neo4jNode {
  id: string;
  labels: string[];
  properties: Array<Neo4JProperty>;
}

export interface Neo4jEdge {
  id: string;
  startNodeId: string;
  endNodeId: string;
  type: string;
  properties: Array<Neo4JProperty>;
}

export interface Neo4JProperty {
  slug: string;
  value: string;
}

export interface Neo4jStatsLabel {
  label: string;
  count: string;
}

export interface Neo4jStatsRelType {
  relationship: string;
  count: string;
}

export interface Neo4jStats {
  labelCount: string;
  relTypeCount: string;
  propertyKeyCount: string;
  nodeCount: string;
  relCount: string;
  labels: Neo4jStatsLabel[];
  relTypes: Neo4jStatsRelType[];
  relTypesCount: Neo4jStatsRelType[];
}
