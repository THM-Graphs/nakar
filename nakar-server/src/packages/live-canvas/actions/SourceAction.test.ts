import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MockSourceAction } from '../testing/MockSourceAction.test';
import { CanvasActionContext } from './CanvasActionContext';
import type { EdgeData } from '../data/EdgeData';

void describe('SourceAction', (): void => {
  void describe('add', (): void => {
    void it('retains relationships whose endpoints occur in later results while removing genuinely dangling relationships', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.focusNodes([]);
      new MockSourceAction(
        TestHarness.result(
          [TestHarness.node('a')],
          [TestHarness.edge('ab'), TestHarness.edge('missing', 'a', 'missing')],
        ),
        TestHarness.result([TestHarness.node('b')]),
      ).apply(c.context);
      assert.deepEqual(
        c.context.data.graph.edges.map((edge: EdgeData): string => edge.id),
        ['ab'],
      );
    });
    void it('resolves a relationship endpoint to a node cluster in a later result', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      c.context.graph.focusNodes([]);
      new MockSourceAction(
        TestHarness.result(
          [TestHarness.node('a')],
          [TestHarness.edge('ab', 'a', 'b')],
        ),
        TestHarness.result([
          TestHarness.node('cluster', {
            compressed: ['b'],
            compressedIds: ['b'],
          }),
        ]),
      ).apply(c.context);
      assert.equal(c.context.graph.getEdge('ab').toData().endNodeId, 'cluster');
    });
    void it('counts nodes, relationships and table rows separately for every limited result', (): void => {
      const c: ReturnType<typeof TestHarness.context> = TestHarness.context();
      new MockSourceAction(
        {
          ...TestHarness.result(
            [TestHarness.node('a'), TestHarness.node('b')],
            [TestHarness.edge('ab')],
            true,
          ),
          table: [{ value: 1 }, { value: 2 }],
        },
        { ...TestHarness.result([], [], true), table: [{ value: 3 }] },
        TestHarness.result(),
      ).apply(c.context);
      assert.deepEqual(c.context.limits, [5, 1]);
    });
    void it('stamps the concrete action origin on inserted nodes and relationships', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const context: CanvasActionContext = new CanvasActionContext(
        TestHarness.canvasData([], []),
        h.storage.room,
        h.delegates,
      );
      new MockSourceAction(
        TestHarness.result(
          [TestHarness.node('a'), TestHarness.node('b')],
          [TestHarness.edge('ab')],
        ),
      ).apply(context);
      assert.equal(
        context.graph.getNode('a').toData().creationReason,
        'expand',
      );
      assert.equal(
        context.graph.getEdge('ab').toData().creationReason,
        'expand',
      );
      assert.deepEqual(context.limits, []);
    });
    void it('collects the returned element count when a limit was reached', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const context: CanvasActionContext = new CanvasActionContext(
        TestHarness.canvasData([], []),
        h.storage.room,
        h.delegates,
      );
      new MockSourceAction(
        TestHarness.result(
          [TestHarness.node('a'), TestHarness.node('b')],
          [TestHarness.edge('ab')],
          true,
        ),
      ).apply(context);
      assert.deepEqual(context.limits, [3]);
    });
  });
});
