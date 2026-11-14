import { NotFoundError } from '../error/NotFoundError';
import { InvalidDataError } from '../error/InvalidDataError';
import { TestHarness } from '../testing/TestHarness.test';
import type { QueryResult } from '../data/QueryResult';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CanvasGraph } from './CanvasGraph';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';

import type { EdgeData } from '../data/EdgeData';
import type { GraphData } from '../data/GraphData';
import type { MergeData } from '../data/MergeData';
import type { NodeData } from '../data/NodeData';

void describe('CanvasGraph', (): void => {
  void describe('toData', (): void => {
    void it('returns a deep snapshot', (): void => {
      const data: GraphData = TestHarness.canvasData().graph;
      const model: CanvasGraph = new CanvasGraph(data);
      model.toData().nodes[0].position.x = 9;
      assert.equal(data.nodes[0].position.x, 0);
    });
  });
  void describe('getNode', (): void => {
    void it('returns a wrapper referencing the graph data', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.getNode('a').move({ x: 1, y: 2 });
      assert.equal(graph.toData().nodes[0].position.x, 1);
    });
    void it('rejects an unknown node', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      assert.throws((): void => {
        graph.getNode('missing');
      }, NotFoundError);
    });
  });
  void describe('getEdge', (): void => {
    void it('returns the matching relationship', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      assert.equal(graph.getEdge('ab').id, 'ab');
    });
    void it('rejects an unknown relationship', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      assert.throws((): void => {
        graph.getEdge('missing');
      }, NotFoundError);
    });
  });
  void describe('add', (): void => {
    void it('resolves cluster endpoints while distinguishing source-native identities by source', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('left', {
              compressed: ['native-a'],
              compressedIds: ['a'],
            }),
            TestHarness.node('right', {
              compressed: ['native-b'],
              compressedIds: ['b'],
            }),
          ],
          [
            TestHarness.edge('existing-cluster', 'left', 'right', {
              compressed: ['native-edge'],
              compressedIds: ['edge'],
            }),
          ],
        ).graph,
      );
      graph.add(
        TestHarness.result(
          [
            TestHarness.node('a', { nativeId: 'native-a' }),
            TestHarness.node('foreign', {
              nativeId: 'native-a',
              sourceId: 'other',
            }),
          ],
          [
            TestHarness.edge('represented', 'a', 'b', {
              nativeId: 'native-edge',
            }),
            TestHarness.edge('new', 'a', 'b', {
              startNativeNodeId: 'native-a',
              endNativeNodeId: 'native-b',
            }),
          ],
        ),
      );
      assert.equal(graph.toData().nodes.length, 3);
      assert.equal(graph.toData().edges.length, 2);
      assert.equal(graph.getEdge('new').toData().startNodeId, 'left');
      assert.equal(graph.getEdge('new').toData().endNodeId, 'right');
    });
    void it('detaches input data before inserting it', (): void => {
      const graph: CanvasGraph = new CanvasGraph();
      const input: QueryResult = TestHarness.result(
        [TestHarness.node('a'), TestHarness.node('b')],
        [TestHarness.edge('ab'), TestHarness.edge('missing', 'a', 'absent')],
      );
      graph.add(input);
      input.nodes[0].position.x = 999;
      assert.equal(graph.toData().nodes[0].position.x, 0);
    });
    void it('suppresses duplicate canonical identities', (): void => {
      const graph: CanvasGraph = new CanvasGraph();
      const input: QueryResult = TestHarness.result(
        [TestHarness.node('a'), TestHarness.node('b')],
        [TestHarness.edge('ab'), TestHarness.edge('missing', 'a', 'absent')],
      );
      graph.add(input);
      graph.add(
        TestHarness.result([TestHarness.node('a')], [TestHarness.edge('ab')]),
      );
      assert.equal(graph.toData().nodes.length, 2);
      assert.equal(graph.toData().edges.length, 1);
    });
    void it('drops relationships with missing endpoints', (): void => {
      const graph: CanvasGraph = new CanvasGraph();
      const input: QueryResult = TestHarness.result(
        [TestHarness.node('a'), TestHarness.node('b')],
        [TestHarness.edge('ab'), TestHarness.edge('missing', 'a', 'absent')],
      );
      graph.add(input);
      assert.equal(graph.toData().edges.length, 1);
    });
    void it('rejects non-finite node positions', (): void => {
      const graph: CanvasGraph = new CanvasGraph();
      assert.throws((): void => {
        graph.add(
          TestHarness.result([
            TestHarness.node('invalid', { position: { x: NaN, y: 0 } }),
          ]),
        );
      }, InvalidDataError);
    });
  });
  void describe('removeDanglingEdges', (): void => {
    void it('retains only edges with both endpoints', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a')],
          [TestHarness.edge('ab'), TestHarness.edge('aa', 'a', 'a')],
        ).graph,
      );
      graph.removeDanglingEdges();
      assert.deepEqual(
        graph.toData().edges.map((entry: EdgeData): string => entry.id),
        ['aa'],
      );
    });
  });
  void describe('neighbors', (): void => {
    void it('deduplicates outgoing neighbors and includes self-loops', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b'), TestHarness.node('c')],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('ba', 'b', 'a'),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.deepEqual(graph.neighbors('a'), ['a', 'b']);
    });
    void it('finds incoming neighbors', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b'), TestHarness.node('c')],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('ba', 'b', 'a'),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.deepEqual(graph.neighbors('b'), ['a']);
    });
    void it('returns no neighbors for an isolated node', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b'), TestHarness.node('c')],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('ba', 'b', 'a'),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.deepEqual(graph.neighbors('c'), []);
    });
  });
  void describe('degree', (): void => {
    void it('counts self-loops twice and weights clusters by representation count', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b')],
          [
            TestHarness.edge('ab', 'a', 'b', { compressed: ['one', 'two'] }),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.equal(graph.degree('a'), 4);
    });
    void it('counts incoming cluster representations', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b')],
          [
            TestHarness.edge('ab', 'a', 'b', { compressed: ['one', 'two'] }),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.equal(graph.degree('b'), 2);
    });
    void it('returns zero for a node without incident relationships', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b')],
          [
            TestHarness.edge('ab', 'a', 'b', { compressed: ['one', 'two'] }),
            TestHarness.edge('loop', 'a', 'a'),
          ],
        ).graph,
      );
      assert.equal(graph.degree('missing'), 0);
    });
  });
  void describe('deleteElements', (): void => {
    void it('deletes matching labels, relationship IDs and types and prunes incident relationships', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b', { labels: ['Other'] }),
            TestHarness.node('c'),
            TestHarness.node('d'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('cd', 'c', 'd'),
            TestHarness.edge('dc', 'd', 'c', { type: 'OTHER' }),
          ],
        ).graph,
      );
      graph.deleteElements(['missing'], ['Other'], ['cd'], ['OTHER']);
      assert.deepEqual(
        graph.toData().nodes.map((entry: NodeData): string => entry.id),
        ['a', 'c', 'd'],
      );
      assert.deepEqual(graph.toData().edges, []);
    });
    void it('deletes matching node IDs', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b', { labels: ['Other'] }),
            TestHarness.node('c'),
            TestHarness.node('d'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('cd', 'c', 'd'),
            TestHarness.edge('dc', 'd', 'c', { type: 'OTHER' }),
          ],
        ).graph,
      );
      graph.deleteElements(['a'], [], [], []);
      assert.deepEqual(
        graph.toData().nodes.map((item: NodeData): string => item.id),
        ['b', 'c', 'd'],
      );
      assert.equal(graph.toData().edges.length, 2);
    });
    void it('ignores unknown selections', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a'),
            TestHarness.node('b', { labels: ['Other'] }),
            TestHarness.node('c'),
            TestHarness.node('d'),
          ],
          [
            TestHarness.edge('ab'),
            TestHarness.edge('cd', 'c', 'd'),
            TestHarness.edge('dc', 'd', 'c', { type: 'OTHER' }),
          ],
        ).graph,
      );
      graph.deleteElements(['missing'], [], [], []);
      assert.equal(graph.toData().nodes.length, 4);
      assert.equal(graph.toData().edges.length, 3);
    });
  });
  void describe('focusNodes', (): void => {
    void it('keeps the selected induced subgraph', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusNodes(['a', 'b']);
      assert.equal(graph.toData().nodes.length, 2);
      assert.equal(graph.toData().edges.length, 1);
    });
    void it('clears the graph for an empty selection', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusNodes([]);
      assert.equal(graph.toData().edges.length, 0);
      assert.deepEqual(graph.toData().nodes, []);
    });
  });
  void describe('focusRelationships', (): void => {
    void it('keeps the selected relationships and endpoints', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusRelationships(['ab']);
      assert.equal(graph.toData().nodes.length, 2);
    });
    void it('clears the graph when no relationships match', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusRelationships(['absent']);
      assert.equal(graph.toData().nodes.length, 0);
    });
  });
  void describe('focusRelationshipTypes', (): void => {
    void it('keeps relationships of the selected types', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusRelationshipTypes(['KNOWS']);
      assert.equal(graph.toData().edges.length, 1);
    });
    void it('removes all relationships while preserving nodes for an empty selection', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.focusRelationshipTypes([]);
      assert.equal(graph.toData().nodes.length, 3);
      assert.equal(graph.toData().edges.length, 0);
    });
  });
  void describe('removeDanglingNodes', (): void => {
    void it('removes isolated nodes and retains connected nodes', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData().graph,
      );
      graph.removeDanglingNodes();
      assert.deepEqual(
        graph.toData().nodes.map((entry: NodeData): string => entry.id),
        ['a', 'b'],
      );
    });
  });
  void describe('compressRelationships', (): void => {
    void it('clusters matching directed relationships without combining other sources or types', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b')],
          [
            TestHarness.edge('1'),
            TestHarness.edge('2', 'a', 'b', { namesInQuery: ['r'] }),
            TestHarness.edge('reverse', 'b', 'a'),
            TestHarness.edge('other-source', 'a', 'b', { sourceId: 'other' }),
            TestHarness.edge('cluster', 'a', 'b', { compressed: ['x', 'y'] }),
            TestHarness.edge('other-type', 'a', 'b', { type: 'OTHER' }),
          ],
        ).graph,
      );
      graph.compressRelationships((): string => 'cluster-new');
      const compressed: EdgeData = graph.getEdge('cluster-new').toData();
      assert.deepEqual(compressed.compressed, ['1', '2']);
      assert.deepEqual(compressed.namesInQuery, ['r']);
      assert.equal(graph.toData().edges.length, 5);
    });
    void it('does not create nested clusters on a repeated call', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [TestHarness.node('a'), TestHarness.node('b')],
          [
            TestHarness.edge('1'),
            TestHarness.edge('2', 'a', 'b', { namesInQuery: ['r'] }),
            TestHarness.edge('reverse', 'b', 'a'),
            TestHarness.edge('other-source', 'a', 'b', { sourceId: 'other' }),
            TestHarness.edge('cluster', 'a', 'b', { compressed: ['x', 'y'] }),
            TestHarness.edge('other-type', 'a', 'b', { type: 'OTHER' }),
          ],
        ).graph,
      );
      graph.compressRelationships((): string => 'cluster-new');
      graph.compressRelationships((): string => 'unexpected');
      assert.equal(graph.toData().edges.length, 5);
    });
  });
  void describe('compressNodes', (): void => {
    void it('clusters matching siblings and redirects relationships to the cluster', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a', {
              position: { x: 2, y: 4 },
              noteIds: ['note'],
              namesInQuery: ['n'],
            }),
            TestHarness.node('b', { position: { x: 6, y: 8 } }),
            TestHarness.node('c', { labels: ['Center'] }),
            TestHarness.node('d', { sourceId: 'other' }),
            TestHarness.node('isolated'),
            TestHarness.node('cluster', { compressed: ['old'] }),
          ],
          [
            TestHarness.edge('ac', 'a', 'c'),
            TestHarness.edge('ca', 'c', 'a'),
            TestHarness.edge('bc', 'b', 'c'),
            TestHarness.edge('cb', 'c', 'b'),
            TestHarness.edge('dc', 'd', 'c'),
          ],
        ).graph,
      );
      graph.compressNodes('Person', (): string => 'siblings');
      const cluster: NodeData = graph.getNode('siblings').toData();
      assert.deepEqual(cluster.compressed, ['a', 'b']);
      assert.deepEqual(cluster.position, { x: 4, y: 6 });
      assert.deepEqual(cluster.noteIds, ['note']);
      assert.deepEqual(cluster.namesInQuery, ['n']);
      assert.equal(graph.toData().nodes.length, 5);
      assert.equal(
        graph
          .toData()
          .edges.filter(
            (entry: EdgeData): boolean =>
              entry.startNodeId === 'siblings' ||
              entry.endNodeId === 'siblings',
          ).length,
        4,
      );
    });
    void it('leaves the graph unchanged when no label matches', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a', {
              position: { x: 2, y: 4 },
              noteIds: ['note'],
              namesInQuery: ['n'],
            }),
            TestHarness.node('b', { position: { x: 6, y: 8 } }),
            TestHarness.node('c', { labels: ['Center'] }),
            TestHarness.node('d', { sourceId: 'other' }),
            TestHarness.node('isolated'),
            TestHarness.node('cluster', { compressed: ['old'] }),
          ],
          [
            TestHarness.edge('ac', 'a', 'c'),
            TestHarness.edge('ca', 'c', 'a'),
            TestHarness.edge('bc', 'b', 'c'),
            TestHarness.edge('cb', 'c', 'b'),
            TestHarness.edge('dc', 'd', 'c'),
          ],
        ).graph,
      );
      graph.compressNodes('Missing', (): string => 'unused');
      assert.equal(graph.toData().nodes.length, 6);
    });
  });
  void describe('merge', (): void => {
    void it('connects equal non-null properties across matching sources and labels', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a', { properties: { key: 0 } }),
            TestHarness.node('b', {
              sourceId: 'other',
              properties: { key: 0 },
            }),
            TestHarness.node('c', {
              sourceId: 'other',
              properties: { key: 1 },
            }),
            TestHarness.node('d', { properties: { key: null } }),
            TestHarness.node('e', { labels: ['No'] }),
          ],
          [],
        ).graph,
      );
      const rule: MergeData = {
        leftSourceId: 'source',
        rightSourceId: 'other',
        leftLabel: 'Person',
        rightLabel: 'Person',
        leftProperty: 'key',
        rightProperty: 'key',
      };
      graph.merge([rule], (): string => 'merge');
      assert.deepEqual(graph.toData().edges[0].properties['merge'], rule);
      assert.deepEqual(
        graph
          .toData()
          .edges.map((entry: EdgeData): [string, string, string] => [
            entry.startNodeId,
            entry.endNodeId,
            entry.type,
          ]),
        [['a', 'b', 'CONNECTED_TO']],
      );
    });
    void it('does not add a second relationship for the same merge', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('a', { properties: { key: 0 } }),
            TestHarness.node('b', {
              sourceId: 'other',
              properties: { key: 0 },
            }),
            TestHarness.node('c', {
              sourceId: 'other',
              properties: { key: 1 },
            }),
            TestHarness.node('d', { properties: { key: null } }),
            TestHarness.node('e', { labels: ['No'] }),
          ],
          [],
        ).graph,
      );
      const rule: MergeData = {
        leftSourceId: 'source',
        rightSourceId: 'other',
        leftLabel: 'Person',
        rightLabel: 'Person',
        leftProperty: 'key',
        rightProperty: 'key',
      };
      graph.merge([rule], (): string => 'merge');
      graph.merge([rule], (): string => 'duplicate');
      assert.deepEqual(
        graph
          .toData()
          .edges.map((entry: EdgeData): [string, string, string] => [
            entry.startNodeId,
            entry.endNodeId,
            entry.type,
          ]),
        [['a', 'b', 'CONNECTED_TO']],
      );
    });
  });
  void describe('toPhysicalGraph', (): void => {
    void it('preserves locks and arbitrary IDs in detached physics data', (): void => {
      const graph: CanvasGraph = new CanvasGraph(
        TestHarness.canvasData(
          [
            TestHarness.node('__proto__'),
            TestHarness.node('b', { locked: true }),
          ],
          [TestHarness.edge('__proto__', '__proto__', 'b')],
        ).graph,
      );
      const physical: PhysicalGraph = graph.toPhysicalGraph(
        new CanvasViewSettings(),
        ['__proto__'],
      );
      assert.equal(physical.nodes['__proto__']?.locked, true);
      assert.equal(physical.nodes['b']?.locked, true);
      assert.ok(physical.edges['__proto__']);
      assert.equal(physical.edges['__proto__'].edgeType, 'KNOWS');
      assert.equal(physical.nodes['b'].radius, 40);
      physical.nodes['b'].positionX = 99;
      assert.equal(graph.getNode('b').toData().position.x, 0);
    });
    void it('returns empty dictionaries without prototypes for an empty graph', (): void => {
      const empty: PhysicalGraph = new CanvasGraph().toPhysicalGraph(
        new CanvasViewSettings(),
      );
      assert.deepEqual(Object.keys(empty.nodes), []);
      assert.deepEqual(Object.keys(empty.edges), []);
      assert.equal(Object.getPrototypeOf(empty.nodes), null);
    });
  });
  void describe('constructor', (): void => {
    void it('creates an independent empty graph by default', (): void => {
      const first: CanvasGraph = new CanvasGraph();
      const second: CanvasGraph = new CanvasGraph();
      first.add(TestHarness.result([TestHarness.node('a')]));
      assert.deepEqual(second.toData().nodes, []);
    });
    void it('references the supplied graph data', (): void => {
      const data: GraphData = TestHarness.canvasData().graph;
      new CanvasGraph(data).getNode('a').move({ x: 4, y: 5 });
      assert.deepEqual(data.nodes[0].position, { x: 4, y: 5 });
    });
  });
});
