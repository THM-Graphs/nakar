import { InvalidDataError } from '../error/InvalidDataError';
import { InvalidStateError } from '../error/InvalidStateError';
import { TestHarness } from '../testing/TestHarness.test';
import type { MockTimer } from '../testing/MockTimer.test';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import { CanvasPhysicsRuntime } from './CanvasPhysicsRuntime';
import { MockRuntimeDelegate } from '../testing/MockRuntimeDelegate.test';

import type { WorkerEvent } from './WorkerEvent';

void describe('CanvasPhysicsRuntime', (): void => {
  void describe('handle', (): void => {
    void it('reports slow calculation performance', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      let now: number = 0;
      delegate.now = (): number => {
        now += 20;
        return now;
      };
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({ type: 'run', revision: 0, milliseconds: 100 });
      delegate.advance(15);
      const event: WorkerEvent = delegate.events[0];
      assert.ok(event.type === 'positions');
      assert.equal(event.performance.performance, 'bad');
      runtime.destroy();
    });
    void it('runs through an injected scheduler, emits positions and stops at the deadline', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.physical(),
      });
      runtime.handle({ type: 'run', revision: 1, milliseconds: 60 });
      delegate.advance(60);
      assert.equal(
        delegate.events.filter(
          (event: WorkerEvent): boolean => event.type === 'positions',
        ).length,
        4,
      );
      assert.equal(delegate.events.at(-1)?.type, 'stopped');
      const positions: WorkerEvent = delegate.events[0];
      assert.ok(positions.type === 'positions');
      assert.equal(positions.performance.performance, 'good');
      assert.equal(positions.revision, 1);
    });
    void it('ignores run commands for an older revision', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({
        type: 'graph',
        revision: 2,
        graph: TestHarness.physical(),
      });
      runtime.handle({
        type: 'graph',
        revision: 1,
        graph: TestHarness.physical(),
      });
      runtime.handle({ type: 'run', revision: 1, milliseconds: 60 });
      assert.equal(delegate.timers.length, 0);
    });
    void it('extends an active run without scheduling duplicate timers', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({
        type: 'graph',
        revision: 2,
        graph: TestHarness.physical(),
      });
      runtime.handle({ type: 'run', revision: 2, milliseconds: 30 });
      runtime.handle({ type: 'run', revision: 2, milliseconds: 60 });
      assert.equal(delegate.timers.length, 1);
    });
    void it('invalidates old callbacks when replacing the physical graph', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({
        type: 'graph',
        revision: 2,
        graph: TestHarness.physical(),
      });
      runtime.handle({ type: 'run', revision: 2, milliseconds: 30 });
      const old: MockTimer = delegate.timers[0];
      runtime.handle({ type: 'run', revision: 2, milliseconds: 60 });
      delegate.advance(15);
      runtime.handle({
        type: 'graph',
        revision: 3,
        graph: TestHarness.physical(),
      });
      old.callback();
      delegate.advance(100);
      assert.equal(delegate.events.length, 1);
    });
    void it('reports an explicit stop for the current revision', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({
        type: 'graph',
        revision: 2,
        graph: TestHarness.physical(),
      });
      runtime.handle({
        type: 'graph',
        revision: 3,
        graph: TestHarness.physical(),
      });
      runtime.handle({ type: 'stop' });
      assert.deepEqual(delegate.events.at(-1), {
        type: 'stopped',
        revision: 3,
      });
    });
    void it('rejects a duration of 0', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.throws((): void => {
        runtime.handle({ type: 'run', revision: 0, milliseconds: 0 });
      }, InvalidDataError);
    });
    void it('rejects a duration of -1', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.throws((): void => {
        runtime.handle({ type: 'run', revision: 0, milliseconds: -1 });
      }, InvalidDataError);
    });
    void it('rejects a duration of Infinity', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.throws((): void => {
        runtime.handle({ type: 'run', revision: 0, milliseconds: Infinity });
      }, InvalidDataError);
    });
    void it('rejects a duration of NaN', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.throws((): void => {
        runtime.handle({ type: 'run', revision: 0, milliseconds: NaN });
      }, InvalidDataError);
    });
    void it('rejects commands after destruction', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.destroy();
      assert.throws((): void => {
        runtime.handle({ type: 'stop' });
      }, InvalidStateError);
    });
    void it('ignores null physical nodes while reporting positions', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      const graph: PhysicalGraph = TestHarness.physical();
      graph.nodes['null'] = null;
      runtime.handle({ type: 'graph', revision: 1, graph });
      runtime.handle({ type: 'run', revision: 1, milliseconds: 30 });
      delegate.advance(15);
      assert.equal(delegate.events[0].type, 'positions');
    });
    void it('reports runtime failures as protocol errors', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      const graph: PhysicalGraph = TestHarness.physical();
      graph.nodes['null'] = null;
      runtime.handle({ type: 'graph', revision: 1, graph });
      runtime.handle({ type: 'run', revision: 1, milliseconds: 30 });
      delegate.advance(15);
      delegate.now = (): number => {
        throw new Error('clock failed');
      };
      delegate.advance(15);
      assert.equal(delegate.events.at(-1)?.type, 'error');
    });
  });
  void describe('destroy', (): void => {
    void it('cancels pending work and fences already queued callbacks', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      const runtime: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      runtime.handle({ type: 'run', revision: 0, milliseconds: 30 });
      const callback: () => void = delegate.timers[0].callback.bind(
        delegate.timers[0],
      );
      runtime.destroy();
      runtime.destroy();
      callback();
      delegate.advance(30);
      assert.deepEqual(delegate.events, []);
    });
  });
  void describe('constructor', (): void => {
    void it('accepts its initial data and collaborators', (): void => {
      const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
      let now: number = 0;
      delegate.now = (): number => {
        now += 20;
        return now;
      };
      const instance: CanvasPhysicsRuntime = new CanvasPhysicsRuntime(delegate);
      assert.ok(instance instanceof CanvasPhysicsRuntime);
    });
  });
});
