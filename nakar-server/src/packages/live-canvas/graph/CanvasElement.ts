import type { ElementData } from '../data/ElementData';

/**
 * References a node or relationship data object and exposes shared identity, cluster and snapshot behavior.
 * @typeParam T - Node or relationship data referenced by the concrete element.
 */
export abstract class CanvasElement<T extends ElementData = ElementData> {
  /**
   * References the supplied element data; mutations through subclasses update that same object.
   * @param _data - Data object or snapshot used to initialize the operation.
   */
  public constructor(protected readonly _data: T) {}

  /**
   * Returns the canonical canvas identity of the referenced element.
   * @returns The canonical canvas identity of the referenced element.
   */
  public get id(): string {
    return this._data.id;
  }

  /**
   * Reports whether the element represents multiple source elements.
   * @returns True when source-native cluster membership is non-empty.
   */
  public get isCluster(): boolean {
    return this._data.compressed.length > 0;
  }

  /**
   * Returns the discriminator of this concrete element kind.
   * @returns The discriminator of this concrete element kind.
   */
  public abstract get kind(): 'node' | 'edge';

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): T {
    return structuredClone(this._data);
  }

  /**
   * Returns the represented element count, treating an uncompressed element as one.
   * @returns The represented element count, treating an uncompressed element as one.
   */
  public representationCount(): number {
    return this._data.compressed.length || 1;
  }
}
