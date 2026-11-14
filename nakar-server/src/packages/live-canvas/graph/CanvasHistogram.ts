import type { EdgeData } from '../data/EdgeData';
import type { ElementData } from '../data/ElementData';
import type { GraphData } from '../data/GraphData';
import type { NodeData } from '../data/NodeData';
import type { PropertyValue } from '../data/PropertyValue';
import type { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';
import type { HistogramEntry } from './HistogramEntry';
import type { HistogramData } from './HistogramData';

/**
 * Builds detached label, relationship, property and degree histograms including the represented element IDs.
 */
export class CanvasHistogram {
  /**
   * References graph data and visualization settings used to compute histogram snapshots.
   * @param _data - Data object or snapshot used to initialize the operation.
   * @param _settings - Visualization configuration to reference.
   */
  public constructor(
    private readonly _data: GraphData,
    private readonly _settings: CanvasViewSettings,
  ) {}

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): HistogramData {
    const nodes: HistogramData['nodes'] = this._data.nodes.map(
      (node: NodeData): HistogramData['nodes'][number] => {
        const degree: number = this._data.edges.reduce(
          (sum: number, edge: EdgeData): number =>
            sum +
            (Number(edge.startNodeId === node.id) +
              Number(edge.endNodeId === node.id)) *
              (edge.compressed.length || 1),
          0,
        );
        return {
          id: node.id,
          title: this._settings.title(node),
          labels: [...node.labels],
          degree,
          percentage: 0,
        };
      },
    );
    const total: number = nodes.reduce(
      (sum: number, node: HistogramData['nodes'][number]): number =>
        sum + node.degree,
      0,
    );
    for (const node of nodes) {
      node.percentage = total > 0 ? node.degree / total : 0;
    }
    return {
      nodeLabels: this._entries(
        this._data.nodes.flatMap((node: NodeData): [string, string][] =>
          new SSet(node.labels)
            .toArray()
            .map((label: string): [string, string] => [label, node.id]),
        ),
      ),
      edgeTypes: this._entries(
        this._data.edges.map((edge: EdgeData): [string, string, number] => [
          edge.type,
          edge.id,
          edge.compressed.length || 1,
        ]),
      ),
      nodeProperties: this._properties(this._data.nodes),
      edgeProperties: this._properties(this._data.edges),
      nodes: nodes.sort(
        (
          left: HistogramData['nodes'][number],
          right: HistogramData['nodes'][number],
        ): number =>
          right.degree - left.degree || left.title.localeCompare(right.title),
      ),
    };
  }

  /**
   * Groups equal histogram values and collects their matching element IDs.
   * @param values - Histogram values with the canonical IDs that produced them.
   * @returns Histogram buckets ordered by descending count, then by value.
   */
  private _entries(values: [string, string, number?][]): HistogramEntry[] {
    const buckets: SMap<string, SSet<string>> = new SMap<
      string,
      SSet<string>
    >();
    const counts: SMap<string, number> = new SMap<string, number>();
    for (const [value, id, weight] of values) {
      if (!(buckets.get(value)?.has(id) ?? false)) {
        counts.set(value, (counts.get(value) ?? 0) + (weight ?? 1));
      }
      buckets.set(value, (buckets.get(value) ?? new SSet()).byAdding(id));
    }
    const total: number = counts
      .toValueArray()
      .reduce((sum: number, count: number): number => sum + count, 0);
    return buckets
      .toArray()
      .map(([value, ids]: [string, SSet<string>]): HistogramEntry => ({
        value,
        count: counts.get(value) ?? 0,
        percentage: (counts.get(value) ?? 0) / total,
        elementIds: ids.toArray(),
      }))
      .sort(
        (left: HistogramEntry, right: HistogramEntry): number =>
          right.count - left.count || left.value.localeCompare(right.value),
      );
  }

  /**
   * Builds property-value histograms for the supplied elements.
   * @param elements - Elements whose properties are grouped.
   * @returns Alphabetically ordered property names with their value buckets.
   */
  private _properties(
    elements: ElementData[],
  ): HistogramData['nodeProperties'] {
    const keys: string[] = new SSet(
      elements.flatMap((element: ElementData): string[] =>
        Object.keys(element.properties),
      ),
    )
      .toArray()
      .sort();
    return keys.map((key: string): HistogramData['nodeProperties'][number] => ({
      key,
      values: this._entries(
        elements
          .filter((element: ElementData): boolean =>
            Object.hasOwn(element.properties, key),
          )
          .map((element: ElementData): [string, string] => {
            const value: PropertyValue = element.properties[key];
            return [JSON.stringify(value), element.id];
          }),
      ),
    }));
  }
}
