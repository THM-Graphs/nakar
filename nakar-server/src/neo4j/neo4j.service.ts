import { Injectable, Logger } from '@nestjs/common';
import neo4j, {
  auth,
  Driver,
  driver as createDriver,
  Node,
  QueryResult,
  RecordShape,
  Relationship,
  Session,
} from 'neo4j-driver';
import { GraphDto } from '../graph/dto/GraphDto';
import { NodeDto } from '../graph/dto/NodeDto';
import { EdgeDto } from '../graph/dto/EdgeDto';
import { PropertyDto } from '../graph/dto/PropertyDto';
import { DatabaseDefinition } from '../repository/entities/DatabaseDefinition';

@Injectable()
export class Neo4jService {
  async executeQuery(
    database: DatabaseDefinition,
    query: string,
  ): Promise<GraphDto> {
    Logger.debug(`Will run query on ${database.title}`, { query });

    const driver: Driver = createDriver(
      `neo4j://${database.host}:${database.port}`,
      auth.basic(database.username, database.password),
    );
    try {
      const session: Session = driver.session({
        defaultAccessMode: neo4j.session.READ,
      });
      try {
        const result: QueryResult =
          await session.run<RecordShape<string, string>>(query);
        const dto: GraphDto = this.transform(result);
        return dto;
      } catch (error) {
        await session.close();
        throw error;
      }
    } catch (error) {
      await driver.close();
      throw error;
    }
  }

  public transform(queryResult: QueryResult): GraphDto {
    const nodes: NodeDto[] = [];
    const edges: EdgeDto[] = [];

    for (const record of queryResult.records) {
      for (const field of record) {
        if (field instanceof Node) {
          if (nodes.find((n) => n.id === field.elementId)) {
            continue;
          }

          const id: string = field.elementId;
          const displayTitle: string =
            field.properties['name'] ??
            Object.values(field.properties)[0] ??
            field.toString();
          const type: string = field.labels.join(', ');

          const properties: PropertyDto[] = [];

          for (const entry of Object.entries(field.properties)) {
            const property = new PropertyDto(entry[0], entry[1] as string);
            properties.push(property);
          }

          const node = new NodeDto(id, displayTitle, type, properties);
          nodes.push(node);
        }
        if (field instanceof Relationship) {
          if (edges.find((n) => n.id === field.elementId)) {
            continue;
          }

          const id: string = field.elementId;
          const startId: string = field.startNodeElementId;
          const endId: string = field.endNodeElementId;
          const type: string = field.type;

          const properties: PropertyDto[] = [];
          for (const [key, value] of Object.entries(field.properties)) {
            const property = new PropertyDto(key, value as string);
            properties.push(property);
          }

          const edge = new EdgeDto(id, startId, endId, type, properties);
          edges.push(edge);
        }
      }
    }

    const graph = new GraphDto(nodes, edges);
    return graph;
  }
}
