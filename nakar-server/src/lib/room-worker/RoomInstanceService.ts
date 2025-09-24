import type { ApplicationService } from '../application/ApplicationService';
import type { LoggerService } from '../logger/LoggerService';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { MessagePort} from 'node:worker_threads';
import { parentPort } from 'node:worker_threads';
import { PhysicsSimulation } from '../physics/PhysicsSimulation';
import type { RoomWorkerData } from './RoomWorkerData';
import type { WTActionSetGraph } from './worker-events/WTActionSetGraph';
import type { WTAction } from './worker-events/WTAction';
import { match } from 'ts-pattern';
import type { WTEvent } from './worker-events/WTEvent';
import type { WTActionMoveNodes } from './worker-events/WTActionMoveNodes';
import type { PhysicalGraph } from '../physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../physics/physical-graph/PhysicalNode';
import type { WTActionTriggerPhysics } from './worker-events/WTActionTriggerPhysics';
import type { WTActionSetLocks } from './worker-events/WTActionSetLocks';
import type { SchemaPhysicsPerformance } from '../../../src-gen/schema';

export class RoomInstanceService implements ApplicationService {
  private readonly _roomId: string;
  private readonly _parentPort: MessagePort;
  private readonly _physics: PhysicsSimulation;

  public constructor(
    data: RoomWorkerData,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._physics = new PhysicsSimulation(
      data.graph,
      this._logger,
      this._profiler,
    );
    this._roomId = data.roomId;

    if (parentPort == null) {
      throw new Error('No parent port.');
    }
    this._parentPort = parentPort;

    this._registerParentPortMessages();
    this._registerPhysicsEvents();
  }

  public bootstrap(): void {
    this._logger.debug(
      this,
      `Did receive worker data: roomId: ${this._roomId}.`,
    );
  }

  public destroy(): void {
    this._physics.stop();
    this._parentPort.close();
  }

  private _registerParentPortMessages(): void {
    this._parentPort.on('message', (message: WTAction): void => {
      if (message.type !== 'WTActionMoveNodes') {
        this._logger.debug(
          this,
          `Did receive from parent port: ${message.type}`,
        );
      }
      match(message)
        .with(
          { type: 'WTActionSetGraph' },
          (action: WTActionSetGraph): void => {
            this._physics.setGraph(action.graph);
          },
        )
        .with(
          { type: 'WTActionMoveNodes' },
          (action: WTActionMoveNodes): void => {
            const graph: PhysicalGraph = this._physics.getGraph();

            for (const movedNode of action.nodes) {
              const foundNode: PhysicalNode | null = graph.nodes[
                movedNode.id
              ] as PhysicalNode | null;
              if (foundNode == null) {
                this._logger.error(
                  this,
                  `Client did send moved node, but the node cannot be found in the room. Room: ${this._roomId}, Node: ${movedNode.id}`,
                );
                continue;
              }

              foundNode.position.x = movedNode.position.x;
              foundNode.position.y = movedNode.position.y;
            }

            if (action.runShortPhysics) {
              void this._physics.run({ maxMs: PhysicsSimulation.cooldownTime });
            }
          },
        )
        .with(
          { type: 'WTActionTriggerPhysics' },
          (action: WTActionTriggerPhysics): void => {
            const shortDuration: number = 1000;
            void this._physics.run({
              maxMs:
                action.amount === 'short' ? shortDuration : shortDuration * 4,
            });
          },
        )
        .with(
          { type: 'WTActionSetLocks' },
          (action: WTActionSetLocks): void => {
            const graph: PhysicalGraph = this._physics.getGraph();
            for (const lock of Object.entries(action.locks)) {
              const nodeId: string = lock[0];
              const locked: boolean = lock[1];
              const node: PhysicalNode | null = graph.nodes[
                nodeId
              ] as PhysicalNode | null;
              if (node == null) {
                this._logger.warn(
                  this,
                  `Unable to apply lock to node ${nodeId}. Node does not exist.`,
                );
                continue;
              }
              node.locked = locked;
            }
          },
        )
        .exhaustive();
    });
  }

  private _registerPhysicsEvents(): void {
    this._physics.onSlowTick$.subscribe((): void => {
      this._sendEvent({
        type: 'WTEventPhysicsUpdate',
        graph: this._physics.getGraph(),
      });
    });
    this._physics.onPerformanceChanged$.subscribe(
      (performance: SchemaPhysicsPerformance | null): void => {
        this._sendEvent({
          type: 'WTEventPerformanceChanged',
          performance: performance,
        });
      },
    );
  }

  private _sendEvent(event: WTEvent): void {
    this._parentPort.postMessage(event);
  }
}
