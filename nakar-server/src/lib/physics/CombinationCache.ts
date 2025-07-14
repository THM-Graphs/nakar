import { SMap } from '../tools/Map';
import { SSet } from '../tools/Set';

export class CombinationCache {
  private _combinations: SMap<string, SSet<string>>;

  public constructor() {
    this._combinations = new SMap();
  }

  public addCombination(str1: string, str2: string): void {
    let set1: SSet<string> | undefined = this._combinations.get(str1);
    if (!set1) {
      set1 = new SSet();
      this._combinations.set(str1, set1);
    }
    set1.add(str2);

    let set2: SSet<string> | undefined = this._combinations.get(str2);
    if (!set2) {
      set2 = new SSet();
      this._combinations.set(str2, set2);
    }
    set2.add(str1);
  }

  public hasCombination(str1: string, str2: string): boolean {
    return (
      this._combinations.get(str1)?.has(str2) ??
      this._combinations.get(str2)?.has(str1) ??
      false
    );
  }
}
