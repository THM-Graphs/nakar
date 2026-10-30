import { NotFoundError } from '../error/NotFoundError';
import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ExpandNodesAction } from './ExpandNodesAction';

import type { NodeData } from '../data/NodeData';

void describe('ExpandNodesAction', (): void => {
  void describe('actions', (): void => {
    void it('provides an ordered independent action for each node', async (): Promise<void> => {
      const action: ExpandNodesAction = new ExpandNodesAction(['a', 'b']);
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      assert.equal(action.actions.length, 2);
      await action.actions[1].apply(c.context);
      assert.equal(c.h.source.calls.length, 1);
      assert.deepEqual(
        c.h.source.calls[0].request.type === 'expand'
          ? c.h.source.calls[0].request.nativeIds
          : [],
        ['b'],
      );
    });
    void it('provides no operations for an empty selection', (): void => {
      assert.deepEqual(new ExpandNodesAction([]).actions, []);
    });
  });
  void describe('apply', (): void => {
    void it('positions new neighbors around the live origin after the source request completes', async (): Promise<void> => {
      const nodes: NodeData[] = [TestHarness.node('a')];
      const c: ReturnType<typeof TestHarness.context> =
        TestHarness.context(nodes);
      c.h.source.handler = (): Promise<
        ReturnType<typeof TestHarness.result>
      > => {
        nodes[0].position = { x: 100, y: 200 };
        return Promise.resolve(TestHarness.result([TestHarness.node('new')]));
      };
      await new ExpandNodesAction(['a']).apply(c.context);
      assert.deepEqual(c.context.graph.getNode('new').toData().position, {
        x: 100 + Math.cos(Math.PI / 4) * 10,
        y: 200 + Math.sin(Math.PI / 4) * 10,
      });
    });
    void it('expands an individual node with label and relationship limits', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = TestHarness.result(
        [TestHarness.node('d')],
        [TestHarness.edge('ad', 'a', 'd')],
        true,
      );
      await new ExpandNodesAction(['a'], {
        labels: ['Person'],
        relationships: ['KNOWS'],
      }).apply(c.context);
      assert.equal(c.context.data.graph.nodes.length, 4);
      assert.deepEqual(c.h.source.calls[0].request, {
        type: 'expand',
        nativeIds: ['a'],
        cluster: false,
        neighborIds: ['b'],
        limit: { labels: ['Person'], relationships: ['KNOWS'] },
      });
    });
    void it('replaces a cluster using native identities and preserves existing neighbor positions', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = TestHarness.result(
        [TestHarness.node('d')],
        [TestHarness.edge('ad', 'a', 'd')],
        true,
      );
      await new ExpandNodesAction(['a'], {
        labels: ['Person'],
        relationships: ['KNOWS'],
      }).apply(c.context);
      const cluster: NodeData = c.context.data.graph.nodes[0];
      cluster.compressed = ['native-1', 'native-2'];
      cluster.position = { x: 40, y: 50 };
      c.context.data.graph.nodes[1].compressed = ['neighbor-1', 'neighbor-2'];
      c.h.source.response = TestHarness.result([
        TestHarness.node('replacement'),
        TestHarness.node('b', { position: { x: 999, y: 999 } }),
      ]);
      await new ExpandNodesAction(['a']).apply(c.context);
      assert.equal(
        c.context.data.graph.nodes.some(
          (entry: NodeData): boolean => entry.id === 'a',
        ),
        false,
      );
      assert.deepEqual(
        c.context.graph.getNode('replacement').toData().position,
        {
          x: 40 + Math.cos(Math.PI / 4) * 10,
          y: 50 + Math.sin(Math.PI / 4) * 10,
        },
      );
      assert.deepEqual(c.context.graph.getNode('b').toData().position, {
        x: 0,
        y: 0,
      });
      assert.deepEqual(c.h.source.calls[1].request, {
        type: 'expand',
        nativeIds: ['native-1', 'native-2'],
        cluster: true,
        neighborIds: ['neighbor-1', 'neighbor-2', 'd'],
        limit: null,
      });
    });
    void it('rejects an unknown node before querying the source', async (): Promise<void> => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      await assert.rejects(
        new ExpandNodesAction(['absent']).apply(c.context),
        NotFoundError,
      );
      assert.equal(c.h.source.calls.length, 0);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.h.source.response = TestHarness.result(
        [TestHarness.node('d')],
        [TestHarness.edge('ad', 'a', 'd')],
        true,
      );
      const instance: ExpandNodesAction = new ExpandNodesAction(['a'], {
        labels: ['Person'],
        relationships: ['KNOWS'],
      });
      assert.ok(instance instanceof ExpandNodesAction);
    });
  });
});
