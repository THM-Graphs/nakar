import { MutableGraph } from '../graph/MutableGraph';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { DatabaseService } from '../../database/DatabaseService';
import { Neo4jLoginCredentials } from '../../neo4j/Neo4jLoginCredentials';
import { Neo4jService } from '../../neo4j/Neo4jService';
import { LoggerService } from '../../logger/LoggerService';
import { FinalGraphDisplayConfiguration } from './display-configuration/FinalGraphDisplayConfiguration';
import { GetDatabaseDBDTO } from '../../database/dto/GetDatabaseDBDTO';
import { ProfilerService } from '../../profiler/ProfilerService';
import { GetScenarioGroupDBDTO } from '../../database/dto/GetScenarioGroupDBDTO';

export class ScenarioPipelineState {
  public readonly database: DatabaseService;
  public readonly neo4j: Neo4jService;
  public readonly logger: LoggerService;
  public readonly profiler: ProfilerService;
  public readonly scenarioId: string;

  private _stepCounter: number;
  private _pipelineSummary: [string, number][];
  private _graph: MutableGraph | null;
  private _scenario: GetScenarioDBDTO | null;
  private _credentials: Neo4jLoginCredentials | null;
  private _displayConfiguration: FinalGraphDisplayConfiguration | null;

  public constructor(
    scenarioId: string,
    database: DatabaseService,
    neo4j: Neo4jService,
    logger: LoggerService,
    profiler: ProfilerService,
  ) {
    this.database = database;
    this.neo4j = neo4j;
    this.logger = logger;
    this.profiler = profiler;
    this.scenarioId = scenarioId;

    this._stepCounter = 0;
    this._pipelineSummary = [];
    this._graph = null;
    this._scenario = null;
    this._credentials = null;
    this._displayConfiguration = null;
  }

  public get stepCounter(): number {
    return this._stepCounter;
  }

  public get pipelineSummary(): [string, number][] {
    return this._pipelineSummary;
  }

  public get graph(): MutableGraph {
    if (this._graph == null) {
      throw new Error('Unable to read graph from scenario pipeline.');
    }
    return this._graph;
  }

  public get scenarioDBDTO(): GetScenarioDBDTO {
    if (this._scenario == null) {
      throw new Error('Unable to read scenario db dto from scenario pipeline.');
    }
    return this._scenario;
  }

  public get scenarioGroupDBDTO(): GetScenarioGroupDBDTO {
    if (this._scenario?.scenarioGroup == null) {
      throw new Error(
        'Unable to read scenario group db dto from scenario pipeline.',
      );
    }
    return this._scenario.scenarioGroup;
  }

  public get databaseDBDTO(): GetDatabaseDBDTO {
    if (this._scenario?.scenarioGroup?.database == null) {
      throw new Error('Unable to read database db dto from scenario pipeline.');
    }
    return this._scenario.scenarioGroup.database;
  }

  public get credentials(): Neo4jLoginCredentials {
    if (this._credentials == null) {
      throw new Error(
        'Unable to read nei4j credentials from scenario pipeline.',
      );
    }
    return this._credentials;
  }

  public get displayConfiguration(): FinalGraphDisplayConfiguration {
    if (this._displayConfiguration == null) {
      throw new Error(
        'Unable to read display configuration from scenario pipeline.',
      );
    }
    return this._displayConfiguration;
  }

  public set stepCounter(value: number) {
    this._stepCounter = value;
  }

  public set pipelineSummary(value: [string, number][]) {
    this._pipelineSummary = value;
  }

  public set graph(value: MutableGraph) {
    this._graph = value;
  }

  public set scenarioDBDTO(value: GetScenarioDBDTO) {
    this._scenario = value;
  }

  public set credentials(value: Neo4jLoginCredentials) {
    this._credentials = value;
  }

  public set displayConfiguration(value: FinalGraphDisplayConfiguration) {
    this._displayConfiguration = value;
  }
}
