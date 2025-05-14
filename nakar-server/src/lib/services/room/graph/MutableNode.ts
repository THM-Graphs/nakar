import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../tools/Set';
import { MutableEdge } from './MutableEdge';
import { FinalNodeDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalNodeDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../scenario-pipeline/display-configuration/NodeDisplayConfigurationContext';
import { LoggerService } from '../../logger/LoggerService';
import { MutableGraph } from './MutableGraph';
import { Color } from '../../../tools/Color';

export class MutableNode {
  public static readonly defaultRadius: number = 40;
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    properties: MutablePropertyCollection.schema,
    radius: z.number(),
    position: MutablePosition.schema,
    namesInQuery: z.array(z.string()),
    locked: z.boolean(),
    grabs: z.array(z.string()),
    source: z.string(),
    additionalSources: z.array(z.string()),
  });

  public readonly id: string;
  public labels: SSet<string>;
  public properties: MutablePropertyCollection;
  public radius: number;
  public position: MutablePosition;
  public namesInQuery: SSet<string>;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: string;
  public additionalSources: SSet<string>;

  /* runtime only */
  public velocityX: number;
  public velocityY: number;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: MutablePropertyCollection;
    radius: number;
    position: MutablePosition;
    namesInQuery: SSet<string>;
    locked: boolean;
    grabs: SSet<string>;
    source: string;
    additionalSources: SSet<string>;
  }) {
    this.id = data.id;
    this.labels = data.labels;
    this.properties = data.properties;
    this.radius = data.radius;
    this.position = data.position;
    this.namesInQuery = data.namesInQuery;
    this.locked = data.locked;
    this.grabs = data.grabs;
    this.source = data.source;
    this.additionalSources = data.additionalSources;

    this.velocityX = 0;
    this.velocityY = 0;
  }

  public static fromPlain(data: z.infer<typeof this.schema>): MutableNode {
    return new MutableNode({
      id: data.id,
      labels: new SSet(data.labels),
      properties: MutablePropertyCollection.fromPlain(data.properties),
      radius: data.radius,
      position: MutablePosition.fromPlain(data.position),
      namesInQuery: new SSet(data.namesInQuery),
      locked: data.locked,
      grabs: new SSet(data.grabs),
      source: data.source,
      additionalSources: new SSet(data.additionalSources),
    });
  }

  public toPlain(): z.infer<typeof MutableNode.schema> {
    return {
      id: this.id,
      labels: this.labels.toArray(),
      properties: this.properties.toPlain(),
      radius: this.radius,
      position: this.position,
      namesInQuery: this.namesInQuery.toArray(),
      locked: this.locked,
      grabs: this.grabs.toArray(),
      source: this.source,
      additionalSources: this.additionalSources.toArray(),
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
          count + rel.compressedCount,
        0,
      );

    return inRelsCount;
  }

  public outDegree(graph: MutableGraph): number {
    const outRelsCount: number = graph.edges
      .getByStartNodeId(this.id)
      .reduce(
        (count: number, rel: MutableEdge): number =>
          count + rel.compressedCount,
        0,
      );

    return outRelsCount;
  }

  public displayConfiguration(
    graph: MutableGraph,
  ): FinalNodeDisplayConfiguration | null {
    for (const label of this.labels) {
      const foundNodeDisplayCOnfiguration:
        | FinalNodeDisplayConfiguration
        | undefined =
        graph.displayConfiguration.nodeDisplayConfigurations.get(label);
      if (foundNodeDisplayCOnfiguration != null) {
        return foundNodeDisplayCOnfiguration;
      }
    }
    return null;
  }

  public displayConfigurationContext(
    graph: MutableGraph,
    logger: LoggerService,
  ): NodeDisplayConfigurationContext {
    return NodeDisplayConfigurationContext.create(this, graph, logger);
  }

  public customBackgroundColor(
    graph: MutableGraph,
    logger: LoggerService,
  ): string | null {
    const nodeConfig: FinalNodeDisplayConfiguration | null =
      this.displayConfiguration(graph);
    if (nodeConfig == null) {
      return null;
    }

    if (nodeConfig.backgroundColorTemplate == null) {
      return null;
    }

    const newValue: string = this.displayConfigurationContext(
      graph,
      logger,
    ).applyToTemplate(nodeConfig.backgroundColorTemplate);

    if (newValue.trim().length === 0) {
      return null;
    }
    return newValue;
  }

  public customTitleColor(
    graph: MutableGraph,
    logger: LoggerService,
  ): string | null {
    const backgroundColor: string | null = this.customBackgroundColor(
      graph,
      logger,
    );
    if (backgroundColor == null) {
      return null;
    }
    if (Color.isLightColor(backgroundColor)) {
      return '#000000';
    } else {
      return '#ffffff';
    }
  }

  public title(graph: MutableGraph, logger: LoggerService): string {
    return (
      this._customTitle(graph, logger) ??
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

  private _customTitle(
    graph: MutableGraph,
    logger: LoggerService,
  ): string | null {
    const nodeConfig: FinalNodeDisplayConfiguration | null =
      this.displayConfiguration(graph);
    if (nodeConfig == null) {
      return null;
    }
    if (nodeConfig.displayTextTemplate == null) {
      return null;
    }

    const newValue: string = NodeDisplayConfigurationContext.create(
      this,
      graph,
      logger,
    ).applyToTemplate(nodeConfig.displayTextTemplate);
    if (newValue.trim().length === 0) {
      return null;
    }

    return newValue;
  }
}
