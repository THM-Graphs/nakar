import { Node } from 'neo4j-driver';
import { Neo4jPropertyCollection } from './Neo4jPropertyCollection';

export class Neo4jNode {
  public readonly id: string;
  public readonly labels: Set<string>;
  public readonly properties: Neo4jPropertyCollection;
  public readonly nameInQuery: string;

  public constructor(data: {
    id: string;
    labels: Set<string>;
    properties: Neo4jPropertyCollection;
    nameInQuery: string;
  }) {
    this.id = data.id;
    this.labels = data.labels;
    this.properties = data.properties;
    this.nameInQuery = data.nameInQuery;
  }

  public static fromQueryResult(key: string, node: Node): Neo4jNode {
    const id: string = node.elementId;
    const labels = new Set<string>(node.labels);
    const properties = Neo4jPropertyCollection.fromQueryResult(node.properties);

    return new Neo4jNode({ id, labels, properties, nameInQuery: key });
  }
}
