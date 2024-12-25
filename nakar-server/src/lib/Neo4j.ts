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
  Path,
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
  const nodes: Map<string, Neo4jNode> = new Map();
  const edges: Map<string, Neo4jEdge> = new Map();
  const tableData: Record<string, string>[] = [];

  const transformProperties = (
    properties: Record<string, unknown>,
  ): Neo4JProperty[] => {
    return Object.entries(properties).map<Neo4JProperty>(
      ([slug, value]: [string, unknown]): Neo4JProperty => {
        return { slug, value: JSON.stringify(value) };
      },
    );
  };

  const transformNode = (node: Node): Neo4jNode => {
    const id: string = node.elementId;
    const labels: string[] = node.labels;
    const properties = transformProperties(node.properties);

    return { id, labels, properties };
  };

  const tranformRelationship = (relationship: Relationship): Neo4jEdge => {
    const id: string = relationship.elementId;
    const startNodeId: string = relationship.startNodeElementId;
    const endNodeId: string = relationship.endNodeElementId;
    const type: string = relationship.type;
    const properties = transformProperties(relationship.properties);

    return { id, startNodeId, endNodeId, type, properties };
  };

  for (const record of queryResult.records) {
    const tableEntry: Record<string, string> = {};
    for (const key of record.keys as string[]) {
      const field: unknown = record.get(key);
      if (field instanceof Node) {
        const node: Neo4jNode = transformNode(field as Node);
        nodes.set(node.id, node);
        tableEntry[key] = node.id;
      } else if (field instanceof Relationship) {
        const edge: Neo4jEdge = tranformRelationship(field as Relationship);
        edges.set(edge.id, edge);
        tableEntry[key] = edge.id;
      } else if (field instanceof Path) {
        for (const segment of field.segments) {
          const startNode: Neo4jNode = transformNode(segment.start as Node);
          nodes.set(startNode.id, startNode);
          tableEntry[key] = startNode.id;

          const endNode: Neo4jNode = transformNode(segment.end as Node);
          nodes.set(endNode.id, endNode);
          tableEntry[key] = endNode.id;

          const edge = tranformRelationship(
            segment.relationship as Relationship,
          );
          edges.set(edge.id, edge);
          tableEntry[key] = edge.id;
        }
      } else {
        if (field instanceof Integer) {
          tableEntry[key] = JSON.stringify(field.toString());
        } else {
          tableEntry[key] = JSON.stringify(field);
        }
      }
    }
    tableData.push(tableEntry);
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    tableData,
  };
};

export interface Neo4jGraph {
  nodes: Array<Neo4jNode>;
  edges: Array<Neo4jEdge>;
  tableData: Record<string, string>[];
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
