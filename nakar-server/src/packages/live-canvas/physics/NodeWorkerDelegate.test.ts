import { TestHarness } from '../testing/TestHarness.test';
import type { Position } from '../data/Position';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { threadId } from 'node:worker_threads';
import { NodeWorkerDelegate } from '../testing/NodeWorkerDelegate.test';
import { CanvasPhysicsEvent } from '../events/CanvasPhysicsEvent';
import type { CanvasEvent } from '../events/CanvasEvent';
import { LiveCanvas } from '../LiveCanvas';

void describe('NodeWorkerDelegate', (): void => {
  void describe('start', (): void => {
    void it('starts a real worker thread through LiveCanvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const worker: NodeWorkerDelegate = new NodeWorkerDelegate();
      h.delegates.worker = worker;
      const canvas: LiveCanvas = new LiveCanvas(
        { id: 'canvas', roomId: 'room', title: null },
        h.delegates,
      );
      try {
        await canvas.bootstrap();
        assert.ok(worker.threadId > 0);
        assert.notEqual(worker.threadId, threadId);
      } finally {
        await canvas.destroy(false);
      }
    });
  });
  void describe('post', (): void => {
    void it('rejects commands before the worker has started', (): void => {
      assert.throws((): void => {
        new NodeWorkerDelegate().post({ type: 'stop' });
      }, /No worker/);
    });
    void it(
      'executes physics in the real thread and delivers results through the event delegate',
      { timeout: 10000 },
      async (): Promise<void> => {
        const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
        const worker: NodeWorkerDelegate = new NodeWorkerDelegate();
        h.delegates.worker = worker;
        const canvas: LiveCanvas = new LiveCanvas(
          { id: 'canvas', roomId: 'room', title: null },
          h.delegates,
        );
        let complete: (() => void) | null = null;
        const update: Promise<void> = new Promise<void>(
          (resolve: () => void): void => {
            complete = resolve;
          },
        );
        h.delegates.events = {
          handleEvent: (event: CanvasEvent): void => {
            if (event instanceof CanvasPhysicsEvent) {
              assert.ok(
                Object.values(event.positions).some(
                  (position: Position): boolean =>
                    position.x !== 0 || position.y !== 0,
                ),
              );
              complete?.();
            }
          },
        };
        try {
          await canvas.bootstrap();
          await canvas.relayout(TestHarness.user());
          await update;
        } finally {
          await canvas.destroy(false);
        }
      },
    );
  });
  void describe('terminate', (): void => {
    void it('allows repeated termination of an unused adapter', async (): Promise<void> => {
      const worker: NodeWorkerDelegate = new NodeWorkerDelegate();
      await worker.terminate();
      await worker.terminate();
      assert.equal(worker.threadId, 0);
    });
  });
});
