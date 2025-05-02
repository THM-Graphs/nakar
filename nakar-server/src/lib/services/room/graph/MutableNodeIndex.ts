import { SMap } from '../../../tools/Map';
import { MutableNode } from './MutableNode';
import { SSet } from '../../../tools/Set';

export class MutableNodeIndex {
  private _nodesById: SMap<string, MutableNode>;

  public constructor(nodes: MutableNode[]) {
    this._nodesById = new SMap();

    for (const node of nodes) {
      this.add(node);
    }
  }

  public get nodes(): SSet<MutableNode> {
    return new SSet(this._nodesById.values());
  }

  public get size(): number {
    return this._nodesById.size;
  }

  public get keys(): SSet<string> {
    return new SSet<string>(this._nodesById.keys());
  }

  public add(node: MutableNode): void {
    this._nodesById.set(node.id, node);
  }

  public remove(node: MutableNode): void {
    this._nodesById.delete(node.id);
  }

  public hasById(id: string): boolean {
    return this._nodesById.has(id);
  }

  public has(node: MutableNode): boolean {
    return this._nodesById.has(node.id);
  }

  public get(id: string): MutableNode | null {
    return this._nodesById.get(id) ?? null;
  }
}
