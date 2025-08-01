import { SMap } from '../../tools/Map';
import { MutableNode } from './MutableNode';
import { SSet } from '../../tools/Set';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { Range } from '../../tools/Range';
import { MutableGraph } from './MutableGraph';
import { PhysicsSimulation } from '../../physics/PhysicsSimulation';
import { LoggerService } from '../../logger/LoggerService';
import { FinalGraphDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';

export class MutableNodeIndex {
  private _byId: SMap<string, MutableNode>;

  private _byLabel: SMap<string, SSet<MutableNode>>;

  /* Maps label => count */
  private _labelHistogram: SMap<string, number>;

  /* Maps key => value => count */
  private _propertyHistogram: SMap<string, SMap<string, number>>;

  private _bySource: SMap<string, SSet<MutableNode>>;

  private _compressed: SSet<string>;

  public constructor(
    nodes: MutableNode[],
    private readonly _logger: LoggerService,
  ) {
    this._byId = new SMap();
    this._byLabel = new SMap();
    this._labelHistogram = new SMap();
    this._propertyHistogram = new SMap();
    this._bySource = new SMap();
    this._compressed = new SSet();

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

  public add(node: MutableNode): boolean {
    if (this._byId.has(node.id)) {
      return false;
    }
    if (this._compressed.has(node.id)) {
      return false;
    }
    this._byId.set(node.id, node);
    for (const label of node.labels) {
      this._addToLabelHistogram(label, 1);
    }
    for (const property of node.properties.properties) {
      this._addToPropertyHistogram(property[0], property[1], 1);
    }
    for (const label of node.labels) {
      this._byLabel.set(
        label,
        (this._byLabel.get(label) ?? new SSet()).byAdding(node),
      );
    }
    this._bySource.set(
      node.source,
      (this._bySource.get(node.source) ?? new SSet()).byAdding(node),
    );
    for (const compressed of node.compressed) {
      this._compressed.add(compressed);
    }
    return true;
  }

  public addNeo4jNodes(
    nodes: SMap<string, Neo4jNode>,
    config: FinalGraphDisplayConfiguration,
    ignoreTreatNameInQueryAsLabel: boolean,
  ): void {
    for (const node of nodes) {
      this.addNeo4jNode(node[1], config, ignoreTreatNameInQueryAsLabel);
    }
  }

  public addNeo4jNode(
    node: Neo4jNode,
    config: FinalGraphDisplayConfiguration,
    ignoreTreatNameInQueryAsLabel: boolean,
  ): MutableNode | null {
    const mutableNode: MutableNode = new MutableNode(
      {
        id: node.node.elementId,
        labels:
          config.treatNameInQueryAsLabel && !ignoreTreatNameInQueryAsLabel
            ? node.keys
            : new SSet<string>(node.node.labels),
        properties: MutablePropertyCollection.fromRecord(node.node.properties),
        position: MutablePosition.default(),
        namesInQuery: node.keys,
        locked: false,
        grabs: new SSet(),
        source: node.source.nakarId,
        compressed: new SSet(),
      },
      this._logger,
    );
    PhysicsSimulation.jiggle(mutableNode);

    const insertResult: boolean = this.add(mutableNode);
    if (!insertResult) {
      return null;
    } else {
      return mutableNode;
    }
  }

  public remove(nodeReference: string | MutableNode): boolean {
    const node: MutableNode | undefined =
      nodeReference instanceof MutableNode
        ? nodeReference
        : this._byId.get(nodeReference);
    if (node == null) {
      return false;
    }

    this._byId.delete(node.id);
    for (const label of node.labels) {
      this._byLabel.get(label)?.delete(node);
    }
    for (const label of node.labels) {
      this._addToLabelHistogram(label, -1);
    }

    for (const propertyEntry of node.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], -1);
    }

    this._bySource.get(node.source)?.delete(node);
    for (const compressed of node.compressed) {
      this._compressed.delete(compressed);
    }

    return true;
  }

  public hasById(id: string): boolean {
    return this._byId.has(id);
  }

  public has(node: MutableNode | string): boolean {
    return this._byId.has(typeof node === 'string' ? node : node.id);
  }

  public get(id: string): MutableNode | null {
    return this._byId.get(id) ?? null;
  }

  public getByLabel(label: string): SSet<MutableNode> {
    return this._byLabel.get(label) ?? new SSet();
  }

  public getBySource(source: string): SSet<MutableNode> {
    return this._bySource.get(source) ?? new SSet();
  }

  public getSources(): SSet<string> {
    return this._bySource.reduce(
      (
        akku: SSet<string>,
        key: string,
        value: SSet<MutableNode>,
      ): SSet<string> => {
        if (value.size === 0) {
          return akku;
        } else {
          return akku.byAdding(key);
        }
      },
      new SSet<string>(),
    );
  }

  public copy(): MutableNodeIndex {
    return new MutableNodeIndex(
      this.nodes.toArray().map((n: MutableNode): MutableNode => n.copy()),
      this._logger,
    );
  }

  public getNodeDegreeRange(graph: MutableGraph): Range | null {
    const degrees: number[] = this.nodes
      .map((node: MutableNode): number => node.degree(graph))
      .toArray();

    if (degrees.length === 0) {
      return null;
    }

    const range: Range = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });
    return range;
  }

  private _addToLabelHistogram(label: string, delta: 1 | -1): void {
    this._labelHistogram.set(
      label,
      (this._labelHistogram.get(label) ?? 0) + delta,
    );
    if (this._labelHistogram.get(label) === 0) {
      this._labelHistogram.delete(label);
    }
  }

  private _addToPropertyHistogram(
    key: string,
    value: unknown,
    delta: 1 | -1,
  ): void {
    const stringValue: string = JSON.stringify(value);
    const propertyHistogram: SMap<string, number> =
      this._propertyHistogram.get(key) ?? new SMap();
    propertyHistogram.set(
      stringValue,
      (propertyHistogram.get(stringValue) ?? 0) + delta,
    );
    if (propertyHistogram.get(stringValue) === 0) {
      propertyHistogram.delete(stringValue);
    }
    this._propertyHistogram.set(key, propertyHistogram);
    if (this._propertyHistogram.get(key)?.size === 0) {
      this._propertyHistogram.delete(key);
    }
  }
}
