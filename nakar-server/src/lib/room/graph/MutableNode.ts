import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../set/Set';
import type { MutableEdge } from './MutableEdge';
import type { MutableGraph } from './MutableGraph';
import { MutableGraphElementCreationAction } from './MutableGraphElementCreationAction';
import { Range } from '../../range/Range';
import { CanvasViewSettings } from './CanvasViewSettings';

export class MutableNode {
  public static readonly defaultRadius: number = 40;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    properties: MutablePropertyCollection.schema,
    position: MutablePosition.schema,
    namesInQuery: z.array(z.string()),
    locked: z.boolean(),
    source: z.string(),
    compressed: z.array(z.string()),
    creationAction: z.nativeEnum(MutableGraphElementCreationAction),
  });

  public readonly id: string;
  public labels: SSet<string>;
  public properties: MutablePropertyCollection;
  public position: MutablePosition;
  public namesInQuery: SSet<string>;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: string;
  public compressed: SSet<string>;
  public creationAction: MutableGraphElementCreationAction;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: MutablePropertyCollection;
    position: MutablePosition;
    namesInQuery: SSet<string>;
    locked: boolean;
    grabs: SSet<string>;
    source: string;
    compressed: SSet<string>;
    creationAction: MutableGraphElementCreationAction;
  }) {
    this.id = data.id;
    this.labels = data.labels;
    this.properties = data.properties;
    this.position = data.position;
    this.namesInQuery = data.namesInQuery;
    this.locked = data.locked;
    this.grabs = data.grabs;
    this.source = data.source;
    this.compressed = data.compressed;
    this.creationAction = data.creationAction;
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

  public static fromPlain(data: z.infer<typeof this.schema>): MutableNode {
    return new MutableNode({
      id: data.id,
      labels: new SSet(data.labels),
      properties: MutablePropertyCollection.fromPlain(data.properties),
      position: MutablePosition.fromPlain(data.position),
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
    viewSettings: CanvasViewSettings,
    degreeRange: Range,
    graph: MutableGraph,
  ): number {
    if (!viewSettings.growNodesBasedOnDegree) {
      return MutableNode.defaultRadius;
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
      ) * MutableNode.defaultRadius
    );
  }

  public toPlain(): z.infer<typeof MutableNode.schema> {
    return {
      id: this.id,
      labels: this.labels.toArray(),
      properties: this.properties.toPlain(),
      position: this.position,
      namesInQuery: this.namesInQuery.toArray(),
      locked: this.locked,
      source: this.source,
      compressed: this.compressed.toArray(),
      creationAction: this.creationAction,
    };
  }

  public degree(graph: MutableGraph): number {
    return this.inDegree(graph) + this.outDegree(graph);
  }

  public inDegree(graph: MutableGraph): number {
    const inRelsCount: number = graph.edges
      .getByEndNodeId(this.id)
      .reduce(
        (count: number, rel: MutableEdge): number =>
          count + rel.representationCount,
        0,
      );

    return inRelsCount;
  }

  public outDegree(graph: MutableGraph): number {
    const outRelsCount: number = graph.edges
      .getByStartNodeId(this.id)
      .reduce(
        (count: number, rel: MutableEdge): number =>
          count + rel.representationCount,
        0,
      );

    return outRelsCount;
  }

  public copy(): MutableNode {
    return new MutableNode({
      id: this.id,
      labels: this.labels.copy(),
      properties: this.properties.copy(),
      position: this.position.copy(),
      namesInQuery: this.namesInQuery.copy(),
      locked: this.locked,
      grabs: this.grabs.copy(),
      source: this.source,
      compressed: this.compressed.copy(),
      creationAction: this.creationAction,
    });
  }
}
