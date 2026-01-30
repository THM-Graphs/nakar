import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';

export class LabelIndex {
  private readonly _labelHistogram: SMap<string, number>;
  private readonly _sources: SMap<string, SSet<string>>;

  public constructor() {
    this._labelHistogram = new SMap();
    this._sources = new SMap();
  }

  public get histogram(): SMap<string, number> {
    return this._labelHistogram;
  }

  public get labels(): string[] {
    return [...this._labelHistogram.keys()].toSorted(
      (a: string, b: string): number => a.localeCompare(b),
    );
  }

  public labelCount(label: string): number {
    return this._labelHistogram.get(label) ?? 0;
  }

  public sources(label: string): SSet<string> {
    return this._sources.get(label) ?? new SSet();
  }

  public add(label: string, source: string): void {
    this._labelHistogram.set(label, (this._labelHistogram.get(label) ?? 0) + 1);
    this._sources.set(
      label,
      (this._sources.get(label) ?? new SSet()).byAdding(source),
    );
    this._cleanup();
  }

  public remove(label: string): void {
    if (!this._labelHistogram.has(label)) {
      return;
    }
    this._labelHistogram.set(label, (this._labelHistogram.get(label) ?? 0) - 1);
    this._cleanup();
  }

  private _cleanup(): void {
    for (const label of this._labelHistogram.keys()) {
      if (this._labelHistogram.get(label) === 0) {
        this._labelHistogram.delete(label);
        this._sources.delete(label);
      }
    }
  }
}
