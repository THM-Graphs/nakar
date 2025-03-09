import { LoggerService } from '../logger/LoggerService';
import { ApplicationService } from '../../application/ApplicationService';
import { ClassHelper } from '../../tools/ClassHelper';
import { RoomWorkerData } from './RoomWorkerData';
import { MessagePort, parentPort, workerData } from 'node:worker_threads';
import { MutableGraph } from './graph/MutableGraph';
import { WTAction } from './worker-events/WTAction';
import { match } from 'ts-pattern';
import { WTActionGrabNode } from './worker-events/WTActionGrabNode';
import { MutableNode } from './graph/MutableNode';
import { PhysicsSimulation } from '../../tools/physics/PhysicsSimulation';
import { WTActionMoveNodes } from './worker-events/WTActionMoveNodes';
import { WTActionUngrabNode } from './worker-events/WTActionUngrabNode';
import { WTActionSetGraph } from './worker-events/WTActionSetGraph';
import { WTEvent } from './worker-events/WTEvent';

export class RoomWorker implements ApplicationService {
  private readonly _logger: LoggerService;

  private readonly _services: ApplicationService[];
  private readonly _roomId: string;
  private readonly _parentPort: MessagePort;
  private _physics: PhysicsSimulation;

  public constructor(data: RoomWorkerData) {
    this._logger = new LoggerService();

    this._physics = new PhysicsSimulation(
      MutableGraph.fromPlain(data.graph),
      this._logger,
    );
    this._roomId = data.roomId;

    this._services = [this._logger];

    if (parentPort == null) {
      throw new Error('No parent port.');
    }
    this._parentPort = parentPort;

    this._registerParentPortMessages();
    this._registerPhysicsEvents();
  }

  public async bootstrap(): Promise<void> {
    this._logger.debug(this, 'Will bootstrap services...');
    for (const service of this._services) {
      this._logger.log(
        this,
        `Bootstrap Service ${ClassHelper.getName(service)}`,
      );
      await service.bootstrap();
    }

    this._logger.debug(
      this,
      `Did receive worker data: roomId: ${this._roomId},  ${this._physics.getGraph().size.toString()} graph elements.`,
    );
  }

  public async destroy(): Promise<void> {
    this._logger.debug(this, 'Will destroy services...');
    for (const service of this._services.toReversed()) {
      this._logger.log(this, `Destroy Service ${ClassHelper.getName(service)}`);
      await service.destroy();
    }
    this._parentPort.close();
  }

  private _handleGrabNode(action: WTActionGrabNode): void {
    const node: MutableNode | undefined = this._physics
      .getGraph()
      .nodes.get(action.nodeId);
    if (node == null) {
      this._logger.error(this, `Cannot find node to grab: ${action.nodeId}.`);
      return;
    }
    if (node.grabs.has(action.userId)) {
      this._logger.warn(
        this,
        `Cannot grab node: Node ${action.nodeId} already grabbed by ${action.userId}`,
      );
      return;
    }

    node.grabs.add(action.userId);
    this._logger.debug(
      this,
      `${action.userId} did grab node: ${action.nodeId}`,
    );
    node.locked = true;
    this._physics.start();
  }

  private _handleMoveNodes(action: WTActionMoveNodes): void {
    const graph: MutableGraph = this._physics.getGraph();

    for (const movedNode of action.nodes) {
      const foundNode: MutableNode | undefined = graph.nodes.get(movedNode.id);
      if (foundNode == null) {
        this._logger.error(
          this,
          `Client did send moved node, but the node cannot be found in the room. Room: ${this._roomId}, Node: ${movedNode.id}`,
        );
        continue;
      }
      if (!foundNode.grabs.has(action.userId)) {
        this._logger.error(
          this,
          `Cannot move node ${movedNode.id} that has not been grabbed by user ${action.userId}`,
        );
        continue;
      }

      foundNode.position.x = movedNode.position.x;
      foundNode.position.y = movedNode.position.y;
    }
  }

  private _handleUngrabNode(action: WTActionUngrabNode): void {
    const node: MutableNode | undefined = this._physics
      .getGraph()
      .nodes.get(action.nodeId);
    if (node == null) {
      this._logger.error(this, `Cannot find node to lock: ${action.nodeId}.`);
      return;
    }
    if (!node.grabs.has(action.userId)) {
      this._logger.warn(
        this,
        `Cannot ungrab node: Node ${action.nodeId} has no grab by ${action.userId}`,
      );
      return;
    }

    this._physics.stop();
    node.grabs.delete(action.userId);
    this._logger.debug(
      this,
      `${action.userId} did ungrab node: ${action.nodeId}`,
    );
  }

  private _handleSetGraph(action: WTActionSetGraph): void {
    this._physics.setGraph(MutableGraph.fromPlain(action.graph));
  }

  private _registerParentPortMessages(): void {
    this._parentPort.on('message', (message: WTAction): void => {
      // this._logger.debug(this, message.type);
      match(message)
        .with(
          { type: 'WTActionGrabNode' },
          (action: WTActionGrabNode): void => {
            this._handleGrabNode(action);
          },
        )
        .with(
          { type: 'WTActionMoveNodes' },
          (action: WTActionMoveNodes): void => {
            this._handleMoveNodes(action);
          },
        )
        .with(
          { type: 'WTActionUngrabNode' },
          (action: WTActionUngrabNode): void => {
            this._handleUngrabNode(action);
          },
        )
        .with(
          { type: 'WTActionSetGraph' },
          (action: WTActionSetGraph): void => {
            this._handleSetGraph(action);
          },
        )
        .exhaustive();
    });
  }

  private _registerPhysicsEvents(): void {
    this._physics.onSlowTick.subscribe((): void => {
      this._sendEvent({
        type: 'WTEventPhysicsUpdate',
        graph: this._physics.getGraph().toPlain(),
      });
    });
  }

  private _sendEvent(event: WTEvent): void {
    this._parentPort.postMessage(event);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const roomWorker: RoomWorker = new RoomWorker(workerData as RoomWorkerData);
void roomWorker.bootstrap();
