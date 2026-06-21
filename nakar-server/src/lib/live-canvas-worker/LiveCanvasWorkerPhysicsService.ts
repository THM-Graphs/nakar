import type { MessagePort } from 'node:worker_threads';
import { parentPort } from 'node:worker_threads';
import { PhysicsSimulation } from '../../packages/physics/PhysicsSimulation';
import type { LiveCanvasWorkerData } from './LiveCanvasWorkerData';
import type { WTActionSetGraph } from './worker-events/WTActionSetGraph';
import type { WTAction } from './worker-events/WTAction';
import { match } from 'ts-pattern';
import type { WTEvent } from './worker-events/WTEvent';
import type { WTActionMoveNodes } from './worker-events/WTActionMoveNodes';
import type { PhysicalGraph } from '../../packages/physics/physical-graph/PhysicalGraph';
import type { PhysicalNode } from '../../packages/physics/physical-graph/PhysicalNode';
import type { WTActionTriggerPhysics } from './worker-events/WTActionTriggerPhysics';
import type { WTActionSetLocks } from './worker-events/WTActionSetLocks';
import type { PhysicsSimulationEventSlowTick } from '../../packages/physics/PhysicsSimulationEventSlowTick';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export class LiveCanvasWorkerPhysicsService {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _canvasId: string;
  private readonly _parentPort: MessagePort;
  private readonly _physics: PhysicsSimulation;

  public constructor(data: LiveCanvasWorkerData) {
    this._physics = new PhysicsSimulation({ nodes: {}, edges: {} });
    this._canvasId = data.canvasId;

    if (parentPort == null) {
      throw new Error('No parent port.');
    }
    this._parentPort = parentPort;

    this._registerParentPortMessages();
    this._registerPhysicsEvents();
  }

  public bootstrap(): void {
    this._logger.debug(`Did receive worker data: roomId: ${this._canvasId}.`);
  }

  public destroy(): void {
    this._physics.stop();
    this._parentPort.close();
  }

  private _registerParentPortMessages(): void {
    this._parentPort.on('message', (message: WTAction): void => {
      if (message.type !== 'WTActionMoveNodes') {
        this._logger.debug(`Did receive from parent port: ${message.type}`);
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
              const foundNode: PhysicalNode | null = graph.nodes[movedNode.id];
              if (foundNode == null) {
                this._logger.error(
                  `Client did send moved node, but the node cannot be found in the room. Room: ${this._canvasId}, Node: ${movedNode.id}`,
                );
                continue;
              }

              foundNode.positionX = movedNode.position.x;
              foundNode.positionY = movedNode.position.y;
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
              const node: PhysicalNode | null = graph.nodes[nodeId];
              if (node == null) {
                this._logger.warn(
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
    this._physics.onSlowTick$.subscribe(
      (event: PhysicsSimulationEventSlowTick): void => {
        this._sendEvent({
          type: 'WTEventPhysicsUpdate',
          graph: event.graph,
          performance: event.performance,
        });
      },
    );
    this._physics.onStopped$.subscribe((): void => {
      this._sendEvent({
        type: 'WTEventPhysicsStopped',
      });
    });
    const physicsLogger: Logger = createChildLogger(this._physics);
    this._physics.onLog$.subscribe((message: string): void => {
      physicsLogger.debug(message);
    });
  }

  private _sendEvent(event: WTEvent): void {
    this._parentPort.postMessage(event);
  }
}
