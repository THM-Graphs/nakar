import { SMap } from '../../../packages/map/Map';
import { GraphNode } from './GraphNode';
import { SSet } from '../../../packages/set/Set';
import { Neo4jNode } from '../../neo4j/Neo4jNode';
import { ElementPosition } from './ElementPosition';
import { PropertyCollection } from './PropertyCollection';
import { Range } from '../../../packages/range/Range';
import { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { ElementCreationReason } from './ElementCreationReason';
import { LabelIndex } from './LabelIndex';
import { DatabaseReferenceCache } from '../../schema/DatabaseReferenceCache';
import { Result } from '@strapi/types/dist/modules/documents';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';
import Handlebars from 'handlebars';

export class NodeIndex {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _byId: SMap<string, GraphNode>;

  private readonly _byLabel: SMap<string, SSet<GraphNode>>;

  /* Maps label => count */
  private readonly _labelIndex: LabelIndex;

  /* Maps key => value => count */
  private readonly _propertyHistogram: SMap<string, SMap<string, number>>;

  private readonly _bySource: SMap<string, SSet<GraphNode>>;

  /* source id => native ids */
  private readonly _compressed: SMap<string, SSet<string>>;

  /* source id => native id => cluster node that contains this nativeId in compressed */
  private readonly _compressedNodes: SMap<string, SMap<string, GraphNode>>;

  public constructor(nodes: GraphNode[]) {
    this._byId = new SMap();
    this._byLabel = new SMap();
    this._labelIndex = new LabelIndex();
    this._propertyHistogram = new SMap();
    this._bySource = new SMap();
    this._compressed = new SMap();
    this._compressedNodes = new SMap();

    for (const node of nodes) {
      this.add(node);
    }
  }

  public get nodes(): SSet<GraphNode> {
    return new SSet(this._byId.values());
  }

  public get size(): number {
    return this._byId.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._byId.keys());
  }

  public get labelIndex(): LabelIndex {
    return this._labelIndex;
  }

  public get propertyHistogram(): SMap<string, SMap<string, number>> {
    return this._propertyHistogram;
  }

  public reset(): void {
    for (const node of this.nodes) {
      this.remove(node);
    }
  }

  public add(node: GraphNode): boolean {
    if (this._byId.has(node.id)) {
      return false;
    }
    if (
      (this._compressed.get(node.sourceId) ?? new SSet()).has(node.nativeId)
    ) {
      return false;
    }
    this._byId.set(node.id, node);
    for (const label of node.labels) {
      this._labelIndex.add(label, node.sourceId, node.sourceTitle);
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
      node.sourceId,
      (this._bySource.get(node.sourceId) ?? new SSet()).byAdding(node),
    );
    for (const compressed of node.compressed) {
      this._compressed.set(
        node.sourceId,
        (this._compressed.get(node.sourceId) ?? new SSet()).byAdding(
          compressed,
        ),
      );
      this._compressedNodes.set(
        node.sourceId,
        (this._compressedNodes.get(node.sourceId) ?? new SMap()).bySetting(
          compressed,
          node,
        ),
      );
    }
    return true;
  }

  public async addNeo4jNodes(
    nodes: SMap<string, Neo4jNode>,
    creationAction: ElementCreationReason,
    databaseCache: DatabaseReferenceCache,
  ): Promise<void> {
    for (const node of nodes.toValueArray()) {
      await this.addNeo4jNode(node, creationAction, databaseCache);
    }
  }

  public async addNeo4jNode(
    node: Neo4jNode,
    creationAction: ElementCreationReason,
    databaseCache: DatabaseReferenceCache,
  ): Promise<GraphNode | null> {
    const mutableNode: GraphNode = new GraphNode({
      id: node.source.nakarId + '_' + node.node.elementId,
      nativeId: node.node.elementId,
      labels: new SSet<string>(node.node.labels),
      properties: PropertyCollection.fromRecord(node.node.properties),
      position: ElementPosition.jiggled(),
      namesInQuery: node.keys,
      locked: false,
      grabs: new SSet(),
      sourceId: node.source.nakarId,
      sourceTitle: node.source.nakarTitle,
      compressed: new SSet(),
      creationAction: creationAction,
      url: await this._getUrl(node, databaseCache),
      coverImageUrl: await this._getCoverImageUrl(node, databaseCache),
      scenarioGroups: [],
      noteReferences: new SSet(),
    });

    const insertResult: boolean = this.add(mutableNode);
    if (!insertResult) {
      return null;
    } else {
      return mutableNode;
    }
  }

  public remove(nodeReference: string | GraphNode): boolean {
    const node: GraphNode | undefined =
      nodeReference instanceof GraphNode
        ? nodeReference
        : this._byId.get(nodeReference);
    if (node == null) {
      return false;
    }

    this._byId.delete(node.id);
    for (const label of node.labels) {
      this._byLabel.get(label)?.delete(node);
      if ((this._byLabel.get(label)?.size ?? 0) === 0) {
        this._byLabel.delete(label);
      }
    }
    for (const label of node.labels) {
      this._labelIndex.remove(label);
    }

    for (const propertyEntry of node.properties.properties) {
      this._addToPropertyHistogram(propertyEntry[0], propertyEntry[1], -1);
    }

    this._bySource.get(node.sourceId)?.delete(node);
    if ((this._bySource.get(node.sourceId)?.size ?? 0) === 0) {
      this._bySource.delete(node.sourceId);
    }
    for (const compressed of node.compressed) {
      this._compressed.get(node.sourceId)?.delete(compressed);
      this._compressedNodes.get(node.sourceId)?.delete(compressed);
    }

    return true;
  }

  public hasById(id: string): boolean {
    return this._byId.has(id);
  }

  public has(node: GraphNode | string): boolean {
    return this._byId.has(typeof node === 'string' ? node : node.id);
  }

  public get(id: string): GraphNode | null {
    return this._byId.get(id) ?? null;
  }

  public getByLabel(label: string): SSet<GraphNode> {
    return this._byLabel.get(label) ?? new SSet();
  }

  public getBySource(source: string): SSet<GraphNode> {
    return this._bySource.get(source) ?? new SSet();
  }

  public getClusterNodeForCompressedNativeId(
    sourceId: string,
    nativeNodeId: string,
  ): GraphNode | null {
    return (
      this._compressedNodes.get(sourceId)?.get(nativeNodeId) ?? null
    );
  }

  public getSources(): SSet<string> {
    return this._bySource.reduce(
      (
        akku: SSet<string>,
        key: string,
        value: SSet<GraphNode>,
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

  public copy(): NodeIndex {
    return new NodeIndex(
      this.nodes.toArray().map((n: GraphNode): GraphNode => n.copy()),
    );
  }

  public getNodeDegreeRange(graph: LiveCanvasUndoableData): Range {
    const degrees: number[] = this.nodes
      .map((node: GraphNode): number => node.degree(graph))
      .toArray();

    if (degrees.length === 0) {
      return Range.one();
    }

    const range: Range = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });
    return range;
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

  private async _getCoverImageUrl(
    node: Neo4jNode,
    databaseCache: DatabaseReferenceCache,
  ): Promise<URL | null> {
    const nodeConfigs: Result<'api::node-configuration.node-configuration'>[] =
      await databaseCache.getNodeConfigurations(node.source.nakarId);
    for (const nodeConfig of nodeConfigs) {
      if (
        nodeConfig.label == null ||
        nodeConfig.linkTemplate == null ||
        nodeConfig.property == null ||
        nodeConfig.type !== 'image'
      ) {
        continue;
      }
      if (!node.node.labels.includes(nodeConfig.label)) {
        continue;
      }
      const propertyValue: unknown = node.node.properties[nodeConfig.property];
      const value: string | null =
        typeof propertyValue === 'string' ? propertyValue : null;
      if (value == null) {
        continue;
      }
      const template: HandlebarsTemplateDelegate = Handlebars.compile(
        nodeConfig.linkTemplate,
      );
      const link: string = template({
        value:
          (nodeConfig.urlEncode ?? false) ? encodeURIComponent(value) : value,
      });

      try {
        return new URL(link);
      } catch (error: unknown) {
        this._logger.warn(
          `Cannot create url of string '${link}': ${JSON.stringify(error)}`,
        );
      }
    }
    return null;
  }

  private async _getUrl(
    node: Neo4jNode,
    databaseCache: DatabaseReferenceCache,
  ): Promise<URL | null> {
    const nodeConfigs: Result<'api::node-configuration.node-configuration'>[] =
      await databaseCache.getNodeConfigurations(node.source.nakarId);
    for (const nodeConfig of nodeConfigs) {
      if (
        nodeConfig.label == null ||
        nodeConfig.linkTemplate == null ||
        nodeConfig.property == null ||
        nodeConfig.type !== 'link'
      ) {
        continue;
      }
      if (!node.node.labels.includes(nodeConfig.label)) {
        continue;
      }
      const propertyValue: unknown = node.node.properties[nodeConfig.property];
      const value: string | null =
        typeof propertyValue === 'string' ? propertyValue : null;
      if (value == null) {
        continue;
      }
      const template: HandlebarsTemplateDelegate = Handlebars.compile(
        nodeConfig.linkTemplate,
      );
      const link: string = template({
        value:
          (nodeConfig.urlEncode ?? false) ? encodeURIComponent(value) : value,
      });

      try {
        return new URL(link);
      } catch (error: unknown) {
        this._logger.warn(
          `Cannot create url of string '${link}': ${JSON.stringify(error)}`,
        );
      }
    }
    return null;
  }
}
