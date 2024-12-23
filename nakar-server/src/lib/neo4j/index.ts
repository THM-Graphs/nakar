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
import {
  EdgeDto,
  GraphDto,
  GraphPropertyDto,
  NodeDto,
  StatsDto,
} from '../shared/dto';

const executeQueryRaw = async (
  database?: {
    host?: string | null;
    port?: number | null;
    username?: string | null;
    password?: string | null;
  } | null,
  query?: string | null,
): Promise<QueryResult> => {
  if (!database?.host) {
    throw new Error('No database host configured.');
  }
  if (!database.port) {
    throw new Error('No database port configured.');
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
    `neo4j://${database.host}:${database.port.toString()}`,
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
    host?: string | null;
    port?: number | null;
    username?: string | null;
    password?: string | null;
  } | null,
  query?: string | null,
): Promise<GraphDto> => {
  const result = await executeQueryRaw(database, query);
  const dto: GraphDto = transform(result);
  return dto;
};

export const getStats = async (
  database?: {
    host?: string | null;
    port?: number | null;
    username?: string | null;
    password?: string | null;
  } | null,
): Promise<StatsDto> => {
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
    ).map(([key, integer]) => {
      return {
        label: key,
        count: integer.toString(),
      };
    }),
    relTypes: Object.entries(
      firstRecord.get('relTypes') as Record<string, Integer>,
    ).map(([key, integer]) => {
      return {
        relationship: key,
        count: integer.toString(),
      };
    }),
    relTypesCount: Object.entries(
      firstRecord.get('relTypesCount') as Record<string, Integer>,
    ).map(([key, integer]) => {
      return {
        relationship: key,
        count: integer.toString(),
      };
    }),
  };
};

const transform = (queryResult: QueryResult): GraphDto => {
  const nodes: NodeDto[] = [];
  const edges: EdgeDto[] = [];

  for (const record of queryResult.records) {
    for (const field of record) {
      if (field instanceof Node) {
        if (nodes.find((n) => n.id === field.elementId)) {
          continue;
        }

        const id: string = field.elementId;
        const fieldProperties = field.properties as Record<string, unknown>;
        const displayTitle: string = JSON.stringify(
          fieldProperties['name'] ?? Object.values(fieldProperties)[0] ?? field,
        );
        const type: string = field.labels.join(', ');

        const properties: GraphPropertyDto[] = [];

        for (const [slug, value] of Object.entries(
          field.properties as Record<string, unknown>,
        )) {
          properties.push({ slug, value: JSON.stringify(value) });
        }

        nodes.push({ id, displayTitle, type, properties });
      }
      if (field instanceof Relationship) {
        if (edges.find((n) => n.id === field.elementId)) {
          continue;
        }

        const id: string = field.elementId;
        const startNodeId: string = field.startNodeElementId;
        const endNodeId: string = field.endNodeElementId;
        const type: string = field.type as string;

        const properties: GraphPropertyDto[] = [];
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
