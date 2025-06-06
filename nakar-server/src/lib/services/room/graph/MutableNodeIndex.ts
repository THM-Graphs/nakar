import { SMap } from '../../../tools/Map';
import { MutableNode } from './MutableNode';
import { SSet } from '../../../tools/Set';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';

export class MutableNodeIndex {
  private _byId: SMap<string, MutableNode>;

  /* Maps label => count */
  private _labelHistogram: SMap<string, number>;

  /* Maps key => value => count */
  private _propertyHistogram: SMap<string, SMap<string, number>>;

  public constructor(nodes: MutableNode[]) {
    this._byId = new SMap();
    this._labelHistogram = new SMap();
    this._propertyHistogram = new SMap();

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

  public get labelHistogram(): SMap<string, number> {
    return this._labelHistogram;
  }

  public get propertyHistogram(): SMap<string, SMap<string, number>> {
    return this._propertyHistogram;
  }

  public add(node: MutableNode): void {
    if (this._byId.has(node.id)) {
      return;
    }
    this._byId.set(node.id, node);
    for (const label of node.labels) {
      this._labelHistogram.set(
        label,
        (this._labelHistogram.get(label) ?? 0) + 1,
      );
    }
    for (const property of node.properties.properties) {
      const slug: string = property[0];
      const value: string = JSON.stringify(property[1]);
      const propertyHistogram: SMap<string, number> =
        this._propertyHistogram.get(slug) ?? new SMap();
      propertyHistogram.set(value, (propertyHistogram.get(value) ?? 0) + 1);
      this._propertyHistogram.set(slug, propertyHistogram);
    }
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
      position: MutablePosition.default(),
      namesInQuery: node.keys,
      locked: false,
      grabs: new SSet(),
      source: node.source.databaseId,
      additionalSources: new SSet(),
    });

    this.add(mutableNode);
  }

  public remove(node: string | MutableNode): void {
    if (node instanceof MutableNode) {
      this._byId.delete(node.id);
    } else {
      this._byId.delete(node);
    }
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
