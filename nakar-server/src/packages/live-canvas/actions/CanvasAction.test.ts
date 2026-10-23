import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CanvasAction } from './CanvasAction';
import { CanvasActionContext } from './CanvasActionContext';
import { MockSourceAction } from '../testing/MockSourceAction.test';

void describe('CanvasAction', (): void => {
  void describe('apply', (): void => {
    void it('dispatches through the abstract action contract', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const context: CanvasActionContext = new CanvasActionContext(
        TestHarness.canvasData(),
        h.storage.room,
        h.delegates,
      );
      const action: CanvasAction = new MockSourceAction(
        TestHarness.result([TestHarness.node('extra')]),
      );
      await action.apply(context);
      assert.equal(context.graph.getNode('extra').id, 'extra');
      assert.equal(action.physics, 'short');
    });
  });
});
