import { ElementPosition } from './ElementPosition';
import { PropertyCollection } from './PropertyCollection';
import { z } from 'zod';
import { SSet } from '../../../packages/set/Set';
import type { GraphEdge } from './GraphEdge';
import type { LiveCanvasUndoableData } from '../data/LiveCanvasUndoableData';
import { ElementCreationReason } from './ElementCreationReason';
import { Range } from '../../../packages/range/Range';
import type { LiveCanvasViewSettings } from '../view-settings/LiveCanvasViewSettings';
import type { LiveCanvasLabelViewSettingsState } from '../view-settings/LiveCanvasLabelViewSettingsState';
import type { ElementColor } from './color/ElementColor';
import type { LiveCanvasNote } from '../data/LiveCanvasNote';
import { LiveCanvasScenarioGroup } from '../data/LiveCanvasScenarioGroup';

export class GraphNode {
  public static readonly defaultRadius: number = 40;

  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    nativeId: z.string(),
    labels: z.array(z.string()),
    properties: PropertyCollection.schema,
    position: ElementPosition.schema,
    namesInQuery: z.array(z.string()),
    locked: z.boolean(),
    sourceId: z.string(),
    sourceTitle: z.string().nullable(),
    compressed: z.array(z.string()),
    creationAction: z.enum(ElementCreationReason),
    url: z.string().nullable(),
    coverImageUrl: z.string().nullable(),
    noteReferences: z.array(z.string()),
    scenarioGroups: z.array(LiveCanvasScenarioGroup.schema),
  });

  /** Internal application id */
  public readonly id: string;

  /** External id of source database */
  public readonly nativeId: string;

  public readonly properties: PropertyCollection;
  public readonly namesInQuery: SSet<string>;
  public readonly grabs: SSet<string>;

  /** ID of the source database */
  public readonly sourceId: string;

  public readonly sourceTitle: string | null;
  public readonly compressed: SSet<string>;
  public readonly creationAction: ElementCreationReason;
  public readonly url: URL | null;
  public readonly coverImageUrl: URL | null;
  public scenarioGroups: LiveCanvasScenarioGroup[];

  private _locked: boolean;
  private _position: ElementPosition;
  private readonly _labels: SSet<string>;
  private readonly _noteReferences: SSet<string>;

  public constructor(data: {
    id: string;
    nativeId: string;
    labels: SSet<string>;
    properties: PropertyCollection;
    position: ElementPosition;
    namesInQuery: SSet<string>;
    locked: boolean;
    grabs: SSet<string>;
    sourceId: string;
    sourceTitle: string | null;
    compressed: SSet<string>;
    creationAction: ElementCreationReason;
    url: URL | null;
    coverImageUrl: URL | null;
    noteReferences: SSet<string>;
    scenarioGroups: LiveCanvasScenarioGroup[];
  }) {
    this.id = data.id;
    this.nativeId = data.nativeId;
    this._labels = data.labels;
    this.properties = data.properties;
    this._position = data.position;
    this.namesInQuery = data.namesInQuery;
    this._locked = data.locked;
    this.grabs = data.grabs;
    this.sourceId = data.sourceId;
    this.sourceTitle = data.sourceTitle;
    this.compressed = data.compressed;
    this.creationAction = data.creationAction;
    this.url = data.url;
    this.coverImageUrl = data.coverImageUrl;
    this._noteReferences = data.noteReferences;
    this.scenarioGroups = data.scenarioGroups;
  }

  public get noteIds(): string[] {
    return this._noteReferences.toArray();
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
      nativeId: data.nativeId,
      labels: new SSet(data.labels),
      properties: PropertyCollection.fromPlain(data.properties),
      position: ElementPosition.fromPlain(data.position),
      namesInQuery: new SSet(data.namesInQuery),
      locked: data.locked,
      grabs: new SSet(),
      sourceId: data.sourceId,
      sourceTitle: data.sourceTitle,
      compressed: new SSet(data.compressed),
      creationAction: data.creationAction,
      url: data.url != null ? URL.parse(data.url) : null,
      coverImageUrl:
        data.coverImageUrl != null ? URL.parse(data.coverImageUrl) : null,
      noteReferences: new SSet(data.noteReferences),
      scenarioGroups: data.scenarioGroups.map(
        (
          sg: z.infer<typeof LiveCanvasScenarioGroup.schema>,
        ): LiveCanvasScenarioGroup => LiveCanvasScenarioGroup.fromPlain(sg),
      ),
    });
  }

  public getTitle(viewSettings: LiveCanvasViewSettings): string {
    if (this.isCluster) {
      return `${this.labels.join(', ')} Cluster`;
    }

    for (const label of this.labels) {
      const labelViewSettings: LiveCanvasLabelViewSettingsState =
        viewSettings.getLabelSettings(label);
      if (labelViewSettings.customTitleProperty) {
        const propertyValue: string | null =
          this.properties.getStringValueOfProperty(
            labelViewSettings.titleProperty,
          );
        return propertyValue ?? '';
      }
    }

    return (
      this.properties.getStringValueOfProperty('label') ??
      this.properties.getStringValueOfProperty('name') ??
      this.properties.getStringValueOfProperty('title') ??
      this.properties.getStringValueOfProperty('value') ??
      this.properties.getStringValueOfProperty('type') ??
      this.properties.getStringValueOfProperty('id') ??
      this.properties.getStringValueOfProperty('slug') ??
      this.properties.firstStringValue() ??
      this.labels.join(', ')
    );
  }

  public getRadius(
    viewSettings: LiveCanvasViewSettings,
    degreeRange: Range,
    graph: LiveCanvasUndoableData,
  ): number {
    let radius: number = GraphNode.defaultRadius;
    for (const label of this.labels) {
      const labelViewSettings: LiveCanvasLabelViewSettingsState =
        viewSettings.getLabelSettings(label);
      if (labelViewSettings.customRadius) {
        radius = labelViewSettings.radius;
      }
    }

    if (viewSettings.growNodesBasedOnDegree) {
      const toRange: Range = new Range({
        floor: 1,
        ceiling: viewSettings.growNodesBasedOnDegreeFactor,
      });

      return (
        degreeRange.scaleValue(
          toRange,
          this.degree(graph),
          viewSettings.scaleType,
        ) * radius
      );
    } else {
      return radius;
    }
  }

  public getCustomColor(): ElementColor | null {
    // Will implement for single node color
    return null;
  }

  public toPlain(): z.infer<typeof GraphNode.schema> {
    return {
      id: this.id,
      nativeId: this.nativeId,
      labels: this.labels,
      properties: this.properties.toPlain(),
      position: this._position,
      namesInQuery: this.namesInQuery.toArray(),
      locked: this._locked,
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      compressed: this.compressed.toArray(),
      creationAction: this.creationAction,
      url: this.url?.href ?? null,
      coverImageUrl: this.coverImageUrl?.href ?? null,
      scenarioGroups: this.scenarioGroups.map(
        (
          sg: LiveCanvasScenarioGroup,
        ): z.infer<typeof LiveCanvasScenarioGroup.schema> => sg.toPlain(),
      ),
      noteReferences: this._noteReferences.toArray(),
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
      nativeId: this.nativeId,
      labels: new SSet(this.labels),
      properties: this.properties.copy(),
      position: this._position.copy(),
      namesInQuery: this.namesInQuery.copy(),
      locked: this._locked,
      grabs: this.grabs.copy(),
      sourceId: this.sourceId,
      sourceTitle: this.sourceTitle,
      compressed: this.compressed.copy(),
      creationAction: this.creationAction,
      url: this.url,
      coverImageUrl: this.coverImageUrl,
      scenarioGroups: this.scenarioGroups.map(
        (sg: LiveCanvasScenarioGroup): LiveCanvasScenarioGroup => sg.copy(),
      ),
      noteReferences: this._noteReferences.copy(),
    });
  }

  public addNoteReference(note: LiveCanvasNote): void {
    this._noteReferences.add(note.id);
  }
}
