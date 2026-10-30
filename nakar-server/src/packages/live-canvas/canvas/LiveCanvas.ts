import { InvalidStateError } from '../error/InvalidStateError';
import { NotFoundError } from '../error/NotFoundError';
import { ConflictError } from '../error/ConflictError';
import { InvalidDataError } from '../error/InvalidDataError';
import { ForbiddenError } from '../error/ForbiddenError';
import { DataRecord } from '../data/DataRecord';
import { UndoWrapper } from '../../undo/UndoWrapper';
import { SMap } from '../../map/Map';
import { SSet } from '../../set/Set';
import type { UndoWrapperInfo } from '../../undo/UndoWrapperInfo';
import type { CanvasData } from '../data/CanvasData';
import type { CanvasReference } from '../data/CanvasReference';
import type { GraphData } from '../data/GraphData';
import type { NodeData } from '../data/NodeData';
import type { Position } from '../data/Position';
import type { RoomData } from '../data/RoomData';
import type { ScenarioGroupData } from '../data/ScenarioGroupData';
import type { UserData } from '../data/UserData';
import type { CanvasDelegates } from '../delegates/CanvasDelegates';
import type { PhysicsWorkerListener } from '../delegates/PhysicsWorkerListener';
import type { CanvasAction } from '../actions/CanvasAction';
import { CanvasActionContext } from '../actions/CanvasActionContext';
import { CanvasGraph } from '../graph/CanvasGraph';
import { CanvasHistogram } from '../graph/CanvasHistogram';
import type { HistogramData } from '../graph/HistogramData';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';
import { RoomCanvasManager } from './RoomCanvasManager';
import type { CanvasUser } from '../users/CanvasUser';
import { CanvasChangedEvent } from '../events/CanvasChangedEvent';
import { CanvasErrorEvent } from '../events/CanvasErrorEvent';
import { CanvasLifecycleEvent } from '../events/CanvasLifecycleEvent';
import { CanvasLimitEvent } from '../events/CanvasLimitEvent';
import { CanvasPhysicsEvent } from '../events/CanvasPhysicsEvent';
import { CanvasPresenceEvent } from '../events/CanvasPresenceEvent';
import { CanvasProgressEvent } from '../events/CanvasProgressEvent';
import { CanvasRoomEvent } from '../events/CanvasRoomEvent';
import type { CanvasEvent } from '../events/CanvasEvent';
import { CanvasPhysicsWorker } from '../physics/CanvasPhysicsWorker';
import type { WorkerEvent } from '../physics/WorkerEvent';
import { UnlockAllCanvasNodesAction } from '../actions/UnlockAllCanvasNodesAction';

/**
 * Owns an isolated canvas, serializes authorized canvas actions, processes independent interactions and delegates persistence, events and worker transport to the host.
 */
export class LiveCanvas implements PhysicsWorkerListener {
  /**
   * Bounded graph undo and redo history.
   */
  private readonly _history: UndoWrapper<GraphData> =
    new UndoWrapper<GraphData>(
      new CanvasGraph().toData(),
      (data: GraphData): GraphData => structuredClone(data),
      { maximumStackSize: 10 },
    );

  /**
   * Referenced visualization configuration.
   */
  private _settings: CanvasViewSettings = new CanvasViewSettings();

  /**
   * Registered session identities mapped to their user models.
   */
  private readonly _users: SMap<string, UserData> = new SMap<
    string,
    UserData
  >();

  /** Pending joins that session removal can invalidate while authorization awaits the host. */
  private readonly _joiningUsers: SSet<UserData> = new SSet<UserData>();

  /**
   * Node identities mapped to the sessions currently holding them.
   */
  private readonly _grabs: SMap<string, SSet<string>> = new SMap<
    string,
    SSet<string>
  >();

  /** Nodes touched by interactions since the active action took its draft snapshot. */
  private readonly _interactedNodeIds: SSet<string> = new SSet<string>();

  /**
   * Owned worker controller or platform-specific test worker.
   */
  private readonly _worker: CanvasPhysicsWorker;

  /**
   * Current canvas lifecycle state.
   */
  private _state:
    'new' | 'starting' | 'ready' | 'closing' | 'destroyed' | 'failed' = 'new';

  /**
   * Settled queue tail used to serialize subsequent operations.
   */
  private _tail: Promise<void> = Promise.resolve();

  /**
   * Shared promise for an in-progress worker startup.
   */
  private _start: Promise<void> | null = null;

  /**
   * Shared promise for idempotent asynchronous destruction.
   */
  private _destroy: Promise<void> | null = null;

  /**
   * Queued actions and active interactions that keep the canvas busy.
   */
  private _pending: number = 0;

  /**
   * Whether this canvas has been removed from its room.
   */
  private _closed: boolean = false;

  /**
   * Whether idle shutdown has already been requested from the owner.
   */
  private _idleShutdownRequested: boolean = false;

  /**
   * Handle of the currently scheduled idle shutdown timer.
   */
  private _shutdown: {
    /**
     * Opaque timer handle owned by the runtime delegate.
     */
    handle: unknown;
  } | null = null;

  /**
   * Token invalidating callbacks from cancelled idle shutdown timers.
   */
  private _shutdownGeneration: number = 0;

  /** Revision of the latest persistent mutation. */
  private _revision: number = 0;

  /** Latest revision acknowledged by the storage delegate. */
  private _savedRevision: number = 0;

  /** Pending automatic save deadline, owned by the runtime delegate. */
  private _saveTimer: {
    /** Opaque timer identity returned by the runtime delegate. */
    handle: unknown;
  } | null = null;

  /** Generation used to fence cancelled save callbacks. */
  private _saveGeneration: number = 0;

  /** Whether an automatic save is queued or awaiting storage. */
  private _autosavePending: boolean = false;

  /**
   * Bounded list of failures thrown synchronously by event observers.
   */
  private readonly _observerErrors: unknown[] = [];

  /**
   * Retains the canvas identity and host delegates and creates an initially empty canvas with an owned worker controller.
   * @param _reference - Identity, containing room and title of the canvas.
   * @param _delegates - Host implementations of the external canvas boundaries.
   */
  public constructor(
    private readonly _reference: CanvasReference,
    private readonly _delegates: CanvasDelegates,
  ) {
    this._worker = new CanvasPhysicsWorker(_delegates.worker, this);
  }

  /**
   * Returns the current canvas lifecycle state.
   * @returns The current canvas lifecycle state.
   */
  public get state(): string {
    return this._state;
  }

  /**
   * Returns a detached summary of available undo and redo operations.
   * @returns A detached summary of available undo and redo operations.
   */
  public get history(): UndoWrapperInfo {
    return this._history.info;
  }

  /**
   * Returns a copy of the bounded list of failures thrown by event observers.
   * @returns A copy of the bounded list of failures thrown by event observers.
   */
  public get observerErrors(): readonly unknown[] {
    return [...this._observerErrors];
  }

  /**
   * Returns a deep snapshot that callers can modify without mutating the referenced data.
   * @returns A deep snapshot that callers can modify without mutating the referenced data.
   */
  public toData(): CanvasData {
    return {
      graph: structuredClone(this._history.current),
      viewSettings: this._settings.toData(),
    };
  }

  /**
   * Returns an authorized canvas snapshot after checking the current room permissions.
   * @param user - Trusted identity requesting the operation.
   * @returns A detached graph and view-settings snapshot visible to the requesting identity.
   */
  public read(user: CanvasUser): Promise<CanvasData> {
    return this._enqueue('Read canvas', async (): Promise<CanvasData> => {
      await this._access(user);
      return this.toData();
    });
  }

  /**
   * Returns a histogram of the authorized graph snapshot.
   * @param user - Trusted identity requesting the operation.
   * @returns Histogram groups and element IDs computed from the authorized snapshot.
   */
  public async getHistogram(user: CanvasUser): Promise<HistogramData> {
    const data: CanvasData = await this.read(user);
    return new CanvasHistogram(
      data.graph,
      new CanvasViewSettings(data.viewSettings),
    ).toData();
  }

  /**
   * Returns detached presence data for the registered sessions.
   * @returns Detached presence snapshots of all registered sessions.
   */
  public getActiveUsers(): UserData[] {
    return this._users
      .toValueArray()
      .map((user: UserData): UserData => structuredClone(user));
  }

  /**
   * Loads the canvas and derived data, initializes its history and starts the owned physics worker.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public bootstrap(): Promise<void> {
    if (
      this._state === 'destroyed' ||
      this._state === 'closing' ||
      this._state === 'failed'
    ) {
      return Promise.reject(new InvalidStateError('Canvas cannot be started.'));
    }
    if (this._start !== null) {
      return this._start;
    }
    if (this._state !== 'new') {
      return Promise.reject(new InvalidStateError('Canvas cannot be started.'));
    }
    this._state = 'starting';
    this._start = (async (): Promise<void> => {
      try {
        const data: CanvasData | null = await this._delegates.storage.load(
          this._reference.id,
        );
        if (data !== null) {
          const settings: CanvasViewSettings = new CanvasViewSettings(
            structuredClone(data.viewSettings),
          );
          settings.validate();
          const room: RoomData = await this._delegates.storage.getRoom(
            this._reference.id,
          );
          if (room.id !== this._reference.roomId) {
            throw new NotFoundError('Canvas does not belong to room.');
          }
          const context: CanvasActionContext = new CanvasActionContext(
            structuredClone(data),
            room,
            this._delegates,
          );
          await this._postProcess(context);
          this._history.reset(context.finish().graph);
          this._settings = settings;
        }
        await this._worker.start();
        this._state = this._destroy === null ? 'ready' : 'closing';
        this._syncWorker();
        this._emit(new CanvasLifecycleEvent(this._reference.id, 'ready'));
      } catch (error: unknown) {
        this._state = 'failed';
        await this._worker.destroy();
        this._emit(new CanvasErrorEvent(this._reference.id, error));
        throw error;
      }
    })();
    return this._start;
  }

  /**
   * Serializes an authorized action, commits its completed draft and emits the corresponding changes.
   * @param user - Trusted identity requesting the operation.
   * @param action - Polymorphic canvas action or transaction callback to execute.
   * @returns A promise that settles when the operation completes.
   */
  public execute(user: CanvasUser, action: CanvasAction): Promise<void> {
    return Promise.all(
      action.actions.map((operation: CanvasAction): Promise<void> =>
        this._executeAction(user, operation),
      ),
    ).then((): void => undefined);
  }

  /**
   * Restores the previous graph history entry, updates derived data and saves the published state.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public undo(user: CanvasUser): Promise<void> {
    return this._restore(user, 'undo');
  }

  /**
   * Restores the next graph history entry, updates derived data and saves the published state.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public redo(user: CanvasUser): Promise<void> {
    return this._restore(user, 'redo');
  }

  /**
   * Persists the current canvas snapshot after checking the caller’s room access.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public saveGraph(user: CanvasUser): Promise<void> {
    return this._enqueue('Save graph', async (): Promise<void> => {
      await this._access(user);
      await this._save();
    });
  }

  /**
   * Unlocks the graph and requests a long physics run.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public relayout(user: CanvasUser): Promise<void> {
    return this._enqueue('Relayout', async (): Promise<void> => {
      await this._access(user);
      this._worker.run('long');
    });
  }

  /**
   * Unlocks every canvas node and requests a short physics run.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public unlockAllNodes(user: CanvasUser): Promise<void> {
    // Resolve IDs inside the queue, so preceding graph actions are visible.
    return this.execute(user, new UnlockAllCanvasNodesAction(this._grabs));
  }

  /**
   * Registers an authorized session or updates its presence and cancels pending idle shutdown.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public addUser(user: CanvasUser): Promise<void> {
    const data: UserData = user.toData();
    this._joiningUsers.add(data);
    return this._interact(user, (): void => {
      if (!this._joiningUsers.has(data)) {
        throw new InvalidStateError('Session left while joining the canvas.');
      }
      const existing: UserData | undefined = this._users.get(data.sessionId);
      if (existing !== undefined && existing.id !== data.id) {
        throw new ConflictError('Session belongs to another user.');
      }
      if (existing === undefined) {
        this._users.set(data.sessionId, data);
        this._emit(
          new CanvasPresenceEvent(
            this._reference.id,
            'joined',
            structuredClone(data),
          ),
        );
      }
    }).finally((): void => {
      this._joiningUsers.delete(data);
    });
  }

  /**
   * Removes a session and its grabs, then schedules idle shutdown when no users remain.
   * @param sessionId - Registered session identity.
   * @returns A promise that settles when the operation completes.
   */
  public removeUser(sessionId: string): Promise<void> {
    return this._interact(null, (): void => {
      for (const joining of this._joiningUsers) {
        if (joining.sessionId === sessionId) {
          this._joiningUsers.delete(joining);
        }
      }
      const user: UserData | undefined = this._users.get(sessionId);
      if (user !== undefined) {
        this._users.delete(sessionId);
        const locks: Record<string, boolean> = DataRecord.empty<boolean>();
        for (const [id, grabs] of this._grabs) {
          if (!grabs.has(sessionId)) {
            continue;
          }
          grabs.delete(sessionId);
          this._interactedNodeIds.add(id);
          const node: NodeData | undefined = this._history.current.nodes.find(
            (entry: NodeData): boolean => entry.id === id,
          );
          if (node !== undefined) {
            locks[id] = node.locked || grabs.size > 0;
          }
        }
        this._updateWorker({}, locks);
        this._emit(
          new CanvasPresenceEvent(
            this._reference.id,
            'left',
            structuredClone(user),
          ),
        );
      }
      if (this._users.size === 0) {
        this.scheduleShutdown();
      }
    });
  }

  /**
   * Validates and updates a registered user’s cursor position.
   * @param user - Trusted identity requesting the operation.
   * @param position - New finite canvas coordinates.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public setCursorPosition(
    user: CanvasUser,
    position: Position | null,
  ): Promise<void> {
    return this._interact(user, (): void => {
      const session: UserData = this._session(user);
      if (
        position !== null &&
        (!Number.isFinite(position.x) || !Number.isFinite(position.y))
      ) {
        throw new InvalidDataError('Cursor must be finite.');
      }
      session.position = structuredClone(position);
      this._emit(
        new CanvasPresenceEvent(
          this._reference.id,
          'cursor',
          structuredClone(session),
        ),
      );
    });
  }

  /**
   * Registers this authorized session as a node grabber; multiple sessions may hold the same node.
   * @param user - Trusted identity requesting the operation.
   * @param nodeId - Canonical identity of the selected node.
   * @returns A promise that settles when the operation completes.
   */
  public grabNode(user: CanvasUser, nodeId: string): Promise<void> {
    return this._interact(user, (): void => {
      const session: UserData = this._session(user);
      new CanvasGraph(this._history.current).getNode(nodeId);
      this._grabs.set(
        nodeId,
        (this._grabs.get(nodeId) ?? new SSet()).byAdding(session.sessionId),
      );
      this._interactedNodeIds.add(nodeId);
      this._updateWorker({}, { [nodeId]: true });
    });
  }

  /**
   * Moves nodes grabbed by the requesting session and updates the worker revision.
   * @param user - Trusted identity requesting the operation.
   * @param positions - New positions indexed by canonical node identity.
   * @returns A promise that settles when the operation completes.
   */
  public moveNodes(
    user: CanvasUser,
    positions: readonly {
      /**
       * Canonical identity of this domain object.
       */
      id: string;

      /**
       * Position in canvas coordinates; null means that no cursor position is available.
       */
      position: Position;
    }[],
  ): Promise<void> {
    return this._interact(user, (): void => {
      const session: UserData = this._session(user);
      const updates: Record<string, Position> = DataRecord.empty<Position>();
      const locks: Record<string, boolean> = DataRecord.empty<boolean>();
      for (const node of positions) {
        if (!(this._grabs.get(node.id)?.has(session.sessionId) ?? false)) {
          continue;
        }
        if (
          !Number.isFinite(node.position.x) ||
          !Number.isFinite(node.position.y)
        ) {
          throw new InvalidDataError('Positions must be finite.');
        }
        const target: NodeData | undefined = this._history.current.nodes.find(
          (entry: NodeData): boolean => entry.id === node.id,
        );
        if (
          target !== undefined &&
          (!target.locked ||
            target.position.x !== node.position.x ||
            target.position.y !== node.position.y)
        ) {
          updates[node.id] = { ...node.position };
          locks[node.id] = true;
        }
      }
      if (Object.keys(updates).length === 0) {
        return;
      }
      // Dragging does not create an undo entry for every pointer event.
      for (const node of this._history.current.nodes) {
        if (Object.hasOwn(updates, node.id)) {
          node.position = { ...updates[node.id] };
          node.locked = true;
          this._interactedNodeIds.add(node.id);
        }
      }
      this._updateWorker(updates, locks, 'short');
      this._emit(
        new CanvasChangedEvent(this._reference.id, ['positions', 'locks']),
      );
    });
  }

  /**
   * Applies the final position, releases the session’s node grab and updates physics.
   * @param user - Trusted identity requesting the operation.
   * @param nodeId - Canonical identity of the selected node.
   * @param position - New finite canvas coordinates.
   * @returns A promise that settles when the operation completes.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public ungrabNode(
    user: CanvasUser,
    nodeId: string,
    position: Position,
  ): Promise<void> {
    return this._interact(user, (): void => {
      const session: UserData = this._session(user);
      const grabs: SSet<string> | undefined = this._grabs.get(nodeId);
      if (!(grabs?.has(session.sessionId) ?? false)) {
        throw new ForbiddenError('Node was not grabbed by this session.');
      }
      const node: ReturnType<CanvasGraph['getNode']> = new CanvasGraph(
        this._history.current,
      ).getNode(nodeId);
      const previous: Position = node.toData().position;
      node.move(position);
      grabs?.delete(session.sessionId);
      this._interactedNodeIds.add(nodeId);
      this._updateWorker(
        { [nodeId]: position },
        { [nodeId]: node.toData().locked || (grabs?.size ?? 0) > 0 },
      );
      this._emit(
        new CanvasChangedEvent(this._reference.id, ['positions', 'locks']),
        previous.x !== position.x || previous.y !== position.y,
      );
    });
  }

  /**
   * Reloads graph-relevant notes and publishes a notes change after checking access.
   * @param user - Trusted identity requesting the operation.
   * @returns A promise that settles when the operation completes.
   */
  public refreshNotes(user: CanvasUser): Promise<void> {
    return this._enqueue('Refresh notes', async (): Promise<void> => {
      const context: CanvasActionContext = new CanvasActionContext(
        this.toData(),
        await this._access(user),
        this._delegates,
      );
      await this._loadNotes(context);
      await this._access(user);
      this._history.current.notes = structuredClone(context.data.graph.notes);
      for (const node of this._history.current.nodes) {
        const updated: NodeData | undefined = context.data.graph.nodes.find(
          (entry: NodeData): boolean => entry.id === node.id,
        );
        node.noteIds = updated?.noteIds ?? [];
      }
      this._updatePhysics();
      this._emit(
        new CanvasChangedEvent(this._reference.id, ['graph', 'notes']),
      );
    });
  }

  /**
   * Executes an authorized room-canvas transaction and publishes its resulting references.
   * @param user - Trusted identity requesting the operation.
   * @param operation - Operation to serialize and execute.
   * @returns The selected or newly created canvas reference, or null when the operation does not select one.
   */
  public changeRoom(
    user: CanvasUser,
    operation: 'create' | 'duplicate' | 'close' | 'closeOthers',
  ): Promise<CanvasReference | null> {
    return this._enqueue(
      'Change room canvases',
      async (): Promise<CanvasReference | null> => {
        const room: RoomData = await this._access(user);
        const change: Awaited<ReturnType<RoomCanvasManager['change']>> =
          await new RoomCanvasManager(room, this._delegates.room).change(
            this._reference.id,
            operation,
            operation === 'duplicate' ? this.toData() : null,
          );
        this._emit(new CanvasRoomEvent(this._reference.id, change.canvases));
        if (operation === 'close') {
          this._closed = true;
          this._state = 'closing';
          this._cancelSaveTimer();
          this._emit(
            new CanvasLifecycleEvent(this._reference.id, 'shouldShutdown'),
          );
        }
        return change.canvas;
      },
    );
  }

  /**
   * Schedules one idle shutdown request when the canvas is ready and has no registered sessions.
   */
  public scheduleShutdown(): void {
    this._idleShutdownRequested = true;
    if (this._state !== 'ready' || this._pending > 0 || this._users.size > 0) {
      return;
    }
    this._cancelShutdownTimer();
    const generation: number = this._shutdownGeneration;
    this._shutdown = {
      handle: this._delegates.runtime.schedule((): void => {
        if (
          generation === this._shutdownGeneration &&
          this._state === 'ready' &&
          this._pending === 0 &&
          this._users.size === 0
        ) {
          this._shutdown = null;
          this._emit(
            new CanvasLifecycleEvent(this._reference.id, 'shouldShutdown'),
          );
        }
      }, 10_000),
    };
  }

  /**
   * Cancels a pending idle shutdown unless the canvas has already been closed or destroyed.
   */
  public cancelShutdown(): void {
    this._idleShutdownRequested = false;
    this._cancelShutdownTimer();
  }

  /**
   * Drains queued work, stops the worker, optionally saves the final state and completes destruction idempotently.
   * @param saveGraph - Whether destruction persists the final canvas snapshot.
   * @returns A promise that settles when the operation completes.
   */
  public destroy(saveGraph: boolean = true): Promise<void> {
    if (this._destroy !== null) {
      return this._destroy;
    }
    const starting: Promise<void> | null = this._start;
    this.cancelShutdown();
    this._cancelSaveTimer();
    const shouldSave: boolean =
      !this._closed &&
      (this._state === 'ready' ||
        this._state === 'closing' ||
        this._state === 'starting');
    this._state = 'closing';
    this._destroy = (async (): Promise<void> => {
      try {
        await starting;
        await this._tail;
        // Freeze incoming positions before taking the final persistence snapshot.
        await this._worker.destroy();
        if (saveGraph && shouldSave && !this._closed) {
          await this._save();
        }
      } finally {
        try {
          await this._worker.destroy();
        } finally {
          this._state = 'destroyed';
          this._users.clear();
          this._joiningUsers.clear();
          this._grabs.clear();
          this._interactedNodeIds.clear();
          this._emit(new CanvasLifecycleEvent(this._reference.id, 'destroyed'));
        }
      }
    })();
    return this._destroy;
  }

  /**
   * Processes accepted worker events while the canvas is ready or closing; the worker controller fences stale revisions.
   * @param event - Domain or worker event to process.
   */
  public onMessage(event: WorkerEvent): void {
    if (this._state !== 'ready' && this._state !== 'closing') {
      return;
    }
    if (event.type === 'error') {
      this.onError(new Error(event.error));
    } else if (event.type === 'stopped') {
      this._emit(
        new CanvasLifecycleEvent(this._reference.id, 'physicsStopped'),
      );
    } else {
      const applied: Record<string, Position> = DataRecord.empty<Position>();
      let changed: boolean = false;
      for (const node of this._history.current.nodes) {
        const position: Position | undefined = event.positions[node.id];
        if (
          Object.hasOwn(event.positions, node.id) &&
          !node.locked &&
          (this._grabs.get(node.id)?.size ?? 0) === 0 &&
          Number.isFinite(position.x) &&
          Number.isFinite(position.y)
        ) {
          changed ||=
            node.position.x !== position.x || node.position.y !== position.y;
          node.position = { ...position };
          applied[node.id] = { ...position };
        }
      }
      if (changed) {
        this._requestSave();
      }
      this._emit(
        new CanvasPhysicsEvent(
          this._reference.id,
          applied,
          structuredClone(event.performance),
        ),
      );
    }
  }

  /**
   * Publishes a worker error without invalidating an already committed canvas mutation.
   * @param error - Failure received from the worker or operation.
   */
  public onError(error: unknown): void {
    this._emit(new CanvasErrorEvent(this._reference.id, error));
  }

  /**
   * Commits one queued action after validating its isolated draft and retaining newer live positions.
   * @param user - Trusted identity requesting the operation.
   * @param action - Single independently committed canvas operation.
   * @returns Completion of this operation.
   */
  private _executeAction(
    user: CanvasUser,
    action: CanvasAction,
  ): Promise<void> {
    return this._enqueue(action.title, async (): Promise<void> => {
      const room: RoomData = await this._access(user);
      this._interactedNodeIds.clear();
      const context: CanvasActionContext = new CanvasActionContext(
        this.toData(),
        room,
        this._delegates,
        this._grabs
          .filter((sessions: SSet<string>): boolean => sessions.size > 0)
          .toKeyArray(),
        this._history.current.nodes,
      );
      await action.apply(context);
      if (action.postProcess) {
        await this._postProcess(context);
      }
      await this._access(user);
      context.finish();
      if (context.title !== null) {
        const change: Awaited<ReturnType<RoomCanvasManager['change']>> =
          await new RoomCanvasManager(room, this._delegates.room).change(
            this._reference.id,
            'rename',
            null,
            context.title,
          );
        this._emit(new CanvasRoomEvent(this._reference.id, change.canvases));
      }
      context.preservePositions(
        this._history.current.nodes,
        this._interactedNodeIds.toArray(),
      );
      const next: CanvasData = context.finish();
      const previous: CanvasData = this.toData();
      const changed: boolean =
        JSON.stringify(previous) !== JSON.stringify(next);
      // Commit once, after the asynchronous draft and authorization checks succeeded.
      if (action.history) {
        this._history.transaction(action.title, (): GraphData => next.graph);
      } else {
        Object.assign(this._history.current, next.graph);
      }
      this._settings = new CanvasViewSettings(next.viewSettings);
      this._pruneGrabs();
      if (action.postProcess) {
        this._updatePhysics(action.physics);
      } else {
        const positions: Record<string, Position> =
          DataRecord.empty<Position>();
        const locks: Record<string, boolean> = DataRecord.empty<boolean>();
        for (const node of next.graph.nodes) {
          const original: NodeData | undefined = previous.graph.nodes.find(
            (entry: NodeData): boolean => entry.id === node.id,
          );
          if (original !== undefined) {
            if (
              original.position.x !== node.position.x ||
              original.position.y !== node.position.y
            ) {
              positions[node.id] = { ...node.position };
            }
            if (original.locked !== node.locked) {
              locks[node.id] =
                node.locked || (this._grabs.get(node.id)?.size ?? 0) > 0;
            }
          }
        }
        this._updateWorker(positions, locks, action.physics);
      }
      this._emit(
        new CanvasChangedEvent(this._reference.id, [
          'graph',
          'metadata',
          'table',
          'notes',
          'viewSettings',
          'histogram',
        ]),
        changed,
      );
      for (const count of context.limits) {
        this._emit(new CanvasLimitEvent(this._reference.id, count));
      }
    });
  }

  /**
   * Invalidates queued shutdown callbacks and cancels the currently scheduled timer.
   */
  private _cancelShutdownTimer(): void {
    this._shutdownGeneration += 1;
    if (this._shutdown !== null) {
      this._delegates.runtime.cancel(this._shutdown.handle);
      this._shutdown = null;
    }
  }

  /**
   * Processes presence and drag interactions independently of queued canvas actions.
   * Authorization may await the host; the state is checked again before synchronously mutating live data.
   * Interactions contribute to idle detection without publishing action progress.
   * @param user - Identity whose current access must be checked, or null for host-driven session removal.
   * @param action - Synchronous live-state mutation to perform after validation.
   * @returns Completion of the interaction, independently of the action queue.
   */
  private async _interact(
    user: CanvasUser | null,
    action: () => void,
  ): Promise<void> {
    if (this._state !== 'ready') {
      throw new InvalidStateError('Canvas is not ready.');
    }
    this._cancelShutdownTimer();
    this._pending += 1;
    try {
      if (user !== null) {
        await this._access(user);
      }
      if (this.state !== 'ready' || this._closed) {
        throw new InvalidStateError('Canvas is not ready.');
      }
      action();
    } catch (error: unknown) {
      if (this.state !== 'destroyed') {
        this.onError(error);
      }
      throw error;
    } finally {
      this._pending -= 1;
      if (
        this._idleShutdownRequested &&
        this._pending === 0 &&
        this._users.size === 0
      ) {
        this.scheduleShutdown();
      }
    }
  }

  /**
   * Serializes work after prior operations and rejects requests once shutdown has begun.
   * @typeParam T - Value or result type preserved by this operation.
   * @param title - Display title to assign.
   * @param action - Polymorphic canvas action or transaction callback to execute.
   * @returns The callback result after preceding queued operations settle.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  private _enqueue<T>(title: string, action: () => Promise<T>): Promise<T> {
    if (this._state !== 'ready') {
      return Promise.reject(new InvalidStateError('Canvas is not ready.'));
    }
    this._cancelShutdownTimer();
    this._pending += 1;
    const operation: Promise<T> = this._tail.then(async (): Promise<T> => {
      this._emit(
        new CanvasProgressEvent(this._reference.id, title, this._pending - 1),
      );
      try {
        if (this._closed) {
          throw new InvalidStateError('Canvas has been closed.');
        }
        return await action();
      } catch (error: unknown) {
        this.onError(error);
        throw error;
      } finally {
        this._pending -= 1;
        this._emit(
          new CanvasProgressEvent(this._reference.id, null, this._pending),
        );
        if (
          this._idleShutdownRequested &&
          this._pending === 0 &&
          this._users.size === 0
        ) {
          this.scheduleShutdown();
        }
      }
    });
    this._tail = operation.then(
      (): void => undefined,
      (): void => undefined,
    );
    return operation;
  }

  /**
   * Loads current room data and checks the requesting identity’s access.
   * @param user - Trusted identity requesting the operation.
   * @returns The current room data after the identity passes authorization.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  private async _access(user: CanvasUser): Promise<RoomData> {
    const room: RoomData = await this._delegates.storage.getRoom(
      this._reference.id,
    );
    if (room.id !== this._reference.roomId) {
      throw new NotFoundError('Canvas does not belong to room.');
    }
    user.requireAccess(room);
    return room;
  }

  /**
   * Checks that a registered session belongs to the requesting identity.
   * @param user - Trusted identity requesting the operation.
   * @returns The registered user model matching this session and identity.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  private _session(user: CanvasUser): UserData {
    const data: UserData = user.toData();
    const session: UserData | undefined = this._users.get(data.sessionId);
    if (session?.id !== data.id) {
      throw new ForbiddenError('Unknown user session.');
    }
    return session;
  }

  /**
   * Rebuilds derived graph data, notes and available scenarios for a completed action draft.
   * @param context - Isolated draft and delegates used by this action.
   * @returns A promise that settles when the operation completes.
   */
  private async _postProcess(context: CanvasActionContext): Promise<void> {
    context.graph.removeDanglingEdges();
    context.graph.merge(
      await this._delegates.storage.getMergeRules(context.room.projectId),
      (): string => this._delegates.runtime.createId(),
    );
    await this._loadNotes(context);
    const groups: ScenarioGroupData[] =
      await this._delegates.storage.getScenarioGroups(context.room.projectId);
    for (const node of context.data.graph.nodes) {
      node.scenarioGroups = groups
        .map((group: ScenarioGroupData): ScenarioGroupData => ({
          ...structuredClone(group),
          scenarios: group.scenarios.filter(
            (scenario: ScenarioGroupData['scenarios'][number]): boolean =>
              scenario.parameters.some(
                (parameter: GraphData['parameters'][number]): boolean =>
                  Object.hasOwn(node.properties, parameter.identifier) &&
                  (parameter.allowedLabels.length === 0 ||
                    node.labels.some((label: string): boolean =>
                      parameter.allowedLabels.includes(label),
                    )),
              ),
          ),
        }))
        .filter(
          (group: ScenarioGroupData): boolean => group.scenarios.length > 0,
        );
    }
  }

  /**
   * Reloads note data and node references without modifying graph topology, settings or positions.
   * @param context - Isolated graph used to resolve relevant notes.
   * @returns Completion of note loading.
   */
  private async _loadNotes(context: CanvasActionContext): Promise<void> {
    context.data.graph.notes = structuredClone(
      await this._delegates.storage.getNotes(
        this._reference.id,
        context.graph.toData(),
      ),
    );
    for (const node of context.data.graph.nodes) {
      node.noteIds = context.data.graph.notes
        .filter(
          (note: GraphData['notes'][number]): boolean =>
            note.nodeIds.includes(node.id) ||
            node.compressedIds.some((id: string): boolean =>
              note.nodeIds.includes(id),
            ),
        )
        .map((note: GraphData['notes'][number]): string => note.id);
    }
  }

  /**
   * Restores a history snapshot and republishes derived state and physics.
   * @param user - Trusted identity requesting the operation.
   * @param direction - History direction to restore: undo or redo.
   * @returns A promise that settles when the operation completes.
   */
  private async _restore(
    user: CanvasUser,
    direction: 'undo' | 'redo',
  ): Promise<void> {
    await this._enqueue(direction, async (): Promise<void> => {
      await this._access(user);
      if (
        direction === 'undo' ? !this.history.canUndo : !this.history.canRedo
      ) {
        return;
      }
      this._history[direction]();
      this._pruneGrabs();
      this._updatePhysics();
      this._emit(
        new CanvasChangedEvent(this._reference.id, [
          'graph',
          'metadata',
          'table',
          'notes',
          'histogram',
        ]),
      );
      await this._save();
    });
  }

  /**
   * Drops grabs referring to nodes removed by the latest graph mutation.
   */
  private _pruneGrabs(): void {
    const ids: string[] = this._history.current.nodes.map(
      (node: NodeData): string => node.id,
    );
    for (const id of this._grabs.keys()) {
      if (!ids.includes(id)) {
        this._grabs.delete(id);
      }
    }
  }

  /**
   * Advances the worker graph revision with the current locks and grabs.
   * @param amount - Requested short or long physics duration policy.
   */
  private _updatePhysics(amount: 'none' | 'short' | 'long' = 'none'): void {
    try {
      this._syncWorker();
      if (amount !== 'none') {
        this._worker.run(amount);
      }
    } catch (error: unknown) {
      this.onError(error);
    }
  }

  /**
   * Publishes position and lock deltas, preserving worker velocities and any active deadline.
   * @param positions - Changed node positions.
   * @param locks - Changed persistent or temporary locks.
   * @param amount - Optional physics duration requested by this interaction.
   */
  private _updateWorker(
    positions: Record<string, Position>,
    locks: Record<string, boolean>,
    amount: 'none' | 'short' | 'long' = 'none',
  ): void {
    try {
      if (Object.keys(positions).length > 0 || Object.keys(locks).length > 0) {
        this._worker.update(positions, locks);
      }
      if (amount !== 'none') {
        this._worker.run(amount);
      }
    } catch (error: unknown) {
      this.onError(error);
    }
  }

  /**
   * Updates the worker and reports transport errors while preserving the committed local state.
   */
  private _syncWorker(): void {
    this._worker.setGraph(
      new CanvasGraph(this._history.current).toPhysicalGraph(
        this._settings,
        this._grabs
          .filter((sessions: SSet<string>): boolean => sessions.size > 0)
          .toKeyArray(),
      ),
    );
  }

  /**
   * Persists a detached snapshot and acknowledges only its captured revision.
   * Changes received during storage remain pending; failures retain the dirty revision.
   * @returns A promise that settles when the operation completes.
   */
  private async _save(): Promise<void> {
    if (this._closed) {
      return;
    }
    this._cancelSaveTimer();
    const revision: number = this._revision;
    try {
      await this._delegates.storage.save(this._reference.id, this.toData());
      this._savedRevision = revision;
    } finally {
      this._scheduleSave();
    }
  }

  /** Marks a committed persistent mutation and requests a bounded save deadline. */
  private _requestSave(): void {
    this._revision += 1;
    this._scheduleSave();
  }

  /**
   * Coalesces mutations for one second without postponing the deadline on every tick.
   * Saves run in the operation queue; failures are reported there and retried later.
   */
  private _scheduleSave(): void {
    if (
      this._state !== 'ready' ||
      this._closed ||
      this._revision === this._savedRevision ||
      this._saveTimer !== null ||
      this._autosavePending
    ) {
      return;
    }
    const generation: number = this._saveGeneration;
    this._saveTimer = {
      handle: this._delegates.runtime.schedule((): void => {
        if (generation !== this._saveGeneration || this._state !== 'ready') {
          return;
        }
        this._saveTimer = null;
        this._autosavePending = true;
        const operation: Promise<void> = this._enqueue(
          'Save canvas',
          async (): Promise<void> => {
            if (
              this._state === 'ready' &&
              this._revision !== this._savedRevision
            ) {
              await this._save();
            }
          },
        );
        const finish: () => void = (): void => {
          this._autosavePending = false;
          this._scheduleSave();
        };
        void operation.then(finish, finish);
      }, 1000),
    };
  }

  /** Cancels the save deadline and invalidates callbacks already queued by the host. */
  private _cancelSaveTimer(): void {
    this._saveGeneration += 1;
    if (this._saveTimer !== null) {
      this._delegates.runtime.cancel(this._saveTimer.handle);
      this._saveTimer = null;
    }
  }

  /**
   * Dispatches an event and retains a bounded list of synchronous observer failures.
   * @param event - Domain or worker event to process.
   * @param persistent - Whether the event represents changed persisted data rather than only history or a transient operation.
   */
  private _emit(event: CanvasEvent, persistent: boolean = true): void {
    if (persistent && event instanceof CanvasChangedEvent) {
      this._requestSave();
    }
    try {
      this._delegates.events.handleEvent(event);
    } catch (error: unknown) {
      this._observerErrors.push(error);
      if (this._observerErrors.length > 100) {
        this._observerErrors.shift();
      }
    }
  }
}
