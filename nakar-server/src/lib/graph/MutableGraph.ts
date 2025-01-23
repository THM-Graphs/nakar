import { MutableNode } from './MutableNode';
import { MutableEdge } from './MutableEdge';
import { MutableGraphMetaData } from './MutableGraphMetaData';
import { Neo4jGraphElements } from '../neo4j/Neo4jGraphElements';
import { SchemaGraph } from '../../../src-gen/schema';

export class MutableGraph {
  public nodes: Map<string, MutableNode>;
  public edges: Map<string, MutableEdge>;
  public metaData: MutableGraphMetaData;

  public constructor(data: {
    nodes: Map<string, MutableNode>;
    edges: Map<string, MutableEdge>;
    metaData: MutableGraphMetaData;
  }) {
    this.nodes = data.nodes;
    this.edges = data.edges;
    this.metaData = data.metaData;
  }

  public static create(graphElements: Neo4jGraphElements): MutableGraph {
    return new MutableGraph({
      nodes: graphElements.nodes.map((node) => MutableNode.create(node)),
      edges: graphElements.relationships.map((relationship) =>
        MutableEdge.create(relationship),
      ),
      metaData: MutableGraphMetaData.empty(),
    });
  }

  public toDto(): SchemaGraph {
    return {
      nodes: this.nodes.toArray().map(([id, node]) => node.toDto(id)),
      edges: this.edges.toArray().map(([id, edge]) => edge.toDto(id)),
      metaData: this.metaData.toDto(),
    };
  }

  public addNonDuplicateEdges(newEdges: Map<string, MutableEdge>): void {
    for (const [newId, newEdge] of newEdges.entries()) {
      if (!this.edges.has(newId)) {
        this.edges.set(newId, newEdge);
      }
    }
  }

  public addNonDuplicateNodes(newNodes: Map<string, MutableNode>): void {
    for (const [newId, newNode] of newNodes.entries()) {
      if (!this.nodes.has(newId)) {
        this.nodes.set(newId, newNode);
      }
    }
  }
}
