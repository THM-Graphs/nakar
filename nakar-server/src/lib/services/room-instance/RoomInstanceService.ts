import { ApplicationService } from '../../application/ApplicationService';
import { LoggerService } from '../logger/LoggerService';
import { ProfilerService } from '../profiler/ProfilerService';
import { MessagePort, parentPort } from 'node:worker_threads';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';
import { RoomWorkerData } from './RoomWorkerData';
import { WTActionSetGraph } from './worker-events/WTActionSetGraph';
import { WTAction } from './worker-events/WTAction';
import { match } from 'ts-pattern';
import { WTEvent } from './worker-events/WTEvent';
import { WTActionMoveNodes } from './worker-events/WTActionMoveNodes';
import { PhysicalGraph } from '../../tools/physics/physical-graph/PhysicalGraph';
import { PhysicalNode } from '../../tools/physics/physical-graph/PhysicalNode';
import { WTActionLockNode } from './worker-events/WTActionLockNode';
import { WTActionTriggerPhysics } from './worker-events/WTActionTriggerPhysics';

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
      // this._logger.debug(this, message.type);
      match(message)
        .with(
          { type: 'WTActionSetGraph' },
          (action: WTActionSetGraph): void => {
            this._logger.debug(this, 'WTActionSetGraph');
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

            void this._physics.run({ maxMs: PhysicsSimulation.cooldownTime });
          },
        )
        .with(
          { type: 'WTActionLockNode' },
          (action: WTActionLockNode): void => {
            this._logger.debug(this, 'WTActionLockNode');
            const graph: PhysicalGraph = this._physics.getGraph();
            graph.nodes[action.nodeId].locked = true;
          },
        )
        .with({ type: 'WTActionTriggerPhysics' }, (): void => {
          void this._physics.run({ maxMs: PhysicsSimulation.cooldownTime });
        })
        .exhaustive();
    });
  }

  private _registerPhysicsEvents(): void {
    this._physics.onSlowTick.subscribe((): void => {
      this._sendEvent({
        type: 'WTEventPhysicsUpdate',
        graph: this._physics.getGraph(),
      });
    });
  }

  private _sendEvent(event: WTEvent): void {
    this._parentPort.postMessage(event);
  }
}
