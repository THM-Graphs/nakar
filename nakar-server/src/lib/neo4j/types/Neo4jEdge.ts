import { Relationship } from 'neo4j-driver';
import { Neo4jPropertyCollection } from './Neo4jPropertyCollection';

export class Neo4jEdge {
  public constructor(
    public readonly id: string,
    public readonly startNodeId: string,
    public readonly endNodeId: string,
    public readonly type: string,
    public readonly properties: Neo4jPropertyCollection,
  ) {}

  public static fromQueryResult(relationship: Relationship): Neo4jEdge {
    const id: string = relationship.elementId;
    const startNodeId: string = relationship.startNodeElementId;
    const endNodeId: string = relationship.endNodeElementId;
    const type: string = relationship.type;
    const properties = Neo4jPropertyCollection.fromQueryResult(
      relationship.properties,
    );

    return new Neo4jEdge(id, startNodeId, endNodeId, type, properties);
  }
}
