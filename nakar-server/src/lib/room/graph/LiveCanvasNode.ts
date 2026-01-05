import { LiveCanvasPosition } from './LiveCanvasPosition';
import { LiveCanvasPropertyCollection } from './LiveCanvasPropertyCollection';
import { z } from 'zod';
import { SSet } from '../../set/Set';
import { LiveCanvasEdge } from './LiveCanvasEdge';
import { LiveCanvasData } from './LiveCanvasData';
import { ElementCreationReason } from './ElementCreationReason';
import { Range } from '../../range/Range';
import { LiveCanvasViewSettings } from './LiveCanvasViewSettings';

export class LiveCanvasNode {
  public static readonly defaultRadius: number = 40;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    properties: LiveCanvasPropertyCollection.schema,
    position: LiveCanvasPosition.schema,
    namesInQuery: z.array(z.string()),
    locked: z.boolean(),
    source: z.string(),
    compressed: z.array(z.string()),
    creationAction: z.nativeEnum(ElementCreationReason),
  });

  public readonly id: string;
  public readonly labels: SSet<string>;
  public readonly properties: LiveCanvasPropertyCollection;
  public readonly namesInQuery: SSet<string>;
  public readonly grabs: SSet<string>;
  public readonly source: string;
  public readonly compressed: SSet<string>;
  public readonly creationAction: ElementCreationReason;

  private _locked: boolean;
  private _position: LiveCanvasPosition;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: LiveCanvasPropertyCollection;
    position: LiveCanvasPosition;
    namesInQuery: SSet<string>;
    locked: boolean;
    grabs: SSet<string>;
    source: string;
    compressed: SSet<string>;
    creationAction: ElementCreationReason;
  }) {
    this.id = data.id;
    this.labels = data.labels;
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

  public get position(): LiveCanvasPosition {
    return this._position;
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

  public set position(value: LiveCanvasPosition) {
    this._position = value;
  }

  public static fromPlain(data: z.infer<typeof this.schema>): LiveCanvasNode {
    return new LiveCanvasNode({
      id: data.id,
      labels: new SSet(data.labels),
      properties: LiveCanvasPropertyCollection.fromPlain(data.properties),
      position: LiveCanvasPosition.fromPlain(data.position),
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
    graph: LiveCanvasData,
  ): number {
    if (!viewSettings.growNodesBasedOnDegree) {
      return LiveCanvasNode.defaultRadius;
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
      ) * LiveCanvasNode.defaultRadius
    );
  }

  public toPlain(): z.infer<typeof LiveCanvasNode.schema> {
    return {
      id: this.id,
      labels: this.labels.toArray(),
      properties: this.properties.toPlain(),
      position: this._position,
      namesInQuery: this.namesInQuery.toArray(),
      locked: this._locked,
      source: this.source,
      compressed: this.compressed.toArray(),
      creationAction: this.creationAction,
    };
  }

  public degree(graph: LiveCanvasData): number {
    return this.inDegree(graph) + this.outDegree(graph);
  }

  public inDegree(graph: LiveCanvasData): number {
    const inRelsCount: number = graph.edges
      .getByEndNodeId(this.id)
      .reduce(
        (count: number, rel: LiveCanvasEdge): number =>
          count + rel.representationCount,
        0,
      );

    return inRelsCount;
  }

  public outDegree(graph: LiveCanvasData): number {
    const outRelsCount: number = graph.edges
      .getByStartNodeId(this.id)
      .reduce(
        (count: number, rel: LiveCanvasEdge): number =>
          count + rel.representationCount,
        0,
      );

    return outRelsCount;
  }

  public copy(): LiveCanvasNode {
    return new LiveCanvasNode({
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
