import { ForbiddenError } from '../error/ForbiddenError';
import type { CanvasData } from '../data/CanvasData';
import type { QueryResult } from '../data/QueryResult';
import type { RoomData } from '../data/RoomData';
import type { CanvasDelegates } from '../delegates/CanvasDelegates';
import type { GraphRequest } from '../delegates/GraphRequest';
import { CanvasGraph } from '../graph/CanvasGraph';
import { CanvasViewSettings } from '../view-settings/CanvasViewSettings';

/**
 * Holds one isolated action draft. LiveCanvas publishes the draft only after successful execution and postprocessing.
 */
export class CanvasActionContext {
  /**
   * Graph model referencing the isolated draft.
   */
  public readonly graph: CanvasGraph;

  /**
   * Returned element counts for source operations that reached a limit.
   */
  public readonly limits: number[] = [];

  /**
   * Optional canvas title proposed by this action.
   */
  public title: string | null = null;

  /**
   * Validated visualization model for the current draft.
   */
  public settings: CanvasViewSettings;

  /**
   * function Object() { [native code] }
   * @param data - Data object or snapshot used to initialize the operation.
   * @param room - Current room access and project membership data.
   * @param delegates - Host implementations of the external canvas boundaries.
   * @param grabbedNodeIds - Node identities temporarily held by user sessions.
   */
  public constructor(
    public readonly data: CanvasData,
    public readonly room: RoomData,
    public readonly delegates: CanvasDelegates,
    public readonly grabbedNodeIds: readonly string[] = [],
  ) {
    this.graph = new CanvasGraph(data.graph);
    this.settings = new CanvasViewSettings(data.viewSettings);
  }

  /**
   * Checks source membership and delegates a detached normalized graph request.
   * @param sourceId - Identity of the graph source used for the operation.
   * @param request - Normalized operation forwarded to the source.
   * @returns The normalized graph-source result after the membership check succeeds.
   * @throws {@link error/CanvasError!CanvasError | CanvasError} When the input, lifecycle state or permissions do not satisfy this operation’s requirements.
   */
  public async request(
    sourceId: string,
    request: GraphRequest,
  ): Promise<QueryResult> {
    if (!this.room.sourceIds.includes(sourceId)) {
      throw new ForbiddenError('Graph source does not belong to the project.');
    }
    return await this.delegates.source.execute(
      sourceId,
      structuredClone(request),
    );
  }

  /**
   * Validates view settings and returns the completed draft snapshot.
   * @returns A detached graph and visualization snapshot of the validated draft.
   */
  public finish(): CanvasData {
    this.settings.validate();
    return { graph: this.graph.toData(), viewSettings: this.settings.toData() };
  }
}
