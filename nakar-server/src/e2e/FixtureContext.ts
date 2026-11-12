import type { RoomVisibilityDto } from '../lib/schema/dtos/RoomVisibilityDto';
import type { E2ETestApplicationUser } from './E2ETestApplicationUser';
import type { E2ETestCanvas } from './E2ETestManager';

export interface FixtureContext {
  owner: E2ETestApplicationUser;
  collaborator: E2ETestApplicationUser;
  outsider: E2ETestApplicationUser;
  projectId: string;
  canvases: Record<RoomVisibilityDto, E2ETestCanvas>;
  databaseConnectionId: string;
  sparqlConnectionId: string;
  nodeConfigurationId: string;
  commonPropertyId: string;
  scenarioGroupId: string;
  scenarioId: string;
  queryId: string;
  queryParameterId: string;
  postScenarioActionId: string;
  noteId: string;
  nodeReferenceId: string;
  nodeId: string;
}
