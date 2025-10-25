import { SMap } from '../../tools/Map';
import { MutablePosition } from './MutablePosition';
import { MutableGraph } from './MutableGraph';

type Entry = { position: MutablePosition; locked: boolean };

export class PositionsCache {
  private constructor(public readonly nodes: SMap<string, Entry>) {}

  public static fromGraph(graph: MutableGraph): PositionsCache {
    const result: SMap<string, Entry> = new SMap();
    for (const node of graph.nodes.nodes) {
      result.set(node.id, {
        position: node.position.copy(),
        locked: node.locked,
      });
    }
    return new PositionsCache(result);
  }

  public applyToGraph(graph: MutableGraph): void {
    for (const node of graph.nodes.nodes) {
      const foundcache: Entry | null = this.nodes.get(node.id) ?? null;
      if (foundcache) {
        node.position = foundcache.position.copy();
        node.locked = foundcache.locked;
      }
    }
  }
}
