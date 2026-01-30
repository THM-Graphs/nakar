import { ElementPosition } from './ElementPosition';
import { PropertyCollection } from './PropertyCollection';
import { z } from 'zod';
import { SSet } from '../../set/Set';
import { GraphEdge } from './GraphEdge';
import { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { ElementCreationReason } from './ElementCreationReason';
import { Range } from '../../range/Range';
import { LiveCanvasViewSettings } from '../data/LiveCanvasViewSettings';
import { LiveCanvasLabelViewSettings } from '../data/LiveCanvasLabelViewSettings';
import { ElementColor } from './color/ElementColor';

export class GraphNode {
  public static readonly defaultRadius: number = 40;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    properties: PropertyCollection.schema,
    position: ElementPosition.schema,
    namesInQuery: z.array(z.string()),
    locked: z.boolean(),
    source: z.string(),
    compressed: z.array(z.string()),
    creationAction: z.nativeEnum(ElementCreationReason),
  });

  public readonly id: string;
  private readonly _labels: SSet<string>;
  public readonly properties: PropertyCollection;
  public readonly namesInQuery: SSet<string>;
  public readonly grabs: SSet<string>;
  public readonly source: string;
  public readonly compressed: SSet<string>;
  public readonly creationAction: ElementCreationReason;

  private _locked: boolean;
  private _position: ElementPosition;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: PropertyCollection;
    position: ElementPosition;
    namesInQuery: SSet<string>;
    locked: boolean;
    grabs: SSet<string>;
    source: string;
    compressed: SSet<string>;
    creationAction: ElementCreationReason;
  }) {
    this.id = data.id;
    this._labels = data.labels;
    this.properties = data.properties;
    this._position = data.position;
    this.namesInQuery = data.namesInQuery;
    this._locked = data.locked;
    this.grabs = data.grabs;
    this.source = data.source;
    this.compressed = data.compressed;
    this.creationAction = data.creationAction;
  }

  public get locked(): boolean {
    return this._locked;
  }

  public get position(): ElementPosition {
    return this._position;
  }

  public get labels(): string[] {
    return this._labels
      .toArray()
      .toSorted((a: string, b: string): number => a.localeCompare(b));
  }

  public get representationCount(): number {
    if (this.compressed.size === 0) {
      return 1;
    } else {
      return this.compressed.size;
    }
  }

  public get isCluster(): boolean {
    return this.compressed.size > 0;
  }

  public set locked(newValue: boolean) {
    this._locked = newValue;
  }

  public set position(value: ElementPosition) {
    this._position = value;
  }

  public static fromPlain(data: z.infer<typeof this.schema>): GraphNode {
    return new GraphNode({
      id: data.id,
      labels: new SSet(data.labels),
      properties: PropertyCollection.fromPlain(data.properties),
      position: ElementPosition.fromPlain(data.position),
      namesInQuery: new SSet(data.namesInQuery),
      locked: data.locked,
      grabs: new SSet(),
      source: data.source,
      compressed: new SSet(data.compressed),
      creationAction: data.creationAction,
    });
  }

  public getTitle(): string {
    return (
      this.properties.getStringValueOfProperty('label') ??
      this.properties.getStringValueOfProperty('name') ??
      this.properties.getStringValueOfProperty('title') ??
      this.properties.getStringValueOfProperty('type') ??
      this.properties.getStringValueOfProperty('id') ??
      this.properties.getStringValueOfProperty('slug') ??
      this.properties.firstStringValue() ??
      this.labels.toArray().join(', ')
    );
  }

  public getRadius(
    viewSettings: LiveCanvasViewSettings,
    degreeRange: Range,
    graph: LiveCanvasUndoableData,
  ): number {
    const labelViewSettings: LiveCanvasLabelViewSettings =
      viewSettings.getLabelSettings(this.primaryLabel);

    if (!viewSettings.growNodesBasedOnDegree) {
      return labelViewSettings.getComputedRadius();
    }

    const toRange: Range = new Range({
      floor: 1,
      ceiling: viewSettings.growNodesBasedOnDegreeFactor,
    });

    return (
      degreeRange.scaleValue(
        toRange,
        this.degree(graph),
        viewSettings.scaleType,
      ) * labelViewSettings.getComputedRadius()
    );
  }

  public getCustomColor(): ElementColor | null {
    // Will implement for single node color
    return null;
  }

  public toPlain(): z.infer<typeof GraphNode.schema> {
    return {
      id: this.id,
      labels: this.labels,
      properties: this.properties.toPlain(),
      position: this._position,
      namesInQuery: this.namesInQuery.toArray(),
      locked: this._locked,
      source: this.source,
      compressed: this.compressed.toArray(),
      creationAction: this.creationAction,
    };
  }

  public degree(graph: LiveCanvasUndoableData): number {
    return this.inDegree(graph) + this.outDegree(graph);
  }

  public inDegree(graph: LiveCanvasUndoableData): number {
    const inRelsCount: number = graph.edges
      .getByEndNodeId(this.id)
      .reduce(
        (count: number, rel: GraphEdge): number =>
          count + rel.representationCount,
        0,
      );

    return inRelsCount;
  }

  public outDegree(graph: LiveCanvasUndoableData): number {
    const outRelsCount: number = graph.edges
      .getByStartNodeId(this.id)
      .reduce(
        (count: number, rel: GraphEdge): number =>
          count + rel.representationCount,
        0,
      );

    return outRelsCount;
  }

  public copy(): GraphNode {
    return new GraphNode({
      id: this.id,
      labels: this.labels.copy(),
      properties: this.properties.copy(),
      position: this._position.copy(),
      namesInQuery: this.namesInQuery.copy(),
      locked: this._locked,
      grabs: this.grabs.copy(),
      source: this.source,
      compressed: this.compressed.copy(),
      creationAction: this.creationAction,
    });
  }
}
