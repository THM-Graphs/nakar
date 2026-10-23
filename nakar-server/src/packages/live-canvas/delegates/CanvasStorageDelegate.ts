import type { CanvasData } from '../data/CanvasData';
import type { GraphData } from '../data/GraphData';
import type { MergeData } from '../data/MergeData';
import type { NoteData } from '../data/NoteData';
import type { RoomData } from '../data/RoomData';
import type { ScenarioData } from '../data/ScenarioData';
import type { ScenarioGroupData } from '../data/ScenarioGroupData';

/**
 * Loads and stores normalized domain data without exposing persistence-specific APIs to the canvas.
 */
export interface CanvasStorageDelegate {
  /**
   * Loads a detached canvas snapshot or returns null when it does not exist.
   * @param canvasId - Canonical identity of the canvas.
   * @returns A detached stored canvas snapshot, or null when no snapshot exists.
   */
  load(canvasId: string): Promise<CanvasData | null>;

  /**
   * Persists a detached snapshot under the requested canvas identity.
   * @param canvasId - Canonical identity of the canvas.
   * @param data - Data object or snapshot used to initialize the operation.
   * @returns A promise that settles when the operation completes.
   */
  save(canvasId: string, data: CanvasData): Promise<void>;

  /**
   * Returns the current authorization and graph-source configuration for the canvas room.
   * @param canvasId - Canonical identity of the canvas.
   * @returns Current room visibility, project membership and permitted source IDs.
   */
  getRoom(canvasId: string): Promise<RoomData>;

  /**
   * Returns notes relevant to the supplied graph.
   * @param canvasId - Canonical identity of the canvas.
   * @param graph - Graph whose data is read or modified.
   * @returns Detached notes relevant to the requested graph.
   */
  getNotes(canvasId: string, graph: GraphData): Promise<NoteData[]>;

  /**
   * Returns the scenario groups offered by the requested project.
   * @param projectId - Identity of the project owning the room or scenario.
   * @returns Detached scenario groups belonging to the requested project.
   */
  getScenarioGroups(projectId: string): Promise<ScenarioGroupData[]>;

  /**
   * Returns the cross-source property-linking rules for the requested project.
   * @param projectId - Identity of the project owning the room or scenario.
   * @returns Detached cross-source property-linking rules for the project.
   */
  getMergeRules(projectId: string): Promise<MergeData[]>;

  /**
   * Returns the normalized scenario definition for the requested identity.
   * @param scenarioId - Scenario identity; null selects the currently active scenario where supported.
   * @returns A detached scenario definition.
   */
  getScenario(scenarioId: string): Promise<ScenarioData>;
}
