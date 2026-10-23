import { ForbiddenError } from '../error/ForbiddenError';
import { NotFoundError } from '../error/NotFoundError';
import { InvalidStateError } from '../error/InvalidStateError';
import { ConflictError } from '../error/ConflictError';
import { InvalidDataError } from '../error/InvalidDataError';
import { TestHarness } from '../testing/TestHarness.test';
import { RootUser } from '../users/RootUser';
import type { MockTimer } from '../testing/MockTimer.test';
import type { HistogramData } from '../graph/HistogramData';
import type { ParameterData } from '../data/ParameterData';
import type { UserData } from '../data/UserData';
import type { CanvasData } from '../data/CanvasData';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DeleteElementsAction } from '../actions/DeleteElementsAction';
import { FlipCanvasAction } from '../actions/FlipCanvasAction';
import { FocusNodesAction } from '../actions/FocusNodesAction';
import { LoadScenarioAction } from '../actions/LoadScenarioAction';
import { RunQueryAction } from '../actions/RunQueryAction';
import { SetViewSettingsAction } from '../actions/SetViewSettingsAction';
import { ExpandNodesAction } from '../actions/ExpandNodesAction';
import { CanvasChangedEvent } from '../events/CanvasChangedEvent';
import { CanvasErrorEvent } from '../events/CanvasErrorEvent';
import { CanvasLifecycleEvent } from '../events/CanvasLifecycleEvent';
import { CanvasLimitEvent } from '../events/CanvasLimitEvent';
import { CanvasPhysicsEvent } from '../events/CanvasPhysicsEvent';
import { CanvasPresenceEvent } from '../events/CanvasPresenceEvent';
import { CanvasProgressEvent } from '../events/CanvasProgressEvent';
import { CanvasRoomEvent } from '../events/CanvasRoomEvent';
import type { CanvasEvent } from '../events/CanvasEvent';
import type { WorkerCommand } from '../physics/WorkerCommand';

import type { CanvasReference } from '../data/CanvasReference';
import type { GraphData } from '../data/GraphData';
import type { NodeData } from '../data/NodeData';
import { MockFailingAction } from '../testing/MockFailingAction.test';

const performance: {
  performance: 'good';
  loadPercent: number;
  tickDuration: number;
  tickCount: number;
} = {
  performance: 'good' as const,
  loadPercent: 0,
  tickDuration: 0,
  tickCount: 1,
};

void describe('LiveCanvas', (): void => {
  void describe('state', (): void => {
    void it('reports a new canvas', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      assert.equal(h.canvas.state, 'new');
    });
    void it('reports a ready canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      assert.equal(h.canvas.state, 'ready');
    });
    void it('reports a destroyed canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.destroy(false);
      assert.equal(h.canvas.state, 'destroyed');
    });
  });
  void describe('history', (): void => {
    void it('reports an initially empty history', (): void => {
      assert.equal(TestHarness.harness().canvas.history.canUndo, false);
    });
  });
  void describe('toData', (): void => {
    void it('detaches nested graph and view data', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const data: CanvasData = h.canvas.toData();
      data.graph.nodes[0].properties['name'] = 'changed';
      data.viewSettings.growNodesBasedOnDegreeFactor = 4;
      assert.equal(h.canvas.toData().graph.nodes[0].properties['name'], 'a');
      assert.equal(
        h.canvas.toData().viewSettings.growNodesBasedOnDegreeFactor,
        2,
      );
    });
  });
  void describe('getActiveUsers', (): void => {
    void it('returns detached presence data', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      const users: UserData[] = h.canvas.getActiveUsers();
      users[0].username = 'changed';
      assert.equal(h.canvas.getActiveUsers()[0].username, 'owner');
    });
  });
  void describe('observerErrors', (): void => {
    void it('isolates failing event delegates and bounds retained errors', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.events.error = new Error('observer failed');
      for (let i: number = 0; i < 120; i++) {
        h.canvas.onError('event');
      }
      assert.equal(h.canvas.observerErrors.length, 100);
    });
  });
  void describe('read', (): void => {
    void it('does not save reads, presence, cursor changes or grabs', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.read(TestHarness.user());
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.setCursorPosition(TestHarness.user(), { x: 2, y: 3 });
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.removeUser('session');
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
    });
    void it('allows a root user to read a private room without project membership', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const actor: RootUser = new RootUser(TestHarness.user('root').toData());
      assert.deepEqual(await h.canvas.read(actor), h.canvas.toData());
    });
    void it('returns a detached authorized snapshot', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const data: GraphData = (await h.canvas.read(TestHarness.user())).graph;
      data.nodes[0].position.x = 99;
      assert.equal(h.canvas.toData().graph.nodes[0].position.x, 0);
    });
    void it('rejects an identity without room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.read(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('getHistogram', (): void => {
    void it('returns the authorized histogram with canonical element identities', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const histogram: HistogramData = await h.canvas.getHistogram(
        TestHarness.user(),
      );
      assert.deepEqual(histogram.nodeLabels[0].elementIds, ['a', 'b', 'c']);
    });
    void it('rejects an identity without room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.getHistogram(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('constructor', (): void => {
    void it('starts independently and returns defensive snapshots', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      assert.equal(h.canvas.state, 'new');
      assert.equal(h.canvas.history.canUndo, false);
      assert.deepEqual(h.canvas.getActiveUsers(), []);
      h.canvas.toData().graph.nodes.push(TestHarness.node('a'));
      assert.equal(h.canvas.toData().graph.nodes.length, 0);
    });
  });
  void describe('bootstrap', (): void => {
    void it('rejects persisted data from another room', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.room.id = 'foreign';
      await assert.rejects(h.canvas.bootstrap(), NotFoundError);
    });
    void it('rejects synchronous reentrant startup', async (): Promise<void> => {
      const other: ReturnType<typeof TestHarness.harness> =
        TestHarness.harness();
      other.storage.load = async (): Promise<CanvasData | null> => {
        await assert.rejects(other.canvas.bootstrap(), InvalidStateError);
        return TestHarness.canvasData();
      };
      await other.canvas.bootstrap();
    });
    void it('loads persisted data, starts one worker and shares an in-progress startup', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      const one: Promise<void> = h.canvas.bootstrap();
      assert.equal(h.canvas.state, 'starting');
      assert.equal(one, h.canvas.bootstrap());
      await one;
      assert.equal(h.canvas.state, 'ready');
      assert.equal(h.worker.starts, 1);
      assert.equal(h.canvas.toData().graph.nodes.length, 3);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent && event.action === 'ready',
        ),
      );
    });
    void it('creates an empty graph when no persisted snapshot exists', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.data = null;
      await h.canvas.bootstrap();
      assert.equal(h.canvas.toData().graph.nodes.length, 0);
    });
    void it('cleans up after storage.loadError', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.loadError = new Error('failed');
      await assert.rejects(h.canvas.bootstrap(), /failed/);
      assert.equal(h.canvas.state, 'failed');
      assert.equal(h.worker.terminations, 1);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasErrorEvent,
        ),
      );
    });
    void it('cleans up after worker.startError', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.worker.startError = new Error('failed');
      await assert.rejects(h.canvas.bootstrap(), /failed/);
      assert.equal(h.canvas.state, 'failed');
      assert.equal(h.worker.terminations, 1);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasErrorEvent,
        ),
      );
    });
    void it('rejects startup after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.destroy(false);
      await assert.rejects(h.canvas.bootstrap(), InvalidStateError);
    });
  });
  void describe('execute', (): void => {
    void it('commits scenario relationships whose endpoints are loaded by a later query and synchronizes them to the worker', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.data = TestHarness.canvasData([], []);
      h.storage.scenario.queries.push({
        sourceId: 'source',
        query: 'second',
        isTableQuery: false,
      });
      h.source.handler = (): Promise<ReturnType<typeof TestHarness.result>> =>
        Promise.resolve(
          h.source.calls.length === 1
            ? TestHarness.result(
                [TestHarness.node('a')],
                [TestHarness.edge('ab')],
              )
            : TestHarness.result([TestHarness.node('b')]),
        );
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new LoadScenarioAction('scenario'),
      );
      assert.equal(h.canvas.toData().graph.edges[0].id, 'ab');
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.edges['ab']?.endNodeId,
        'b',
      );
      assert.equal(h.canvas.history.undoStackSize, 1);
      await h.canvas.undo(TestHarness.user());
      assert.deepEqual(h.canvas.toData().graph.edges, []);
    });
    void it('places expanded neighbors around an origin moved by physics during the source request', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new ExpandNodesAction(['a']),
          (): Promise<void> => {
            h.canvas.onMessage({
              type: 'positions',
              revision: 1,
              positions: { a: { x: 100, y: 200 } },
              performance,
            });
            return Promise.resolve();
          },
          TestHarness.result(
            [TestHarness.node('new')],
            [TestHarness.edge('an', 'a', 'new')],
          ),
        ),
        true,
      );
      const nodes: NodeData[] = h.canvas.toData().graph.nodes;
      assert.deepEqual(
        nodes.find((node: NodeData): boolean => node.id === 'a')?.position,
        { x: 100, y: 200 },
      );
      assert.deepEqual(
        nodes.find((node: NodeData): boolean => node.id === 'new')?.position,
        {
          x: 100 + Math.cos(Math.PI / 4) * 10,
          y: 200 + Math.sin(Math.PI / 4) * 10,
        },
      );
    });
    void it('places expanded cluster members around a cluster moved by the user during the source request', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.data = TestHarness.canvasData(
        [
          TestHarness.node('cluster', {
            compressed: ['native-a', 'native-b'],
            compressedIds: ['a', 'b'],
          }),
        ],
        [],
      );
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new ExpandNodesAction(['cluster']),
          async (): Promise<void> => {
            await h.canvas.grabNode(TestHarness.user(), 'cluster');
            await h.canvas.moveNodes(TestHarness.user(), [
              { id: 'cluster', position: { x: 100, y: 200 } },
            ]);
            await h.canvas.ungrabNode(TestHarness.user(), 'cluster', {
              x: 100,
              y: 200,
            });
          },
          TestHarness.result([TestHarness.node('a', { nativeId: 'native-a' })]),
        ),
        true,
      );
      const nodes: NodeData[] = h.canvas.toData().graph.nodes;
      assert.equal(nodes.length, 1);
      assert.equal(nodes[0].id, 'a');
      assert.deepEqual(nodes[0].position, {
        x: 100 + Math.cos(Math.PI / 4) * 10,
        y: 200 + Math.sin(Math.PI / 4) * 10,
      });
    });
    void it('reports table-only query limits with their full row count', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.source.response = {
        ...TestHarness.result([], [], true),
        table: [{ value: 1 }, { value: 2 }, { value: 3 }],
      };
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new RunQueryAction('source', 'table', true),
      );
      assert.equal(h.canvas.toData().graph.table.length, 3);
      assert.deepEqual(
        h.events.events
          .filter(
            (event: CanvasEvent): event is CanvasLimitEvent =>
              event instanceof CanvasLimitEvent,
          )
          .map((event: CanvasLimitEvent): number => event.loadedCount),
        [3],
      );
    });
    void it('continues later independent expansions after an earlier source failure', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      let count: number = 0;
      h.source.handler = (): Promise<ReturnType<typeof TestHarness.result>> => {
        count += 1;
        return count === 1
          ? Promise.reject(new Error('first failed'))
          : Promise.resolve(TestHarness.result([TestHarness.node('new')]));
      };
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new ExpandNodesAction(['a', 'b'])),
        /first failed/,
      );
      await h.canvas.read(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 4);
      assert.equal(h.canvas.history.undoStackSize, 1);
    });
    void it('does not request storage for an action that only adds a history entry', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.canvas.history.undoStackSize, 1);
      assert.equal(h.storage.saves.length, 0);
    });
    void it('preserves physics positions received while a query is awaiting its source', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      let release: (() => void) | undefined;
      let entered: (() => void) | undefined;
      const gate: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          release = resolve;
        },
      );
      const started: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          entered = resolve;
        },
      );
      h.source.handler = async (): Promise<
        ReturnType<typeof TestHarness.result>
      > => {
        entered?.();
        await gate;
        return TestHarness.result();
      };
      const action: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new RunQueryAction('source', 'query', false),
      );
      await started;
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 100, y: 200 } },
        performance,
      });
      release?.();
      await action;
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 100,
        y: 200,
      });
    });
    void it('preserves redo and graph history across visualization changes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await h.canvas.undo(TestHarness.user());
      await h.canvas.execute(TestHarness.user(), new SetViewSettingsAction());
      assert.equal(h.canvas.history.canRedo, true);
      assert.equal(h.canvas.history.undoStackSize, 0);
      await h.canvas.redo(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
    });
    void it('does not reload derived data for local reflections', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notesError = new Error('must not load notes');
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
      assert.equal(h.canvas.history.undoStackSize, 1);
    });
    void it('keeps a successful expansion when a later selected node fails', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      let count: number = 0;
      h.source.handler = (): Promise<ReturnType<typeof TestHarness.result>> => {
        count += 1;
        return count === 1
          ? Promise.resolve(TestHarness.result([TestHarness.node('new')]))
          : Promise.reject(new Error('second expansion failed'));
      };
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new ExpandNodesAction(['a', 'b'])),
        /second expansion failed/,
      );
      await h.canvas.read(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 4);
      assert.equal(h.canvas.history.undoStackSize, 1);
      await h.canvas.undo(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 3);
    });
    void it('creates a separate undo entry for each expanded node', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new ExpandNodesAction(['a', 'b']),
      );
      assert.equal(h.canvas.history.undoStackSize, 2);
    });
    void it('does not start physics for focus or relationship compression policies', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new FocusNodesAction(['a', 'b']),
      );
      assert.equal(
        h.worker.commands.some(
          (command: WorkerCommand): boolean => command.type === 'run',
        ),
        false,
      );
    });
    void it('coalesces successful actions into one detached save after one second', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      h.runtime.advance(900);
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['b']),
      );
      h.runtime.advance(99);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
      h.runtime.advance(1);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
      h.runtime.advance(5000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
    });
    void it('reports failed automatic saves and retries the latest state', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      h.storage.saveError = new Error('offline');
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasErrorEvent,
        ),
      );
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['b']),
      );
      h.storage.saveError = null;
      h.runtime.advance(999);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
      h.runtime.advance(1);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
    });
    void it('does not save a failed draft', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new MockFailingAction()),
      );
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
    });
    void it('allows a root user to join and mutate a private canvas without project membership', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const actor: RootUser = new RootUser(TestHarness.user('root').toData());
      await h.canvas.addUser(actor);
      await h.canvas.execute(actor, new DeleteElementsAction(['a']));
      assert.equal(h.canvas.getActiveUsers()[0].id, 'root');
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
      assert.equal(h.canvas.history.canUndo, true);
    });
    void it('publishes committed domain changes even if the worker transport fails', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.worker.postError = new Error('worker transport failed');
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
      assert.equal(h.canvas.history.canUndo, true);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasChangedEvent,
        ),
      );
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasErrorEvent,
        ),
      );
    });
    void it('emits graph changes and keeps the bounded history at ten entries', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      for (let i: number = 0; i < 11; i++) {
        await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
      }
      assert.equal(h.canvas.history.undoStackSize, 10);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasChangedEvent &&
            event.changes.includes('histogram'),
        ),
      );
    });
    void it('commits a query draft, reports limits and publishes progress and history', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.source.response = TestHarness.result([TestHarness.node('d')], [], true);
      await h.canvas.execute(
        TestHarness.user(),
        new RunQueryAction('source', 'query', false),
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 4);
      assert.equal(h.canvas.history.undoAction, 'Run query');
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLimitEvent && event.loadedCount === 1,
        ),
      );
      const progress: CanvasProgressEvent[] = h.events.events.filter(
        (event: CanvasEvent): event is CanvasProgressEvent =>
          event instanceof CanvasProgressEvent,
      );
      assert.deepEqual(
        progress.map(
          (event: CanvasProgressEvent): string | null => event.message,
        ),
        ['Run query', null],
      );
      assert.ok(
        h.worker.commands.some(
          (command: WorkerCommand): boolean =>
            command.type === 'run' && command.milliseconds === 4000,
        ),
      );
    });
    void it('serializes actions and continues after rejected actions without publishing failed drafts', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const bad: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new MockFailingAction(),
      );
      const good: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await assert.rejects(bad, /action failed/);
      await good;
      assert.deepEqual(
        h.canvas
          .toData()
          .graph.nodes.map((entry: NodeData): string => entry.id),
        ['b', 'c'],
      );
      assert.equal(h.canvas.history.undoStackSize, 1);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasProgressEvent && event.pending > 0,
        ),
      );
    });
    void it('rejects an identity without room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.execute(TestHarness.user(null), new DeleteElementsAction()),
        ForbiddenError,
      );
    });
    void it('allows guest actions in public rooms', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.room.visibility = 'public';
      await h.canvas.execute(
        TestHarness.user(null),
        new FocusNodesAction(['a', 'b']),
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
    });
    void it('rejects room data belonging to another room', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.room.id = 'foreign';
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new DeleteElementsAction()),
        NotFoundError,
      );
    });
    void it('rechecks access after asynchronous source work before publishing its draft', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.room.visibility = 'public';
      await h.canvas.execute(
        TestHarness.user(null),
        new FocusNodesAction(['a', 'b']),
      );
      h.source.handler = (): Promise<ReturnType<typeof TestHarness.result>> => {
        h.storage.room.visibility = 'private';
        return Promise.resolve(
          TestHarness.result([TestHarness.node('secret')]),
        );
      };
      await assert.rejects(
        h.canvas.execute(
          TestHarness.user(null),
          new RunQueryAction('source', 'q', false),
        ),
        ForbiddenError,
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
    });
    void it('rolls back a draft when postprocessing fails', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notesError = new Error('notes failed');
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new DeleteElementsAction(['a'])),
        /notes failed/,
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 3);
    });
    void it('assigns matching scenario groups and graph notes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notes = [
        {
          id: 'note',
          nodeIds: ['a'],
          content: 'text',
          author: null,
          updatedAt: null,
        },
      ];
      h.storage.groups = [
        {
          id: 'group',
          title: null,
          scenarios: [
            {
              id: 'match',
              title: null,
              parameters: [
                {
                  identifier: 'name',
                  title: null,
                  dataType: 'string',
                  allowedLabels: ['Person'],
                },
              ],
            },
            {
              id: 'unrestricted',
              title: null,
              parameters: [
                {
                  identifier: 'name',
                  title: null,
                  dataType: 'string',
                  allowedLabels: [],
                },
              ],
            },
            {
              id: 'missing-property',
              title: null,
              parameters: [
                {
                  identifier: 'missing',
                  title: null,
                  dataType: 'string',
                  allowedLabels: [],
                },
              ],
            },
            {
              id: 'other-label',
              title: null,
              parameters: [
                {
                  identifier: 'name',
                  title: null,
                  dataType: 'string',
                  allowedLabels: ['Other'],
                },
              ],
            },
          ],
        },
        { id: 'empty', title: null, scenarios: [] },
      ];
      await h.canvas.execute(TestHarness.user(), new DeleteElementsAction());
      assert.deepEqual(h.canvas.toData().graph.nodes[0].noteIds, ['note']);
      assert.deepEqual(
        h.canvas
          .toData()
          .graph.nodes[0].scenarioGroups[0].scenarios.map(
            (entry: {
              id: string;
              title: string | null;
              parameters: ParameterData[];
            }): string => entry.id,
          ),
        ['match', 'unrestricted'],
      );
    });
    void it('removes stale note references after a later mutation', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notes = [
        {
          id: 'note',
          nodeIds: ['a'],
          content: 'text',
          author: null,
          updatedAt: null,
        },
      ];
      await h.canvas.execute(TestHarness.user(), new DeleteElementsAction());
      h.storage.notes = [];
      await h.canvas.execute(TestHarness.user(), new DeleteElementsAction());
      assert.deepEqual(h.canvas.toData().graph.nodes[0].noteIds, []);
    });
    void it('renames the canvas after a scenario commits', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.source.response = TestHarness.result([TestHarness.node('new')]);
      await h.canvas.execute(
        TestHarness.user(),
        new LoadScenarioAction('scenario'),
      );
      assert.equal(h.room.canvases[0].title, 'Scenario');
    });
    void it('isolates failures thrown by event observers', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.source.response = TestHarness.result([TestHarness.node('new')]);
      await h.canvas.execute(
        TestHarness.user(),
        new LoadScenarioAction('scenario'),
      );
      h.events.error = new Error('observer failed');
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['new']),
      );
      assert.equal(h.canvas.toData().graph.nodes.length, 0);
      assert.ok(h.canvas.observerErrors.length > 0);
    });
    void it('rejects actions before startup', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new DeleteElementsAction()),
        InvalidStateError,
      );
    });
    void it('rejects actions after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.destroy(false);
      await assert.rejects(
        h.canvas.execute(TestHarness.user(), new DeleteElementsAction()),
        InvalidStateError,
      );
    });
  });
  void describe('undo', (): void => {
    void it('retries a failed history save automatically', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      h.storage.saveError = new Error('offline');
      await assert.rejects(h.canvas.undo(TestHarness.user()), /offline/);
      h.storage.saveError = null;
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
      assert.equal(h.storage.saves[0].graph.nodes.length, 3);
    });
    void it('leaves an empty history unchanged without saving', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.undo(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
    });
    void it('restores and persists the previous graph snapshot', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await h.canvas.undo(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 3);
      assert.equal(h.canvas.history.canRedo, true);
      assert.equal(h.storage.saves.length, 1);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.undo(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('redo', (): void => {
    void it('leaves an empty redo history unchanged', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.redo(TestHarness.user());
      assert.equal(h.canvas.history.canRedo, false);
      assert.equal(h.storage.saves.length, 0);
    });
    void it('restores an undone mutation', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await h.canvas.undo(TestHarness.user());
      await h.canvas.redo(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes.length, 2);
    });
    void it('invalidates redo after a new graph action', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await h.canvas.undo(TestHarness.user());
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['b']),
      );
      assert.equal(h.canvas.history.canRedo, false);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.redo(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('saveGraph', (): void => {
    void it('skips a queued automatic save when an earlier manual save already persisted its revision', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      const save: Promise<void> = h.canvas.saveGraph(TestHarness.user());
      h.runtime.advance(1000);
      await save;
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
    });
    void it('cancels a pending automatic save and fences its stale callback', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      const timer: MockTimer = h.runtime.timers[0];
      await h.canvas.saveGraph(TestHarness.user());
      timer.callback();
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(timer.cancelled, true);
      assert.equal(h.storage.saves.length, 1);
    });
    void it('sends the current snapshot to storage', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.saveGraph(TestHarness.user());
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
    });
    void it('propagates a storage failure', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.saveError = new Error('save failed');
      await assert.rejects(
        h.canvas.saveGraph(TestHarness.user()),
        /save failed/,
      );
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.saveGraph(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('relayout', (): void => {
    void it('unlocks the graph and requests a long simulation', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.relayout(TestHarness.user());
      assert.equal(h.worker.commands.at(-1)?.type, 'run');
      assert.deepEqual(h.worker.commands.at(-1), {
        type: 'run',
        revision: 1,
        milliseconds: 4000,
      });
    });
    void it('rejects an identity without room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.relayout(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('addUser', (): void => {
    void it('does not rejoin a session removed while its authorization is pending', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const entered: ReturnType<typeof TestHarness.deferred> =
        TestHarness.deferred();
      const resume: ReturnType<typeof TestHarness.deferred> =
        TestHarness.deferred();
      const getRoom: typeof h.storage.getRoom = h.storage.getRoom.bind(
        h.storage,
      );
      h.storage.getRoom = async (): ReturnType<typeof getRoom> => {
        entered.resolve();
        await resume.promise;
        return await getRoom();
      };
      const join: Promise<void> = h.canvas.addUser(TestHarness.user());
      const rejected: Promise<void> = assert.rejects(join, InvalidStateError);
      await entered.promise;
      await h.canvas.removeUser('session');
      resume.resolve();
      await rejected;
      assert.deepEqual(h.canvas.getActiveUsers(), []);
      await h.canvas.addUser(TestHarness.user());
      assert.equal(h.canvas.getActiveUsers().length, 1);
    });
    void it('joins while a source query is pending without publishing interaction progress', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            const count: number = h.events.events.length;
            await h.canvas.addUser(TestHarness.user());
            assert.equal(h.canvas.getActiveUsers().length, 1);
            assert.equal(
              h.events.events
                .slice(count)
                .some(
                  (event: CanvasEvent): boolean =>
                    event instanceof CanvasProgressEvent,
                ),
              false,
            );
          },
        ),
        true,
      );
    });
    void it('joins once and cancels pending idle shutdown', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.scheduleShutdown();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user());
      assert.equal(h.runtime.timers[0].cancelled, true);
      assert.equal(h.canvas.getActiveUsers().length, 1);
    });
    void it('retains separate sessions for one identity', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user('owner', 'second'));
      assert.equal(h.canvas.getActiveUsers().length, 2);
    });
    void it('rejects session takeover by a different identity', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await assert.rejects(
        h.canvas.addUser(TestHarness.user('collaborator')),
        ConflictError,
      );
    });
    void it('returns isolated presence data', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      const users: UserData[] = h.canvas.getActiveUsers();
      users[0].username = 'altered';
      assert.equal(h.canvas.getActiveUsers()[0].username, 'owner');
    });
    void it('does not schedule idle shutdown while users remain', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.scheduleShutdown();
      await h.canvas.addUser(TestHarness.user());
      h.canvas.scheduleShutdown();
      assert.equal(h.runtime.timers.length, 1);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.addUser(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('removeUser', (): void => {
    void it('removes a session and releases its grab while a query is pending', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.removeUser('session');
            assert.equal(h.canvas.getActiveUsers().length, 0);
            assert.equal(
              TestHarness.latestGraph(h.worker.commands).graph.nodes['a']
                ?.locked,
              false,
            );
            h.runtime.advance(10_000);
            assert.equal(
              h.events.events.some(
                (event: CanvasEvent): boolean =>
                  event instanceof CanvasLifecycleEvent &&
                  event.action === 'shouldShutdown',
              ),
              false,
            );
          },
        ),
        true,
      );
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        false,
      );
      h.runtime.advance(10_000);
      assert.equal(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent &&
            event.action === 'shouldShutdown',
        ),
        true,
      );
    });
    void it('ignores an unknown session', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.removeUser('missing');
      assert.equal(h.canvas.getActiveUsers().length, 1);
    });
    void it('releases grabs while keeping the canvas active for remaining users', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user('owner', 'second'));
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.removeUser('session');
      assert.equal(h.runtime.timers.length, 0);
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        false,
      );
    });
    void it('schedules shutdown when the last session leaves', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user('owner', 'second'));
      await h.canvas.removeUser('session');
      await h.canvas.removeUser('second');
      assert.equal(h.canvas.getActiveUsers().length, 0);
      assert.equal(h.runtime.timers.length, 1);
    });
  });
  void describe('setCursorPosition', (): void => {
    void it('updates the cursor before a pending query completes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.setCursorPosition(TestHarness.user(), {
              x: 7,
              y: 8,
            });
            assert.deepEqual(h.canvas.getActiveUsers()[0].position, {
              x: 7,
              y: 8,
            });
          },
        ),
        true,
      );
    });
    void it('rejects interactions before startup', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await assert.rejects(
        h.canvas.setCursorPosition(TestHarness.user(), null),
        InvalidStateError,
      );
    });
    void it('rejects an interaction whose authorization finishes after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      const entered: ReturnType<typeof TestHarness.deferred> =
        TestHarness.deferred();
      const resume: ReturnType<typeof TestHarness.deferred> =
        TestHarness.deferred();
      const getRoom: typeof h.storage.getRoom = h.storage.getRoom.bind(
        h.storage,
      );
      h.storage.getRoom = async (): ReturnType<typeof getRoom> => {
        entered.resolve();
        await resume.promise;
        return await getRoom();
      };
      const interaction: Promise<void> = h.canvas.setCursorPosition(
        TestHarness.user(),
        { x: 1, y: 2 },
      );
      const rejected: Promise<void> = assert.rejects(
        interaction,
        InvalidStateError,
      );
      await entered.promise;
      await h.canvas.destroy(false);
      const count: number = h.events.events.length;
      resume.resolve();
      await rejected;
      assert.equal(h.events.events.length, count);
      assert.deepEqual(h.canvas.getActiveUsers(), []);
    });
    void it('rejects an unregistered session', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.setCursorPosition(TestHarness.user(), { x: 1, y: 2 }),
        ForbiddenError,
      );
    });
    void it('updates the registered cursor and emits presence', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.setCursorPosition(TestHarness.user(), { x: 1, y: 2 });
      assert.deepEqual(h.canvas.getActiveUsers()[0].position, { x: 1, y: 2 });
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasPresenceEvent && event.action === 'cursor',
        ),
      );
    });
    void it('rejects non-finite cursor coordinates', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await assert.rejects(
        h.canvas.setCursorPosition(TestHarness.user(), { x: 0, y: NaN }),
        InvalidDataError,
      );
    });
    void it('clears the registered cursor', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.setCursorPosition(TestHarness.user(), { x: 1, y: 2 });
      await h.canvas.setCursorPosition(TestHarness.user(), null);
      assert.equal(h.canvas.getActiveUsers()[0].position, null);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasPresenceEvent && event.action === 'cursor',
        ),
      );
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.setCursorPosition(TestHarness.user(null), null),
        ForbiddenError,
      );
    });
  });
  void describe('grabNode', (): void => {
    void it('grabs a node during a query and retains its worker lock after commit', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.grabNode(TestHarness.user(), 'a');
            assert.equal(
              TestHarness.latestGraph(h.worker.commands).graph.nodes['a']
                ?.locked,
              true,
            );
          },
        ),
        true,
      );
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        true,
      );
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 4, y: 5 } },
      ]);
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 4,
        y: 5,
      });
    });
    void it('rejects an unregistered session', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.grabNode(TestHarness.user(), 'a'),
        ForbiddenError,
      );
    });
    void it('allows multiple sessions to grab the same node', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.addUser(TestHarness.user('collaborator', 'other'));
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.grabNode(TestHarness.user('collaborator', 'other'), 'a');
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        true,
      );
    });
    void it('rejects an unknown node', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await assert.rejects(
        h.canvas.grabNode(TestHarness.user(), 'absent'),
        NotFoundError,
      );
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.grabNode(TestHarness.user(null), 'a'),
        ForbiddenError,
      );
    });
  });
  void describe('moveNodes', (): void => {
    void it('retains an interactive position over a scenario layout calculated after its query', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      h.storage.scenario.actions = [
        {
          type: 'layout',
          layout: { type: 'circle', nodeIds: ['a', 'b'], radius: 100 },
        },
      ];
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new LoadScenarioAction('scenario'),
          async (): Promise<void> => {
            await h.canvas.grabNode(TestHarness.user(), 'a');
            await h.canvas.moveNodes(TestHarness.user(), [
              { id: 'a', position: { x: 9, y: 10 } },
            ]);
          },
          TestHarness.result([TestHarness.node('a'), TestHarness.node('b')]),
        ),
        true,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 9,
        y: 10,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, true);
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        true,
      );
      assert.equal(h.canvas.toData().graph.nodes[1].locked, true);
    });
    void it('retains an interactive move when the pending action fails to commit', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await assert.rejects(
        TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.moveNodes(TestHarness.user(), [
              { id: 'a', position: { x: 9, y: 10 } },
            ]);
            h.storage.notesError = new Error('notes unavailable');
          },
        ),
        /notes unavailable/,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 9,
        y: 10,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, true);
      assert.equal(h.canvas.history.canUndo, false);
    });
    void it('does not retain nodes removed by a replacing query after they were moved', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', true),
          async (): Promise<void> => {
            await h.canvas.moveNodes(TestHarness.user(), [
              { id: 'a', position: { x: 9, y: 10 } },
            ]);
          },
          TestHarness.result([TestHarness.node('b')]),
        ),
        true,
      );
      assert.deepEqual(
        h.canvas.toData().graph.nodes.map((node: NodeData): string => node.id),
        ['b'],
      );
      await assert.rejects(
        h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 9, y: 10 }),
        ForbiddenError,
      );
    });
    void it('moves a grabbed node during a query and retains its position and persistent lock after commit', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.moveNodes(TestHarness.user(), [
              { id: 'a', position: { x: 9, y: 10 } },
            ]);
            assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
              x: 9,
              y: 10,
            });
          },
        ),
        true,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 9,
        y: 10,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, true);
      assert.equal(h.canvas.history.undoStackSize, 1);
      assert.deepEqual(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.positionX,
        9,
      );
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.deepEqual(h.storage.saves.at(-1)?.graph.nodes[0].position, {
        x: 9,
        y: 10,
      });
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 9,
        y: -10,
      });
    });
    void it('sends only position and lock deltas to the worker', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      const count: number = h.worker.commands.length;
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 5, y: 6 } },
      ]);
      const commands: WorkerCommand[] = h.worker.commands.slice(count);
      assert.equal(commands.length, 2);
      assert.deepEqual(commands[0], {
        type: 'update',
        revision: 3,
        positions: { a: { x: 5, y: 6 } },
        locks: { a: true },
      });
      assert.equal(commands[1].type, 'run');
    });
    void it('automatically saves dragged positions and locks', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 3, y: 4 } },
      ]);
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
    });
    void it('does not save unchanged or ungrabbed positions', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 3, y: 4 } },
      ]);
      await h.canvas.saveGraph(TestHarness.user());
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 3, y: 4 } },
        { id: 'b', position: { x: 5, y: 6 } },
      ]);
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
    });
    void it('moves grabbed nodes only and excludes movement from undo history', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 2, y: 3 } },
        { id: 'b', position: { x: 99, y: 99 } },
        { id: 'absent', position: { x: 1, y: 1 } },
      ]);
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 2,
        y: 3,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, true);
      assert.equal(h.canvas.toData().graph.nodes[1].position.x, 0);
      assert.equal(h.canvas.history.canUndo, false);
    });
    void it('rejects invalid coordinates without committing any draft positions', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.moveNodes(TestHarness.user(), [
        { id: 'a', position: { x: 2, y: 3 } },
        { id: 'b', position: { x: 99, y: 99 } },
        { id: 'absent', position: { x: 1, y: 1 } },
      ]);
      await assert.rejects(
        h.canvas.moveNodes(TestHarness.user(), [
          { id: 'a', position: { x: NaN, y: 0 } },
        ]),
        InvalidDataError,
      );
      assert.equal(h.canvas.toData().graph.nodes[0].position.x, 2);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.moveNodes(TestHarness.user(null), []),
        ForbiddenError,
      );
    });
    void it('rolls back the entire movement batch when a later grabbed node has invalid coordinates', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.grabNode(TestHarness.user(), 'b');
      await assert.rejects(
        h.canvas.moveNodes(TestHarness.user(), [
          { id: 'a', position: { x: 4, y: 5 } },
          { id: 'b', position: { x: NaN, y: 0 } },
        ]),
        InvalidDataError,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 0,
        y: 0,
      });
      assert.equal(h.canvas.history.canUndo, false);
    });
  });
  void describe('ungrabNode', (): void => {
    void it('retains a released original position and unlocked state over a pending scenario layout', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      h.storage.scenario.actions = [
        {
          type: 'layout',
          layout: { type: 'circle', nodeIds: ['a', 'b'], radius: 100 },
        },
      ];
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new LoadScenarioAction('scenario'),
          async (): Promise<void> => {
            await h.canvas.grabNode(TestHarness.user(), 'a');
            await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 0, y: 0 });
          },
          TestHarness.result([TestHarness.node('a'), TestHarness.node('b')]),
        ),
        true,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 0,
        y: 0,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, false);
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        false,
      );
    });
    void it('releases a grab during a query without reintroducing it at commit', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      assert.equal(
        await TestHarness.interactDuringAction(
          h,
          new RunQueryAction('source', 'slow', false),
          async (): Promise<void> => {
            await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 3, y: 4 });
            assert.equal(
              TestHarness.latestGraph(h.worker.commands).graph.nodes['a']
                ?.locked,
              false,
            );
          },
        ),
        true,
      );
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 3,
        y: 4,
      });
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        false,
      );
      await assert.rejects(
        h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 0, y: 0 }),
        ForbiddenError,
      );
    });
    void it('does not request persistence for a grab and release without movement', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 0, y: 0 });
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
    });
    void it('does not persistently lock a node that was grabbed without moving it', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 0, y: 0 });
      assert.equal(h.canvas.toData().graph.nodes[0].locked, false);
      assert.equal(h.worker.commands.at(-1)?.type, 'update');
    });
    void it('automatically persists the final drag position', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 4, y: 5 });
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
    });
    void it('rejects a node not grabbed by the session', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await assert.rejects(
        h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 1, y: 2 }),
        ForbiddenError,
      );
    });
    void it('stores the final position and releases the grab', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 1, y: 2 });
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 1,
        y: 2,
      });
      await assert.rejects(
        h.canvas.ungrabNode(TestHarness.user(), 'a', { x: 3, y: 4 }),
        ForbiddenError,
      );
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.ungrabNode(TestHarness.user(null), 'a', { x: 0, y: 0 }),
        ForbiddenError,
      );
    });
  });
  void describe('unlockAllNodes', (): void => {
    void it('resolves the current graph in queue order and preserves locks of grabbed nodes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.data = TestHarness.canvasData([
        TestHarness.node('a', { locked: true }),
        TestHarness.node('b', { locked: true }),
      ]);
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      await h.canvas.unlockAllNodes(TestHarness.user());
      assert.equal(h.canvas.toData().graph.nodes[0].locked, true);
      assert.equal(h.canvas.toData().graph.nodes[1].locked, false);
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      await h.canvas.undo(TestHarness.user());
      assert.equal(
        TestHarness.latestGraph(h.worker.commands).graph.nodes['a']?.locked,
        true,
      );
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.unlockAllNodes(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('refreshNotes', (): void => {
    void it('preserves live positions and does not invoke merge or group delegates', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      let release: (() => void) | undefined;
      let entered: (() => void) | undefined;
      const gate: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          release = resolve;
        },
      );
      const started: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          entered = resolve;
        },
      );
      h.storage.getMergeRules = (): Promise<never> =>
        Promise.reject(new Error('must not merge'));
      h.storage.getScenarioGroups = (): Promise<never> =>
        Promise.reject(new Error('must not refresh groups'));
      h.storage.getNotes = async (): Promise<GraphData['notes']> => {
        entered?.();
        await gate;
        return [];
      };
      const action: Promise<void> = h.canvas.refreshNotes(TestHarness.user());
      await started;
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 100, y: 200 } },
        performance,
      });
      release?.();
      await action;
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 100,
        y: 200,
      });
    });
    void it('automatically saves refreshed note associations', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.refreshNotes(TestHarness.user());
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.deepEqual(h.storage.saves[0], h.canvas.toData());
    });
    void it('assigns notes to freshly compressed scenario result nodes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notes = [
        {
          id: 'note',
          content: 'cluster note',
          nodeIds: ['a'],
          author: null,
          updatedAt: null,
        },
      ];
      h.source.response = TestHarness.result(
        [
          TestHarness.node('a'),
          TestHarness.node('b'),
          TestHarness.node('hub', { labels: ['Hub'] }),
        ],
        [
          TestHarness.edge('ah', 'a', 'hub'),
          TestHarness.edge('bh', 'b', 'hub'),
        ],
      );
      h.storage.scenario.actions = [{ type: 'compressNodes', label: 'Person' }];
      await h.canvas.execute(
        TestHarness.user(),
        new LoadScenarioAction('scenario'),
      );
      const cluster: NodeData | undefined = h.canvas
        .toData()
        .graph.nodes.find(
          (entry: NodeData): boolean => entry.compressed.length > 0,
        );
      assert.ok(cluster);
      assert.deepEqual(cluster.compressedIds, ['a', 'b']);
      assert.deepEqual(cluster.noteIds, ['note']);
    });
    void it('reloads notes without creating an undo entry', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.notes = [
        {
          id: 'note',
          content: 'hello',
          nodeIds: ['a', 'missing'],
          author: null,
          updatedAt: null,
        },
      ];
      await h.canvas.refreshNotes(TestHarness.user());
      assert.equal(h.canvas.toData().graph.notes[0].content, 'hello');
      assert.deepEqual(h.canvas.toData().graph.nodes[0].noteIds, ['note']);
      assert.equal(h.canvas.history.canUndo, false);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.refreshNotes(TestHarness.user(null)),
        ForbiddenError,
      );
    });
  });
  void describe('changeRoom', (): void => {
    void it('cancels pending automatic saves when the canvas is deleted', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'create');
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      const timer: MockTimer = h.runtime.timers[0];
      await h.canvas.changeRoom(TestHarness.user(), 'close');
      timer.callback();
      h.runtime.advance(1000);
      await h.canvas.destroy();
      assert.equal(timer.cancelled, true);
      assert.equal(h.storage.saves.length, 0);
    });
    void it('rejects queued actions after closing and never recreates the deleted snapshot', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'create');
      const close: Promise<CanvasReference | null> = h.canvas.changeRoom(
        TestHarness.user(),
        'close',
      );
      const action: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(),
      );
      await close;
      await assert.rejects(action, InvalidStateError);
      await h.canvas.destroy();
      assert.equal(h.storage.saves.length, 0);
    });
    void it('creates a new canvas and publishes room references', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const created: CanvasReference | null = await h.canvas.changeRoom(
        TestHarness.user(),
        'create',
      );
      assert.equal(created?.roomId, 'room');
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasRoomEvent,
        ),
      );
    });
    void it('duplicates the current snapshot', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'duplicate');
      assert.deepEqual(h.room.copies[0], h.canvas.toData());
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasRoomEvent,
        ),
      );
    });
    void it('closes the other canvases', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'create');
      await h.canvas.changeRoom(TestHarness.user(), 'closeOthers');
      assert.equal(h.room.canvases.length, 1);
    });
    void it('protects the last canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.changeRoom(TestHarness.user(), 'close'),
        ConflictError,
      );
    });
    void it('enters the closing state after closing its canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'create');
      await h.canvas.changeRoom(TestHarness.user(), 'close');
      assert.equal(h.canvas.state, 'closing');
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasRoomEvent,
        ),
      );
      await h.canvas.destroy(false);
    });
    void it('rejects an identity without private-room access', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await assert.rejects(
        h.canvas.changeRoom(TestHarness.user(null), 'create'),
        ForbiddenError,
      );
    });
  });
  void describe('scheduleShutdown', (): void => {
    void it('defers shutdown while operations are pending', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const action: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new FlipCanvasAction('x'),
      );
      h.canvas.scheduleShutdown();
      assert.equal(h.runtime.timers.length, 0);
      await action;
      assert.equal(
        h.runtime.timers.filter(
          (timer: MockTimer): boolean =>
            !timer.cancelled && timer.at === 10_000,
        ).length,
        1,
      );
    });
    void it('keeps one pending shutdown timer after an idle operation completes', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const action: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new FlipCanvasAction('x'),
      );
      h.canvas.scheduleShutdown();
      await action;
      await h.canvas.saveGraph(TestHarness.user());
      assert.equal(
        h.runtime.timers.filter((timer: MockTimer): boolean => !timer.cancelled)
          .length,
        1,
      );
    });
    void it('does not schedule a canvas before startup', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.canvas.scheduleShutdown();
      assert.equal(h.runtime.timers.length, 0);
    });
    void it('does not request shutdown before the idle deadline', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.scheduleShutdown();
      h.runtime.advance(9999);
      assert.equal(
        h.events.events.filter(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent &&
            event.action === 'shouldShutdown',
        ).length,
        0,
      );
    });
    void it('requests shutdown at the idle deadline', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.scheduleShutdown();
      h.runtime.advance(9999);
      h.runtime.advance(1);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent &&
            event.action === 'shouldShutdown',
        ),
      );
    });
  });
  void describe('cancelShutdown', (): void => {
    void it('cancels prior timers and fences callbacks already queued by the environment', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.scheduleShutdown();
      const old: MockTimer = h.runtime.timers[0];
      h.canvas.scheduleShutdown();
      old.callback();
      h.canvas.cancelShutdown();
      h.runtime.advance(10000);
      assert.equal(
        h.events.events.filter(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent &&
            event.action === 'shouldShutdown',
        ).length,
        0,
      );
    });
  });
  void describe('destroy', (): void => {
    void it('cancels automatic saves when final persistence is disabled', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      const timer: MockTimer = h.runtime.timers[0];
      await h.canvas.destroy(false);
      timer.callback();
      h.runtime.advance(1000);
      assert.equal(h.storage.saves.length, 0);
    });
    void it('skips an automatic save already queued when destruction begins', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      h.runtime.advance(1000);
      await h.canvas.destroy(false);
      assert.equal(h.storage.saves.length, 0);
    });
    void it('terminates physics before taking the final persistence snapshot', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.storage.save = (id: string, data: CanvasData): Promise<void> => {
        assert.equal(id, 'canvas');
        assert.equal(h.worker.terminations, 1);
        h.storage.saves.push(data);
        return Promise.resolve();
      };
      await h.canvas.destroy();
      assert.equal(h.storage.saves.length, 1);
    });
    void it('waits for a queued close without persisting a deleted canvas', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.changeRoom(TestHarness.user(), 'create');
      const close: Promise<CanvasReference | null> = h.canvas.changeRoom(
        TestHarness.user(),
        'close',
      );
      const destroy: Promise<void> = h.canvas.destroy();
      await close;
      await destroy;
      assert.equal(h.storage.saves.length, 0);
      await assert.rejects(h.canvas.bootstrap(), InvalidStateError);
    });
    void it('drains pending actions, rejects new work, saves the final state and terminates once', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      const action: Promise<void> = h.canvas.execute(
        TestHarness.user(),
        new DeleteElementsAction(['a']),
      );
      const shutdown: Promise<void> = h.canvas.destroy();
      assert.equal(h.canvas.destroy(), shutdown);
      await assert.rejects(
        h.canvas.addUser(TestHarness.user()),
        InvalidStateError,
      );
      await action;
      await shutdown;
      assert.equal(h.storage.saves[0].graph.nodes.length, 2);
      assert.equal(h.worker.terminations, 1);
      assert.equal(h.canvas.state, 'destroyed');
    });
    void it('waits for startup to complete before shutting down', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      let release: (() => void) | undefined;
      h.storage.loadGate = new Promise<void>((resolve: () => void): void => {
        release = resolve;
      });
      const start: Promise<void> = h.canvas.bootstrap();
      const shutdown: Promise<void> = h.canvas.destroy();
      release?.();
      await start;
      await shutdown;
      assert.equal(h.canvas.state, 'destroyed');
    });
    void it('completes cleanup and propagates a persistence failure', async (): Promise<void> => {
      const fail: ReturnType<typeof TestHarness.harness> =
        TestHarness.harness();
      await fail.canvas.bootstrap();
      fail.storage.saveError = new Error('save failed');
      await assert.rejects(fail.canvas.destroy(), /save failed/);
      assert.equal(fail.worker.terminations, 1);
      assert.equal(fail.canvas.state, 'destroyed');
    });
    void it('can skip the final save', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.destroy(false);
      assert.equal(h.storage.saves.length, 0);
      assert.equal(h.canvas.state, 'destroyed');
    });
    void it('completes cleanup and propagates a worker termination failure', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.worker.terminateError = new Error('terminate failed');
      await assert.rejects(h.canvas.destroy(false), /terminate failed/);
      assert.equal(h.storage.saves.length, 0);
      assert.equal(h.canvas.state, 'destroyed');
    });
  });
  void describe('onMessage', (): void => {
    void it('persists continuous physics changes without postponing the deadline', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 1, y: 2 } },
        performance,
      });
      h.runtime.advance(900);
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 3, y: 4 } },
        performance,
      });
      h.runtime.advance(100);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 1);
      assert.deepEqual(h.storage.saves[0].graph.nodes[0].position, {
        x: 3,
        y: 4,
      });
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 5, y: 6 } },
        performance,
      });
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 2);
    });
    void it('does not save unchanged or rejected physics positions', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: {
          a: { x: 0, y: 0 },
          b: { x: NaN, y: 1 },
          unknown: { x: 5, y: 6 },
        },
        performance,
      });
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 0);
    });
    void it('retains physics changes received while storage awaits completion', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      let release: (() => void) | undefined;
      let entered: (() => void) | undefined;
      const gate: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          release = resolve;
        },
      );
      const started: Promise<void> = new Promise<void>(
        (resolve: () => void): void => {
          entered = resolve;
        },
      );
      h.storage.save = async (id: string, data: CanvasData): Promise<void> => {
        assert.equal(id, 'canvas');
        h.storage.saves.push(data);
        entered?.();
        await gate;
      };
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 1, y: 2 } },
        performance,
      });
      h.runtime.advance(1000);
      await started;
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 3, y: 4 } },
        performance,
      });
      h.runtime.advance(5000);
      assert.equal(h.storage.saves.length, 1);
      assert.deepEqual(h.storage.saves[0].graph.nodes[0].position, {
        x: 1,
        y: 2,
      });
      release?.();
      await h.canvas.read(TestHarness.user());
      h.runtime.advance(1000);
      await h.canvas.read(TestHarness.user());
      assert.equal(h.storage.saves.length, 2);
      assert.deepEqual(h.storage.saves[1].graph.nodes[0].position, {
        x: 3,
        y: 4,
      });
    });
    void it('ignores notifications before startup', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.canvas.onMessage({ type: 'stopped', revision: 0 });
      assert.deepEqual(h.events.events, []);
    });
    void it('updates only finite positions of unlocked nodes without an active grab', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.addUser(TestHarness.user());
      await h.canvas.grabNode(TestHarness.user(), 'a');
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: {
          a: { x: 99, y: 99 },
          b: { x: 4, y: 5 },
          c: { x: NaN, y: 0 },
          unknown: { x: 1, y: 1 },
        },
        performance,
      });
      assert.equal(h.canvas.toData().graph.nodes[0].position.x, 0);
      assert.equal(h.canvas.toData().graph.nodes[1].position.x, 4);
      assert.equal(h.canvas.toData().graph.nodes[2].position.x, 0);
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasPhysicsEvent,
        ),
      );
    });
    void it('forwards worker errors to the event delegate', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.onMessage({ type: 'error', error: 'physics failed' });
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean => event instanceof CanvasErrorEvent,
        ),
      );
    });
    void it('forwards stopped notifications to the event delegate', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      h.canvas.onMessage({ type: 'stopped', revision: 1 });
      assert.ok(
        h.events.events.some(
          (event: CanvasEvent): boolean =>
            event instanceof CanvasLifecycleEvent &&
            event.action === 'physicsStopped',
        ),
      );
    });
    void it('ignores notifications after destruction', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      await h.canvas.bootstrap();
      await h.canvas.destroy(false);
      const count: number = h.events.events.length;
      h.canvas.onMessage({ type: 'stopped', revision: 1 });
      assert.equal(h.events.events.length, count);
    });
    void it('preserves persistently locked nodes when physics reports a new position', async (): Promise<void> => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.storage.data = TestHarness.canvasData(
        [TestHarness.node('a', { locked: true })],
        [],
      );
      await h.canvas.bootstrap();
      h.canvas.onMessage({
        type: 'positions',
        revision: 1,
        positions: { a: { x: 50, y: 60 } },
        performance,
      });
      assert.deepEqual(h.canvas.toData().graph.nodes[0].position, {
        x: 0,
        y: 0,
      });
    });
  });
  void describe('onError', (): void => {
    void it('emits worker errors through the event delegate', (): void => {
      const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
      h.canvas.onError('worker error');
      const event: CanvasEvent = h.events.events[0];
      assert.ok(event instanceof CanvasErrorEvent);
      assert.equal(event.error, 'worker error');
    });
  });
});
