import type { EdgeSettings } from '../data/EdgeSettings';
import type { EdgeData } from '../data/EdgeData';
import type { LabelSettings } from '../data/LabelSettings';
import type { NodeData } from '../data/NodeData';
import type { ViewSettingsData } from '../data/ViewSettingsData';
import { CanvasError } from '../CanvasError';
import { Range } from '../../range/Range';

/**
 * References visualization settings and resolves validated node titles, radii and relationship widths.
 */
export class CanvasViewSettings {
  /**
   * References supplied settings or creates the default visualization configuration.
   * @param _data - Data object or snapshot used to initialize the operation.
   */
  public constructor(
    private readonly _data: ViewSettingsData = {
      growNodesBasedOnDegree: false,
      growNodesBasedOnDegreeFactor: 2,
      compressRelationshipsWidthFactor: 10,
      scaleType: 'linear',
      labels: {},
      edges: {},
    },
  ) {}

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): ViewSettingsData {
    return structuredClone(this._data);
  }

  /**
   * Returns existing settings for a label or creates its defaults.
   * @param label - Node label to select or configure.
   * @returns The mutable configuration referenced by this label.
   */
  public label(label: string): LabelSettings {
    if (!Object.hasOwn(this._data.labels, label)) {
      Object.defineProperty(this._data.labels, label, {
        value: {
          radius: 40,
          customRadius: false,
          colorIndex: Object.keys(this._data.labels).length % 6,
          titleProperty: '',
          customTitleProperty: false,
        },
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return this._data.labels[label];
  }

  /**
   * Returns existing settings for a relationship type or creates its defaults.
   * @param type - Discriminator selecting the requested operation.
   * @returns The mutable configuration referenced by this relationship type.
   */
  public edge(type: string): EdgeSettings {
    if (!Object.hasOwn(this._data.edges, type)) {
      Object.defineProperty(this._data.edges, type, {
        value: {
          width: 2,
          customWidth: false,
          colorIndex: 0,
          customColor: false,
        },
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return this._data.edges[type];
  }

  /**
   * Validates and updates the selected node-growth or relationship-cluster factor.
   * @param type - Discriminator selecting the requested operation.
   * @param value - Value to validate or group.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public setFactor(type: 'grow' | 'relationships', value: number): void {
    if (!Number.isFinite(value)) {
      throw new CanvasError('invalid-data', 'Factor must be finite.');
    }
    const clamped: number = Math.max(1, Math.min(1000, value));
    if (type === 'grow') {
      this._data.growNodesBasedOnDegree = true;
      this._data.growNodesBasedOnDegreeFactor = clamped;
    } else {
      this._data.compressRelationshipsWidthFactor = clamped;
    }
  }

  /**
   * Resolves a node title using its label settings and fallback property values.
   * @param node - Physical node or graph node used by this operation.
   * @returns The resolved display string, or an empty string for an unusable explicit title property.
   */
  public title(node: NodeData): string {
    if (node.compressed.length > 0) {
      return `${node.labels.join(', ')} Cluster`;
    }
    for (const label of node.labels) {
      const settings: LabelSettings = this.label(label);
      if (settings.customTitleProperty) {
        const value: unknown = node.properties[settings.titleProperty];
        return typeof value === 'string' && value.trim().length > 0
          ? value
          : '';
      }
    }
    for (const key of [
      'label',
      'name',
      'title',
      'value',
      'type',
      'id',
      'slug',
      ...Object.keys(node.properties),
    ]) {
      const value: unknown = node.properties[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return node.labels.join(', ');
  }

  /**
   * Computes the rendered node radius using label overrides, cluster size and optional degree scaling.
   * @param node - Physical node or graph node used by this operation.
   * @param degree - Node degree or histogram buckets grouping incident relationship counts.
   * @param min - Minimum node degree present in the graph.
   * @param max - Maximum node degree present in the graph.
   * @returns The computed node radius in canvas units.
   */
  public radius(
    node: NodeData,
    degree: number,
    min: number,
    max: number,
  ): number {
    const custom: LabelSettings | undefined = node.labels
      .map((label: string): LabelSettings => this.label(label))
      .findLast((label: LabelSettings): boolean => label.customRadius);
    const base: number = custom?.radius ?? 40;
    if (!this._data.growNodesBasedOnDegree || max <= min) {
      return base;
    }
    return (
      base *
      new Range({ floor: min, ceiling: max }).scaleValue(
        new Range({
          floor: 1,
          ceiling: this._data.growNodesBasedOnDegreeFactor,
        }),
        degree,
        this._data.scaleType,
      )
    );
  }

  /**
   * Checks visualization factors, label radii, relationship widths and palette indices and throws on invalid values.
   * @throws {@link CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public validate(): void {
    const factors: number[] = [
      this._data.growNodesBasedOnDegreeFactor,
      this._data.compressRelationshipsWidthFactor,
    ];
    if (
      factors.some(
        (value: number): boolean =>
          !Number.isFinite(value) || value < 1 || value > 1000,
      )
    ) {
      throw new CanvasError('invalid-data', 'Invalid view setting factor.');
    }
    for (const value of Object.values(this._data.labels)) {
      if (
        !Number.isFinite(value.radius) ||
        value.radius <= 0 ||
        !Number.isInteger(value.colorIndex) ||
        value.colorIndex < 0 ||
        value.colorIndex > 5
      ) {
        throw new CanvasError('invalid-data', 'Invalid label settings.');
      }
    }
    for (const value of Object.values(this._data.edges)) {
      if (
        !Number.isFinite(value.width) ||
        value.width <= 0 ||
        !Number.isInteger(value.colorIndex) ||
        value.colorIndex < 0 ||
        value.colorIndex > 5
      ) {
        throw new CanvasError('invalid-data', 'Invalid edge settings.');
      }
    }
  }

  /**
   * Computes relationship width using type overrides and represented cluster size.
   * @param edge - Relationship used by this operation.
   * @param minimumRepresentations - Smallest represented relationship count in the graph.
   * @param maximumRepresentations - Largest represented relationship count in the graph.
   * @returns The computed relationship width in canvas units.
   */
  public edgeWidth(
    edge: EdgeData,
    minimumRepresentations: number,
    maximumRepresentations: number,
  ): number {
    const settings: EdgeSettings = this.edge(edge.type);
    const base: number = settings.customWidth ? settings.width : 2;
    return new Range({
      floor: minimumRepresentations,
      ceiling: maximumRepresentations,
    }).scaleValue(
      new Range({
        floor: base,
        ceiling: base * this._data.compressRelationshipsWidthFactor,
      }),
      edge.compressed.length || 1,
      this._data.scaleType,
    );
  }
}
