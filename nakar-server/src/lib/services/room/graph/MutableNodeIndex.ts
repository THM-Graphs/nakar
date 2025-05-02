import { SMap } from '../../../tools/Map';
import { MutableNode } from './MutableNode';
import { SSet } from '../../../tools/Set';

export class MutableNodeIndex {
  private _byId: SMap<string, MutableNode>;

  public constructor(nodes: MutableNode[]) {
    this._byId = new SMap();

    for (const node of nodes) {
      this.add(node);
    }
  }

  public get nodes(): SSet<MutableNode> {
    return new SSet(this._byId.values());
  }

  public get size(): number {
    return this._byId.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._byId.keys());
  }

  public add(node: MutableNode): void {
    this._byId.set(node.id, node);
  }

  public remove(node: MutableNode): void {
    this._byId.delete(node.id);
  }

  public hasById(id: string): boolean {
    return this._byId.has(id);
  }

  public has(node: MutableNode): boolean {
    return this._byId.has(node.id);
  }

  public get(id: string): MutableNode | null {
    return this._byId.get(id) ?? null;
  }
}
