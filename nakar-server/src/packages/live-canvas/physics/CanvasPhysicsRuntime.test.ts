import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InvalidDataError } from '../error/InvalidDataError';
import { InvalidStateError } from '../error/InvalidStateError';
import { TestHarness } from '../testing/TestHarness.test';
import type { MockTimer } from '../testing/MockTimer.test';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { CanvasPhysicsRuntime } from './CanvasPhysicsRuntime';
import { MockRuntimeDelegate } from '../testing/MockRuntimeDelegate.test';
import type { WorkerEvent } from './WorkerEvent';

void describe('CanvasPhysicsRuntime', (): void => {
  void describe('handle', (): void => {
    void it('applies position and lock deltas without resetting velocity or the active deadline', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(1, {
          FPS: 1000,
          cooldownTime: 1,
          frictionFactor: 0,
        });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 10 });
      TestHarness.runPhysicsBatch(h.delegate);
      h.runtime.handle({
        type: 'update',
        revision: 2,
        positions: { a: { x: 50, y: 0 }, missing: { x: 9, y: 9 } },
        locks: { a: false, missing: true },
      });
      h.runtime.handle({
        type: 'update',
        revision: 1,
        positions: { a: { x: 999, y: 0 } },
        locks: {},
      });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent | undefined = h.delegate.events.at(-1);
      assert.ok(event?.type === 'positions');
      assert.equal(event.revision, 2);
      assert.equal(event.positions['a'].x, 60);
      assert.equal(Object.hasOwn(event.positions, 'missing'), false);
      while (h.delegate.events.at(-1)?.type !== 'stopped') {
        TestHarness.runPhysicsBatch(h.delegate);
      }
      assert.ok(h.delegate.time < 15);
    });
    void it('applies temporary locks without restarting or replacing the graph', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(1, { FPS: 1000 });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 100 });
      h.runtime.handle({
        type: 'update',
        revision: 2,
        positions: {},
        locks: { a: true },
      });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.positions['a'].x, 0);
      h.runtime.destroy();
    });
    void it('runs fast ticks and emits a single snapshot per default output interval', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(0.5);
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.physical(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 2000 });
      assert.equal(h.delegate.events.length, 0);
      assert.equal(h.delegate.timers[0].at, h.delegate.time);
      for (let i: number = 0; i < 16; i++) {
        const start: number = h.delegate.time;
        TestHarness.runPhysicsBatch(h.delegate);
        const event: WorkerEvent | undefined = h.delegate.events.at(-1);
        assert.ok(event?.type === 'positions');
        assert.equal(event.performance.tickCount, 125);
        assert.equal(event.performance.tickDuration, 0.5);
        assert.equal(event.performance.loadPercent, 0.5 / 15);
        assert.equal(event.performance.performance, 'good');
        assert.equal(event.revision, 1);
        assert.equal(h.delegate.time - start - 0.5, 1000 / 16);
        assert.equal(h.delegate.events.length, i + 1);
        assert.equal(
          h.delegate.timers.filter(
            (timer: MockTimer): boolean => !timer.cancelled,
          ).length,
          1,
        );
      }
      h.runtime.destroy();
    });
    void it('uses configured output frequency and performance reference', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(2, {
          FPS: 50,
          targetPhysicsTickDuration: 1,
        });
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 100 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.performance.tickCount, 10);
      assert.equal(event.performance.tickDuration, 2);
      assert.equal(event.performance.loadPercent, 2);
      assert.equal(event.performance.performance, 'bad');
      h.runtime.destroy();
    });
    void it('yields after a slow tick without attempting catch-up messages', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(80);
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 1000 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.performance.tickCount, 1);
      assert.equal(event.performance.performance, 'bad');
      assert.equal(h.delegate.events.length, 1);
      h.runtime.destroy();
    });
    void it('publishes a final partial batch before stopping at the deadline', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 10 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.performance.tickCount, 9);
      assert.deepEqual(h.delegate.events[1], { type: 'stopped', revision: 0 });
      assert.equal(
        h.delegate.timers.filter(
          (timer: MockTimer): boolean => !timer.cancelled,
        ).length,
        0,
      );
    });
    void it('applies the configured cooling duration to the remaining run time', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(10, {
          FPS: 50,
          cooldownTime: 100,
          frictionFactor: 0,
        });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 100 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.positions['a'].x, 17);
      h.runtime.destroy();
    });
    void it('keeps full heat before the cooling phase', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(10, {
          FPS: 50,
          cooldownTime: 50,
          frictionFactor: 0,
        });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 100 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.positions['a'].x, 20);
      h.runtime.destroy();
    });
    void it('clamps heat to zero when the scheduler resumes after the deadline', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(1, { frictionFactor: 0 });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 10 });
      h.delegate.time = 100;
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.positions['a'].x, 0);
      assert.equal(event.performance.tickCount, 1);
      assert.equal(h.delegate.events.at(-1)?.type, 'stopped');
    });
    void it('runs indefinitely at full heat until explicitly stopped', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(10, { FPS: 50, frictionFactor: 0 });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.driftingPhysicalGraph(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: null });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.positions['a'].x, 20);
      h.delegate.time = 1_000_000;
      TestHarness.runPhysicsBatch(h.delegate);
      assert.equal(h.delegate.events.length, 2);
      const pending: MockTimer = h.delegate.timers[2];
      h.runtime.handle({ type: 'stop' });
      assert.equal(pending.cancelled, true);
      pending.callback();
      assert.deepEqual(h.delegate.events.at(-1), {
        type: 'stopped',
        revision: 1,
      });
      assert.equal(h.delegate.events.length, 3);
    });
    void it('can replace an unlimited run with a finite deadline', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: null });
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 10 });
      TestHarness.runPhysicsBatch(h.delegate);
      assert.equal(h.delegate.events.at(-1)?.type, 'stopped');
    });
    void it('ignores stale graph and run revisions', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({
        type: 'graph',
        revision: 2,
        graph: TestHarness.physical(),
      });
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.physical(),
      });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 60 });
      assert.equal(h.delegate.timers.length, 0);
    });
    void it('extends an active run without scheduling duplicate loops', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 10 });
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 200 });
      assert.equal(h.delegate.timers.length, 1);
      TestHarness.runPhysicsBatch(h.delegate);
      assert.equal(h.delegate.events.at(-1)?.type, 'positions');
      h.runtime.destroy();
    });
    void it('starts another run after the previous deadline', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 10 });
      TestHarness.runPhysicsBatch(h.delegate);
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 10 });
      TestHarness.runPhysicsBatch(h.delegate);
      assert.equal(
        h.delegate.events.filter(
          (event: WorkerEvent): boolean => event.type === 'stopped',
        ).length,
        2,
      );
    });
    void it('continues the active deadline after replacing the graph and preserves configuration', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime(1, { FPS: 100 });
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 100 });
      const old: MockTimer = h.delegate.timers[0];
      h.runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.physical(),
      });
      assert.equal(h.delegate.events.length, 0);
      assert.equal(old.cancelled, false);
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.revision, 1);
      assert.equal(event.performance.tickCount, 10);
      h.runtime.destroy();
    });
    void it('reports an explicit stop for the current revision', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({
        type: 'graph',
        revision: 3,
        graph: TestHarness.physical(),
      });
      h.runtime.handle({ type: 'stop' });
      assert.deepEqual(h.delegate.events, [{ type: 'stopped', revision: 3 }]);
    });
    void it('rejects a duration of 0', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      assert.throws((): void => {
        h.runtime.handle({ type: 'run', revision: 0, milliseconds: 0 });
      }, InvalidDataError);
      assert.equal(h.delegate.timers.length, 0);
    });
    void it('rejects a duration of -1', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      assert.throws((): void => {
        h.runtime.handle({ type: 'run', revision: 0, milliseconds: -1 });
      }, InvalidDataError);
      assert.equal(h.delegate.timers.length, 0);
    });
    void it('rejects a duration of Infinity', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      assert.throws((): void => {
        h.runtime.handle({ type: 'run', revision: 0, milliseconds: Infinity });
      }, InvalidDataError);
      assert.equal(h.delegate.timers.length, 0);
    });
    void it('rejects a duration of NaN', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      assert.throws((): void => {
        h.runtime.handle({ type: 'run', revision: 0, milliseconds: NaN });
      }, InvalidDataError);
      assert.equal(h.delegate.timers.length, 0);
    });
    void it('rejects commands after destruction', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.destroy();
      assert.throws((): void => {
        h.runtime.handle({ type: 'stop' });
      }, InvalidStateError);
    });
    void it('ignores null nodes in position snapshots', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      const graph: PhysicalGraph = TestHarness.physical();
      graph.nodes['null'] = null;
      h.runtime.handle({ type: 'graph', revision: 1, graph });
      h.runtime.handle({ type: 'run', revision: 1, milliseconds: 100 });
      TestHarness.runPhysicsBatch(h.delegate);
      const event: WorkerEvent = h.delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(Object.hasOwn(event.positions, 'null'), false);
      h.runtime.destroy();
    });
    void it('reports runtime failures and stops scheduling', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: 100 });
      h.delegate.now = (): number => {
        throw new Error('clock failed');
      };
      TestHarness.runPhysicsBatch(h.delegate);
      assert.deepEqual(h.delegate.events, [
        { type: 'error', error: 'Error: clock failed' },
      ]);
      assert.equal(
        h.delegate.timers.filter(
          (timer: MockTimer): boolean => !timer.cancelled,
        ).length,
        0,
      );
    });
    void it('does not restart a loop stopped by its outgoing event delegate', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      const post: (event: WorkerEvent) => void = h.delegate.post.bind(
        h.delegate,
      );
      h.delegate.post = (event: WorkerEvent): void => {
        post(event);
        if (event.type === 'positions') {
          h.runtime.handle({ type: 'stop' });
        }
      };
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: null });
      TestHarness.runPhysicsBatch(h.delegate);
      assert.equal(h.delegate.events.at(-1)?.type, 'stopped');
      assert.equal(
        h.delegate.timers.filter(
          (timer: MockTimer): boolean => !timer.cancelled,
        ).length,
        0,
      );
    });
  });
  void describe('destroy', (): void => {
    void it('cancels pending work and fences queued callbacks idempotently', (): void => {
      const h: ReturnType<typeof TestHarness.physicsRuntime> =
        TestHarness.physicsRuntime();
      h.runtime.handle({ type: 'run', revision: 0, milliseconds: null });
      const old: MockTimer = h.delegate.timers[0];
      h.runtime.destroy();
      h.runtime.destroy();
      old.callback();
      assert.equal(old.cancelled, true);
      assert.deepEqual(h.delegate.events, []);
    });
  });
  void describe('constructor', (): void => {
    void it('does not read the clock or start work before a run command', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      delegate.now = (): number => {
        throw new Error('not started');
      };
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.ok(runtime instanceof CanvasPhysicsRuntime);
      assert.deepEqual(delegate.timers, []);
    });
    void it('rejects invalid simulation options', (): void => {
      assert.throws((): void => {
        new CanvasPhysicsRuntime(new MockRuntimeDelegate(), { FPS: 0 });
      }, InvalidDataError);
    });
  });
});
