import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import neo4j, {
  auth,
  Driver,
  driver,
  Node,
  QueryResult,
  RecordShape,
  Relationship,
  Session,
} from 'neo4j-driver';
import { GraphDto } from '../model/GraphDto';
import { NodeDto } from '../model/NodeDto';
import { EdgeDto } from '../model/EdgeDto';
import { PropertyDto } from '../model/PropertyDto';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private driver: Driver;

  constructor() {
    this.driver = driver(
      `neo4j://${process.env.NEO4J_HOST ?? 'localhost'}:${process.env.NEO4J_PORT ?? 7687}`,
      auth.basic(
        process.env.NEO4J_USER ?? 'neo4j',
        process.env.NEO4J_PASSWORD ?? '12345678',
      ),
    );
  }

  async executeQuery(query: string): Promise<GraphDto> {
    const session: Session = this.driver.session({
      defaultAccessMode: neo4j.session.READ,
    });
    const result: QueryResult =
      await session.run<RecordShape<string, string>>(query);
    await session.close();
    const dto: GraphDto = this.transform(result);
    return dto;
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

  public async onApplicationShutdown() {
    console.log('Will close neo4j driver.');
    await this.driver.close();
  }
}
