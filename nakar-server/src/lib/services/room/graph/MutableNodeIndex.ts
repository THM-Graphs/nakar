import { SMap } from '../../../tools/Map';
import { MutableNode } from './MutableNode';
import { SSet } from '../../../tools/Set';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';

export class MutableNodeIndex {
  private _byId: SMap<string, MutableNode>;

  public constructor(nodes: MutableNode[]) {
    this._byId = new SMap();

    for (const node of nodes) {
      this.add(node);
    }
  }

  public get nodes(): SSet<MutableNode> {
    return new SSet(this._byId.values());
  }

  public get size(): number {
    return this._byId.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._byId.keys());
  }

  public add(node: MutableNode): void {
    this._byId.set(node.id, node);
  }

  public addNeo4jNodes(nodes: SMap<string, Neo4jNode>): void {
    for (const node of nodes) {
      this.addNeo4jNode(node[1]);
    }
  }

  public addNeo4jNode(node: Neo4jNode): void {
    const mutableNode: MutableNode = new MutableNode({
      id: node.node.elementId,
      labels: new SSet<string>(node.node.labels),
      properties: MutablePropertyCollection.fromRecord(node.node.properties),
      radius: MutableNode.defaultRadius,
      position: MutablePosition.default(),
      namesInQuery: node.keys,
      customTitleColor: null,
      locked: false,
      grabs: new SSet(),
      source: node.source.databaseId,
      additionalSources: new SSet(),
    });

    this.add(mutableNode);
  }

  public remove(node: MutableNode): void {
    this._byId.delete(node.id);
  }

  public hasById(id: string): boolean {
    return this._byId.has(id);
  }

  public has(node: MutableNode): boolean {
    return this._byId.has(node.id);
  }

  public get(id: string): MutableNode | null {
    return this._byId.get(id) ?? null;
  }

  public byMergingWithNonOverriding(
    otherIndex: MutableNodeIndex,
  ): MutableNodeIndex {
    const newIndex: MutableNodeIndex = new MutableNodeIndex(
      this.nodes.toArray(),
    );

    for (const otherNode of otherIndex.nodes) {
      if (newIndex.hasById(otherNode.id)) {
        continue;
      }
      newIndex.add(otherNode);
    }

    return newIndex;
  }
}
