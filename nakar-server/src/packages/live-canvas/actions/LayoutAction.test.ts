import { TestHarness } from '../testing/TestHarness.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LayoutAction } from './LayoutAction';
import { CircleLayoutAction } from './CircleLayoutAction';
import { CanvasActionContext } from './CanvasActionContext';

void describe('LayoutAction', (): void => {
  void describe('apply', (): void => {
    void it('dispatches a layout and requests long follow-up physics', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const context: CanvasActionContext = new CanvasActionContext(
        TestHarness.canvasData(),
        h.storage.room,
        h.delegates,
      );
      const action: LayoutAction = new CircleLayoutAction(['a', 'b'], 100);
      await action.apply(context);
      assert.equal(action.physics, 'long');
      assert.equal(context.graph.getNode('a').toData().locked, true);
    });
  });
});
