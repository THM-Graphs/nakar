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
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
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
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('x'));
      h.storage.notes = [];
      await h.canvas.execute(TestHarness.user(), new FlipCanvasAction('y'));
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
        h.runtime.timers.filter((timer: MockTimer): boolean => !timer.cancelled)
          .length,
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
