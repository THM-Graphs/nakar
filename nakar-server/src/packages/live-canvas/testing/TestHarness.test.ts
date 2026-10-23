import type { NodeData } from '../data/NodeData';
import type { EdgeData } from '../data/EdgeData';
import type { CanvasData } from '../data/CanvasData';
import { CanvasGraph } from '../graph/CanvasGraph';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import type { QueryResult } from '../data/QueryResult';
import type { CanvasDelegates } from '../delegates/CanvasDelegates';
import { LiveCanvas } from '../canvas/LiveCanvas';
import { MockStorageDelegate } from './MockStorageDelegate.test';
import { MockGraphSourceDelegate } from './MockGraphSourceDelegate.test';
import { MockRoomDelegate } from './MockRoomDelegate.test';
import { MockEventDelegate } from './MockEventDelegate.test';
import { MockWorkerDelegate } from './MockWorkerDelegate.test';
import { MockRuntimeDelegate } from './MockRuntimeDelegate.test';
import type { UserData } from '../data/UserData';
import { AuthenticatedCanvasUser } from '../users/AuthenticatedCanvasUser';
import { GuestCanvasUser } from '../users/GuestCanvasUser';
import type { WorkerCommand } from '../physics/WorkerCommand';
import { CanvasActionContext } from '../actions/CanvasActionContext';
import type { PhysicalGraph } from '../../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../physics/physical-graph/PhysicalNode';
import { CanvasPhysicsWorker } from '../physics/CanvasPhysicsWorker';
import type { WorkerEvent } from '../physics/WorkerEvent';
import type { PhysicsWorkerListener } from '../delegates/PhysicsWorkerListener';
import { CanvasPhysicsRuntime } from '../physics/CanvasPhysicsRuntime';
import type { CanvasPhysicsOptions } from '../physics/CanvasPhysicsOptions';
import type { MockTimer } from './MockTimer.test';
import type { CanvasAction } from '../actions/CanvasAction';

export class TestHarness {
  public static deferred(): { promise: Promise<void>; resolve(): void } {
    let release: () => void = (): void => undefined;
    const promise: Promise<void> = new Promise<void>(
      (resolve: () => void): void => {
        release = resolve;
      },
    );
    return { promise, resolve: release };
  }

  public static async interactDuringAction(
    h: ReturnType<typeof TestHarness.harness>,
    action: CanvasAction,
    interact: () => Promise<void>,
    result: QueryResult = TestHarness.result(),
  ): Promise<boolean> {
    const entered: ReturnType<typeof TestHarness.deferred> =
      TestHarness.deferred();
    const resume: ReturnType<typeof TestHarness.deferred> =
      TestHarness.deferred();
    h.source.handler = async (): Promise<QueryResult> => {
      entered.resolve();
      await resume.promise;
      return structuredClone(result);
    };
    const operation: Promise<void> = h.canvas.execute(
      TestHarness.user(),
      action,
    );
    await entered.promise;
    let finished: boolean = false;
    const interaction: Promise<void> = interact();
    void interaction.then(
      (): void => {
        finished = true;
      },
      (): void => {
        finished = true;
      },
    );
    await new Promise<void>((resolve: () => void): void => {
      setImmediate(resolve);
    });
    const independent: boolean = finished;
    resume.resolve();
    await Promise.all([operation, interaction]);
    return independent;
  }

  public static physicsRuntime(
    tickMilliseconds: number = 1,
    options: Partial<CanvasPhysicsOptions> = {},
  ): {
    runtime: CanvasPhysicsRuntime;
    delegate: MockRuntimeDelegate;
  } {
    const delegate: MockRuntimeDelegate = new MockRuntimeDelegate();
    delegate.now = (): number => {
      const time: number = delegate.time;
      delegate.time += tickMilliseconds;
      return time;
    };
    return { runtime: new CanvasPhysicsRuntime(delegate, options), delegate };
  }

  public static runPhysicsBatch(delegate: MockRuntimeDelegate): void {
    const timer: MockTimer | undefined = delegate.timers.find(
      (entry: MockTimer): boolean => !entry.cancelled,
    );
    if (timer === undefined) {
      throw new Error('No scheduled physics batch.');
    }
    delegate.time = Math.max(delegate.time, timer.at);
    timer.cancelled = true;
    timer.callback();
  }

  public static node(id: string, overrides: Partial<NodeData> = {}): NodeData {
    return {
      id,
      nativeId: id,
      sourceId: 'source',
      sourceTitle: null,
      labels: ['Person'],
      properties: { name: id },
      namesInQuery: [],
      compressed: [],
      compressedIds: [],
      creationReason: 'query',
      position: { x: 0, y: 0 },
      locked: false,
      url: null,
      coverImageUrl: null,
      noteIds: [],
      scenarioGroups: [],
      ...overrides,
    };
  }
  public static edge(
    id: string,
    from: string = 'a',
    to: string = 'b',
    overrides: Partial<EdgeData> = {},
  ): EdgeData {
    return {
      id,
      nativeId: id,
      sourceId: 'source',
      sourceTitle: null,
      properties: {},
      namesInQuery: [],
      compressed: [],
      compressedIds: [],
      creationReason: 'query',
      startNodeId: from,
      endNodeId: to,
      startNativeNodeId: from,
      endNativeNodeId: to,
      type: 'KNOWS',
      ...overrides,
    };
  }
  public static canvasData(
    nodes: NodeData[] = [
      TestHarness.node('a'),
      TestHarness.node('b'),
      TestHarness.node('c'),
    ],
    edges: EdgeData[] = [TestHarness.edge('ab')],
  ): CanvasData {
    return {
      graph: { ...new CanvasGraph().toData(), nodes, edges },
      viewSettings: new CanvasViewSettings().toData(),
    };
  }
  public static result(
    nodes: NodeData[] = [],
    edges: EdgeData[] = [],
    limitReached: boolean = false,
  ): QueryResult {
    return { nodes, edges, table: [], limitReached };
  }
  public static harness(): {
    canvas: LiveCanvas;

    delegates: CanvasDelegates;

    storage: MockStorageDelegate;

    source: MockGraphSourceDelegate;

    room: MockRoomDelegate;

    events: MockEventDelegate;

    worker: MockWorkerDelegate;

    runtime: MockRuntimeDelegate;
  } {
    const storage: MockStorageDelegate = new MockStorageDelegate();
    const source: MockGraphSourceDelegate = new MockGraphSourceDelegate();
    const room: MockRoomDelegate = new MockRoomDelegate();
    const events: MockEventDelegate = new MockEventDelegate();
    const worker: MockWorkerDelegate = new MockWorkerDelegate();
    const runtime: MockRuntimeDelegate = new MockRuntimeDelegate();
    const delegates: CanvasDelegates = {
      storage,
      source,
      room,
      events,
      worker,
      runtime,
    };
    return {
      canvas: new LiveCanvas(
        { id: 'canvas', roomId: 'room', title: 'Canvas' },
        delegates,
      ),
      delegates,
      storage,
      source,
      room,
      events,
      worker,
      runtime,
    };
  }
  public static user(
    id: string | null = 'owner',
    sessionId: string = 'session',
  ): AuthenticatedCanvasUser | GuestCanvasUser {
    const data: UserData = { id, sessionId, username: id, position: null };
    return id === null
      ? new GuestCanvasUser(data)
      : new AuthenticatedCanvasUser(data);
  }
  public static latestGraph(
    commands: WorkerCommand[],
  ): Extract<WorkerCommand, { type: 'graph' }> {
    let graph: Extract<WorkerCommand, { type: 'graph' }> | null = null;
    for (const command of commands) {
      if (command.type === 'graph') {
        graph = structuredClone(command);
      } else if (command.type === 'update' && graph !== null) {
        graph.revision = command.revision;
        for (const [id, position] of Object.entries(command.positions)) {
          const node: PhysicalNode | null = graph.graph.nodes[id];
          if (node !== null) {
            node.positionX = position.x;
            node.positionY = position.y;
          }
        }
        for (const [id, locked] of Object.entries(command.locks)) {
          const node: PhysicalNode | null = graph.graph.nodes[id];
          if (node !== null) {
            node.locked = locked;
          }
        }
      }
    }
    if (graph === null) {
      throw new Error('No graph command');
    }
    return graph;
  }
  public static context(): {
    context: CanvasActionContext;
    h: ReturnType<typeof TestHarness.harness>;
  } {
    const h: ReturnType<typeof TestHarness.harness> = TestHarness.harness();
    return {
      context: new CanvasActionContext(
        TestHarness.canvasData(),
        h.storage.room,
        h.delegates,
      ),
      h,
    };
  }
  public static physical(): PhysicalGraph {
    return new CanvasGraph(TestHarness.canvasData().graph).toPhysicalGraph(
      new CanvasViewSettings(),
    );
  }
  public static driftingPhysicalGraph(): PhysicalGraph {
    const graph: PhysicalGraph = TestHarness.physical();
    const node: PhysicalNode | null = graph.nodes['a'];
    if (node === null) {
      throw new Error('Missing test node.');
    }
    return {
      nodes: { a: { ...node, radius: 0, velocityX: 10, velocityY: 0 } },
      edges: {},
    };
  }
  public static setup(): {
    worker: CanvasPhysicsWorker;
    delegate: MockWorkerDelegate;
    messages: WorkerEvent[];
    errors: unknown[];
  } {
    const delegate: MockWorkerDelegate = new MockWorkerDelegate();
    const messages: WorkerEvent[] = [];
    const errors: unknown[] = [];
    const listener: PhysicsWorkerListener = {
      onMessage: (event: WorkerEvent): void => {
        messages.push(event);
      },
      onError: (error: unknown): void => {
        errors.push(error);
      },
    };
    return {
      worker: new CanvasPhysicsWorker(delegate, listener),
      delegate,
      messages,
      errors,
    };
  }
}
