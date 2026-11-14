import { TestHarness } from './TestHarness.test';
import type { CanvasData } from '../data/CanvasData';
import type { MergeData } from '../data/MergeData';
import type { NoteData } from '../data/NoteData';
import type { RoomData } from '../data/RoomData';
import type { ScenarioData } from '../data/ScenarioData';
import type { ScenarioGroupData } from '../data/ScenarioGroupData';
import type { CanvasStorageDelegate } from '../delegates/CanvasStorageDelegate';

export class MockStorageDelegate implements CanvasStorageDelegate {
  public data: CanvasData | null = TestHarness.canvasData();

  public room: RoomData = {
    id: 'room',
    projectId: 'project',
    visibility: 'private',
    ownerId: 'owner',
    collaboratorIds: ['collaborator'],
    sourceIds: ['source', 'other'],
  };

  public notes: NoteData[] = [];

  public groups: ScenarioGroupData[] = [];

  public rules: MergeData[] = [];

  public scenario: ScenarioData = {
    id: 'scenario',
    projectId: 'project',
    title: 'Scenario',
    parameters: [],
    queries: [{ sourceId: 'source', query: 'query', isTableQuery: false }],
    actions: [],
  };

  public saves: CanvasData[] = [];

  public savedCanvasIds: string[] = [];

  public loadError: Error | null = null;

  public saveError: Error | null = null;

  public notesError: Error | null = null;

  public loadGate: Promise<void> = Promise.resolve();

  public async load(): Promise<CanvasData | null> {
    await this.loadGate;
    if (this.loadError !== null) {
      throw this.loadError;
    }
    return structuredClone(this.data);
  }

  public save(id: string, data: CanvasData): Promise<void> {
    if (this.saveError !== null) {
      return Promise.reject(this.saveError);
    }
    this.saves.push(structuredClone(data));
    this.savedCanvasIds.push(id);
    return Promise.resolve();
  }

  public getRoom(): Promise<RoomData> {
    return Promise.resolve(structuredClone(this.room));
  }

  public getNotes(): Promise<NoteData[]> {
    return this.notesError === null
      ? Promise.resolve(structuredClone(this.notes))
      : Promise.reject(this.notesError);
  }

  public getScenarioGroups(): Promise<ScenarioGroupData[]> {
    return Promise.resolve(structuredClone(this.groups));
  }

  public getMergeRules(): Promise<MergeData[]> {
    return Promise.resolve(structuredClone(this.rules));
  }

  public getScenario(): Promise<ScenarioData> {
    return Promise.resolve(structuredClone(this.scenario));
  }
}
