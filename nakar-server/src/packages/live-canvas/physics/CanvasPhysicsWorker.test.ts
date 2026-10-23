import { TestHarness } from '../testing/TestHarness.test';
import type { WorkerCommand } from './WorkerCommand';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { CanvasError } from '../CanvasError';

void describe('CanvasPhysicsWorker', (): void => {
  void describe('start', (): void => {
    void it('waits for startup before terminating when destroyed concurrently', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      const start: Promise<void> = h.worker.start();
      assert.throws((): void => {
        h.worker.setGraph({ nodes: {}, edges: {} });
      }, CanvasError);
      const stop: Promise<void> = h.worker.destroy();
      await assert.rejects(start, CanvasError);
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
      await assert.rejects(h.worker.start(), CanvasError);
    });
    void it('rejects startup after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      await h.worker.destroy();
      await assert.rejects(h.worker.start(), CanvasError);
    });
    void it('cleans up after failed startup exactly once', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      h.delegate.startError = new Error('start failed');
      await assert.rejects(h.worker.start(), /start failed/);
      await h.worker.destroy();
      assert.equal(h.delegate.terminations, 1);
    });
  });
  void describe('setGraph', (): void => {
    void it('rejects an inactive worker', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.throws((): void => {
        h.worker.setGraph({ nodes: {}, edges: {} });
      }, CanvasError);
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
    void it('rejects an inactive worker', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.throws((): void => {
        h.worker.run('short');
      }, CanvasError);
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
  });
  void describe('constructor', (): void => {
    void it('retains its initial data and collaborators', (): void => {
      const h: ReturnType<typeof TestHarness.setup> = TestHarness.setup();
      assert.equal(h.delegate.starts, 0);
      assert.deepEqual(h.messages, []);
    });
  });
});
