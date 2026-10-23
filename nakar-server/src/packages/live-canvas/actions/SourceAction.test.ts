import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MockSourceAction } from '../testing/MockSourceAction.test';
import { CanvasActionContext } from './CanvasActionContext';

void describe('SourceAction', (): void => {
  void describe('add', (): void => {
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
