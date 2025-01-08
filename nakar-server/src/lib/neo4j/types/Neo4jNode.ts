import { Node } from 'neo4j-driver';
import { Neo4jPropertyCollection } from './Neo4jPropertyCollection';

export class Neo4jNode {
  public constructor(
    public readonly id: string,
    public readonly labels: Set<string>,
    public readonly properties: Neo4jPropertyCollection,
  ) {}

  public static fromQueryResult(node: Node): Neo4jNode {
    const id: string = node.elementId;
    const labels = new Set<string>(node.labels);
    const properties = Neo4jPropertyCollection.fromQueryResult(node.properties);

    return new Neo4jNode(id, labels, properties);
  }
}
