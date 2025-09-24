import { MutablePosition } from './MutablePosition';
import { MutablePropertyCollection } from './MutablePropertyCollection';
import { z } from 'zod';
import { SSet } from '../../tools/Set';
import type { MutableEdge } from './MutableEdge';
import type { FinalNodeDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalNodeDisplayConfiguration';
import { NodeDisplayConfigurationContext } from '../scenario-pipeline/display-configuration/NodeDisplayConfigurationContext';
import type { LoggerService } from '../../logger/LoggerService';
import type { MutableGraph } from './MutableGraph';
import { Color } from '../../tools/Color';
import type { FinalGraphDisplayConfiguration } from '../scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import { Range } from '../../tools/Range';
import { MutableGraphElementCreationAction } from './MutableGraphElementCreationAction';
import type { GetNotesDBDTO } from '../../database/dto/GetNotesDBDTO';
import type { GetNoteDBDTO } from '../../database/dto/GetNoteDBDTO';
import type { MutableGraphColor } from './MutableGraphColor';
import { MutableGraphColorFactory } from './MutableGraphColorFactory';
import { MutableGraphColorCustom } from './MutableGraphColorCustom';

export class MutableNode {
  public static readonly defaultRadius: number = 40;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    labels: z.array(z.string()),
    nativeLabels: z.array(z.string()),
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
  public nativeLabels: SSet<string>;
  public properties: MutablePropertyCollection;
  public position: MutablePosition;
  public namesInQuery: SSet<string>;
  public locked: boolean;
  public grabs: SSet<string>;
  public source: string;
  public compressed: SSet<string>;
  public creationAction: MutableGraphElementCreationAction;

  public constructor(
    data: {
      id: string;
      labels: SSet<string>;
      nativeLabels: SSet<string>;
      properties: MutablePropertyCollection;
      position: MutablePosition;
      namesInQuery: SSet<string>;
      locked: boolean;
      grabs: SSet<string>;
      source: string;
      compressed: SSet<string>;
      creationAction: MutableGraphElementCreationAction;
    },
    private readonly _logger: LoggerService,
  ) {
    this.id = data.id;
    this.labels = data.labels;
    this.nativeLabels = data.nativeLabels;
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

  public static fromPlain(
    data: z.infer<typeof this.schema>,
    logger: LoggerService,
  ): MutableNode {
    return new MutableNode(
      {
        id: data.id,
        labels: new SSet(data.labels),
        nativeLabels: new SSet(data.nativeLabels),
        properties: MutablePropertyCollection.fromPlain(data.properties),
        position: MutablePosition.fromPlain(data.position),
        namesInQuery: new SSet(data.namesInQuery),
        locked: data.locked,
        grabs: new SSet(),
        source: data.source,
        compressed: new SSet(data.compressed),
        creationAction: data.creationAction,
      },
      logger,
    );
  }

  public toPlain(): z.infer<typeof MutableNode.schema> {
    return {
      id: this.id,
      labels: this.labels.toArray(),
      nativeLabels: this.nativeLabels.toArray(),
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
  ): NodeDisplayConfigurationContext {
    return NodeDisplayConfigurationContext.create(this, graph, this._logger);
  }

  public customColor(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
    notes: GetNotesDBDTO,
  ): MutableGraphColor | null {
    // Try to get color config from first note
    const firstNote: GetNoteDBDTO | null = this._firstNote(notes);
    if (firstNote?.color != null) {
      return MutableGraphColorFactory.fromDB(firstNote.color);
    }

    // Try get from custom graph display config
    const customBg: string | null = this._customBackgroundColorFromConfig(
      graph,
      config,
    );
    const customTextColor: string | null = this._customTitleColorFromConfig(
      graph,
      config,
    );
    if (customBg != null || customTextColor != null) {
      return new MutableGraphColorCustom({
        backgroundColor: customBg ?? '#ffffff',
        textColor: customTextColor ?? '#000000',
      });
    }

    return null;
  }

  public title(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): string {
    return (
      this._customTitle(graph, config) ??
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
    degreeRange: Range | null,
  ): number {
    return (
      (this._customRadius(graph, config) ?? MutableNode.defaultRadius) *
      this._customRadiusFactor(graph, config, degreeRange)
    );
  }

  public copy(): MutableNode {
    return new MutableNode(
      {
        id: this.id,
        labels: this.labels.copy(),
        nativeLabels: this.nativeLabels.copy(),
        properties: this.properties.copy(),
        position: this.position.copy(),
        namesInQuery: this.namesInQuery.copy(),
        locked: this.locked,
        grabs: this.grabs.copy(),
        source: this.source,
        compressed: this.compressed.copy(),
        creationAction: this.creationAction,
      },
      this._logger,
    );
  }

  private _customTitle(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
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
      this._logger,
    ).applyToTemplate(nodeConfig.displayTextTemplate);
    if (newValue.trim().length === 0) {
      return null;
    }

    return newValue;
  }

  private _customRadius(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
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
      this._logger,
    ).applyToTemplate(nodeConfig.radiusTemplate);
    if (newValue.trim().length === 0) {
      return null;
    }

    const newRadius: number = parseFloat(newValue);
    if (isNaN(newRadius)) {
      this._logger.warn(
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
    degreeRange: Range | null,
  ): number {
    if (!config.growNodesBasedOnDegree) {
      return 1;
    }

    if (config.growNodesBasedOnDegreeFactor < 1) {
      return 1;
    }

    if (degreeRange == null) {
      return 1;
    }

    const toRange: Range = new Range({
      floor: 1,
      ceiling: config.growNodesBasedOnDegreeFactor,
    });

    return degreeRange.scaleValue(
      toRange,
      this.degree(graph),
      config.scaleType,
    );
  }

  private _customBackgroundColorFromConfig(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
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
    ).applyToTemplate(nodeConfig.backgroundColorTemplate);

    if (newValue.trim().length === 0) {
      return null;
    }
    return newValue;
  }

  private _customTitleColorFromConfig(
    graph: MutableGraph,
    config: FinalGraphDisplayConfiguration,
  ): string | null {
    const backgroundColor: string | null =
      this._customBackgroundColorFromConfig(graph, config);
    if (backgroundColor == null) {
      return null;
    }
    if (Color.isLightColor(backgroundColor)) {
      return '#000000';
    } else {
      return '#ffffff';
    }
  }

  private _firstNote(notes: GetNotesDBDTO): GetNoteDBDTO | null {
    const allNotes: GetNoteDBDTO[] = (
      notes.byNodeId.get(this.id) ?? new SSet<GetNoteDBDTO>()
    ).toArray();
    const firstNote: GetNoteDBDTO | null =
      allNotes.length > 0 ? allNotes[0] : null;
    return firstNote;
  }
}
