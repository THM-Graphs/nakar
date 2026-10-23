import type { Position } from '../data/Position';
import { threadId } from 'node:worker_threads';
import { NodeWorkerDelegate } from '../testing/NodeWorkerDelegate.test';
import { CanvasPhysicsEvent } from '../events/CanvasPhysicsEvent';
import type { CanvasEvent } from '../events/CanvasEvent';
import { LiveCanvas } from '../canvas/LiveCanvas';
import { InvalidStateError } from '../error/InvalidStateError';
import { TestHarness } from '../testing/TestHarness.test';
import type { WorkerCommand } from './WorkerCommand';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidDataError } from '../error/InvalidDataError';

void describe('CanvasPhysicsWorker', (): void => {
  void describe('start', (): void => {
    void it('waits for startup before terminating when destroyed concurrently', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      const start: Promise<void> = h.worker.start();
      assert.throws((): void => {
        h.worker.setGraph({ nodes: {}, edges: {} });
      }, InvalidStateError);
      const stop: Promise<void> = h.worker.destroy();
      await assert.rejects(start, InvalidStateError);
      await stop;
      assert.equal(h.delegate.terminations, 1);
    });
    void it('starts through the injected delegate', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      assert.equal(h.delegate.starts, 1);
    });
    void it('rejects duplicate startup', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      await assert.rejects(h.worker.start(), InvalidStateError);
    });
    void it('rejects startup after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.destroy();
      await assert.rejects(h.worker.start(), InvalidStateError);
    });
    void it('cleans up after failed startup exactly once', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      h.delegate.startError = new Error('start failed');
      await assert.rejects(h.worker.start(), /start failed/);
      await h.worker.destroy();
      assert.equal(h.delegate.terminations, 1);
    });

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
    void it('rejects commands before the worker has started', (): void => {
      assert.throws((): void => {
        new NodeWorkerDelegate().post({ type: 'stop' });
      }, /No worker/);
    });
  });
  void describe('setGraph', (): void => {
    void it('rejects an inactive worker', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.throws((): void => {
        h.worker.setGraph({ nodes: {}, edges: {} });
      }, InvalidStateError);
    });
    void it('advances revisions with each graph update', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.setGraph({ nodes: {}, edges: {} });
      h.worker.setGraph({ nodes: {}, edges: {} });
      assert.deepEqual(
        h.delegate.commands.map((command: WorkerCommand): number | undefined =>
          command.type === 'graph' ? command.revision : undefined,
        ),
        [1, 2],
      );
    });
  });
  void describe('run', (): void => {
    void it('sends a custom finite duration', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.run({ maxMs: 250 });
      assert.deepEqual(h.delegate.commands, [
        { type: 'run', revision: 0, milliseconds: 250 },
      ]);
    });
    void it('sends an unlimited duration', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.run({ maxMs: null });
      assert.deepEqual(h.delegate.commands, [
        { type: 'run', revision: 0, milliseconds: null },
      ]);
    });
    void it('rejects a custom duration of 0', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      assert.throws((): void => {
        h.worker.run({ maxMs: 0 });
      }, InvalidDataError);
      assert.deepEqual(h.delegate.commands, []);
    });
    void it('rejects a custom duration of -1', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      assert.throws((): void => {
        h.worker.run({ maxMs: -1 });
      }, InvalidDataError);
      assert.deepEqual(h.delegate.commands, []);
    });
    void it('rejects a custom duration of Infinity', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      assert.throws((): void => {
        h.worker.run({ maxMs: Infinity });
      }, InvalidDataError);
      assert.deepEqual(h.delegate.commands, []);
    });
    void it('rejects a custom duration of NaN', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      assert.throws((): void => {
        h.worker.run({ maxMs: NaN });
      }, InvalidDataError);
      assert.deepEqual(h.delegate.commands, []);
    });
    void it('rejects an inactive worker', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.throws((): void => {
        h.worker.run('short');
      }, InvalidStateError);
    });
    void it('sends a short run for the current revision', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.run('short');
      assert.deepEqual(h.delegate.commands, [
        { type: 'run', revision: 0, milliseconds: 1000 },
      ]);
    });
    void it('sends a long run for the current revision', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.run('long');
      assert.deepEqual(h.delegate.commands, [
        { type: 'run', revision: 0, milliseconds: 4000 },
      ]);
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
  void describe('stop', (): void => {
    void it('stops a run without terminating the worker', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.run({ maxMs: null });
      h.worker.stop();
      assert.deepEqual(h.delegate.commands.at(-1), { type: 'stop' });
      assert.equal(h.delegate.terminations, 0);
      h.worker.run('short');
      assert.equal(h.delegate.commands.at(-1)?.type, 'run');
    });
    void it('rejects a worker before startup', (): void => {
      assert.throws((): void => {
        TestHarness.setup().worker.stop();
      }, InvalidStateError);
    });
    void it('rejects a worker during startup', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      const starting: Promise<void> = h.worker.start();
      assert.throws((): void => {
        h.worker.stop();
      }, InvalidStateError);
      await starting;
    });
    void it('rejects a destroyed worker', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      await h.worker.destroy();
      assert.throws((): void => {
        h.worker.stop();
      }, InvalidStateError);
    });
  });
  void describe('onMessage', (): void => {
    void it('ignores a notification before startup', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      h.worker.onMessage({ type: 'stopped', revision: 0 });
      assert.deepEqual(h.messages, []);
    });
    void it('ignores a stale graph revision', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.setGraph({ nodes: {}, edges: {} });
      h.worker.onMessage({ type: 'stopped', revision: 0 });
      assert.deepEqual(h.messages, []);
    });
    void it('forwards the current graph revision', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.setGraph({ nodes: {}, edges: {} });
      h.worker.onMessage({ type: 'stopped', revision: 1 });
      assert.deepEqual(h.messages, [{ type: 'stopped', revision: 1 }]);
    });
    void it('forwards protocol errors', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.onMessage({ type: 'error', error: 'failed' });
      assert.deepEqual(h.messages, [{ type: 'error', error: 'failed' }]);
    });
    void it('ignores notifications after termination', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.setGraph({ nodes: {}, edges: {} });
      await h.worker.destroy();
      h.worker.onMessage({ type: 'stopped', revision: 1 });
      assert.deepEqual(h.messages, []);
    });
  });
  void describe('onError', (): void => {
    void it('ignores transport errors before startup', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      h.worker.onError('before');
      assert.deepEqual(h.errors, []);
    });
    void it('forwards transport errors while active', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.worker.onError('during');
      assert.deepEqual(h.errors, ['during']);
    });
    void it('ignores transport errors after termination', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      await h.worker.destroy();
      h.worker.onError('after');
      assert.deepEqual(h.errors, []);
    });
  });
  void describe('destroy', (): void => {
    void it('terminates only once even when termination fails', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.start();
      h.delegate.terminateError = new Error('termination failed');
      await assert.rejects(h.worker.destroy(), /termination failed/);
      await assert.rejects(h.worker.destroy(), /termination failed/);
      assert.equal(h.delegate.terminations, 1);
    });

    void it('allows repeated termination of an unused adapter', async (): Promise<void> => {
      const worker: NodeWorkerDelegate = new NodeWorkerDelegate();
      await worker.terminate();
      await worker.terminate();
      assert.equal(worker.threadId, 0);
    });
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.equal(h.delegate.starts, 0);
      assert.deepEqual(h.messages, []);
    });
  });
});
