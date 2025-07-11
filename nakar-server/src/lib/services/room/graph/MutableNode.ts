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
import { FinalGraphDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../../../tools/Range';

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
    additionalSources: z.array(z.string()),
  });

  public readonly id: string;
  public labels: SSet<string>;
  public properties: MutablePropertyCollection;
  public position: MutablePosition;
  public namesInQuery: SSet<string>;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: string;
  public additionalSources: SSet<string>;

  public constructor(data: {
    id: string;
    labels: SSet<string>;
    properties: MutablePropertyCollection;
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
    this.position = data.position;
    this.namesInQuery = data.namesInQuery;
    this.locked = data.locked;
    this.grabs = data.grabs;
    this.source = data.source;
    this.additionalSources = data.additionalSources;
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
      additionalSources: new SSet(data.additionalSources),
    });
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
    displayConfiguration: FinalGraphDisplayConfiguration,
  ): FinalNodeDisplayConfiguration | null {
    for (const label of this.labels) {
      const foundNodeDisplayCOnfiguration:
        | FinalNodeDisplayConfiguration
        | undefined = displayConfiguration.nodeDisplayConfigurations.get(label);
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
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): string | null {
    const nodeConfig: FinalNodeDisplayConfiguration | null =
      this.displayConfiguration(config);
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
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): string | null {
    const backgroundColor: string | null = this.customBackgroundColor(
      graph,
      config,
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

  public title(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): string {
    return (
      this._customTitle(graph, config, logger) ??
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

  public radius(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): number {
    return (
      (this._customRadius(graph, config, logger) ?? MutableNode.defaultRadius) *
      this._customRadiusFactor(graph, config)
    );
  }

  private _customTitle(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): string | null {
    const nodeConfig: FinalNodeDisplayConfiguration | null =
      this.displayConfiguration(config);
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

  private _customRadius(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    logger: LoggerService,
  ): number | null {
    const nodeConfig: FinalNodeDisplayConfiguration | null =
      this.displayConfiguration(config);
    if (nodeConfig == null) {
      return null;
    }
    if (nodeConfig.radiusTemplate == null) {
      return null;
    }

    const newValue: string = NodeDisplayConfigurationContext.create(
      this,
      graph,
      logger,
    ).applyToTemplate(nodeConfig.radiusTemplate);
    if (newValue.trim().length === 0) {
      return null;
    }

    const newRadius: number = parseFloat(newValue);
    if (isNaN(newRadius)) {
      logger.warn(
        this,
        `Unable to parse node radius config: "${newRadius.toString()}" for node ${this.id}`,
      );
      return null;
    }

    return newRadius;
  }

  private _customRadiusFactor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): number {
    if (!config.growNodesBasedOnDegree) {
      return 1;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return 1;
    }

    const degrees: number[] = graph.nodes.nodes.reduce(
      (akku: number[], value: MutableNode): number[] => [
        ...akku,
        value.degree(graph),
      ],
      [],
    );

    if (degrees.length === 0) {
      return 1;
    }

    const fromRange: Range = new Range({
      floor: Math.min(...degrees),
      ceiling: Math.max(...degrees),
    });

    const toRange: Range = new Range({
      floor: 1,
      ceiling: config.growNodesBasedOnDegreeFactor,
    });

    return fromRange.scaleValue(toRange, this.degree(graph), config.scaleType);
  }
}
