import { Observable, Subject } from 'rxjs';
import { MutableGraph } from '../graph/MutableGraph';
import { DocumentsDatabase } from '../documents/DocumentsDatabase';
import { DBScenario } from '../documents/collection-types/DBScenario';
import { FinalGraphDisplayConfiguration } from '../graph/display-configuration/FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../neo4j/Neo4jDatabase';
import { ScenarioPipelineStep } from './ScenarioPipelineStep';
import { LoadScenario } from './pipeline-steps/LoadScenario';
import { DBDatabase } from '../documents/collection-types/DBDatabase';
import { ExecuteInitialQuery } from './pipeline-steps/ExecuteInitialQuery';
import { CollectGraphDisplayConfiguration } from './pipeline-steps/CollectDisplayConfiguration';
import { DBScenarioGroup } from '../documents/collection-types/DBScenarioGroup';
import { CreateDatabaseConnection } from './pipeline-steps/CreateDatabaseConnection';
import { ApplyEdgeParallelCounts } from './pipeline-steps/ApplyEdgeParallelCounts';
import { ApplyLabels } from './pipeline-steps/ApplyLabels';
import { ApplyNodeBackgroundColor } from './pipeline-steps/ApplyNodeBackgroundColor';
import { ApplyNodeDegrees } from './pipeline-steps/ApplyNodeDegrees';
import { ApplyNodeDisplayText } from './pipeline-steps/ApplyNodeDisplayText';
import { ApplyNodeRadius } from './pipeline-steps/ApplyNodeRadius';
import { CompressRelationships } from './pipeline-steps/CompressRelationships';
import { ConnectNodes } from './pipeline-steps/ConnectNodes';
import { Layout } from './pipeline-steps/ForceSimulation';
import { GrowNodeBasedOnDegree } from './pipeline-steps/GrowNodeBasedOnDegree';
import { Profiler } from '../profile/Profiler';
import { ProfilerTask } from '../profile/ProfilerTask';

export class ScenarioPipeline {
  private _onStep: Subject<[string, number]>;
  private _database: DocumentsDatabase;
  private readonly _stepCount: number = 14;
  private _stepCounter: number;

  public constructor(database: DocumentsDatabase) {
    this._onStep = new Subject();
    this._database = database;
    this._stepCounter = 0;
  }

  public get onStep$(): Observable<[string, number]> {
    return this._onStep.asObservable();
  }

  public async run(
    roomId: string,
    scenarioId: string,
  ): Promise<[MutableGraph, DBScenario]> {
    this._stepCounter = 0;

    const [scenario, query, database, scenarioGroup]: [
      DBScenario,
      string,
      DBDatabase,
      DBScenarioGroup,
    ] = await this._runStep(new LoadScenario(this._database, scenarioId));
    const neo4jDatabase: Neo4jDatabase = await this._runStep(
      new CreateDatabaseConnection(database),
    );
    const graph: MutableGraph = await this._runStep(
      new ExecuteInitialQuery(query, neo4jDatabase, scenario),
    );
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._runStep(
        new CollectGraphDisplayConfiguration(database, scenario, scenarioGroup),
      );

    await this._runStep(
      new ConnectNodes(graph, displayConfiguration, neo4jDatabase),
    );
    await this._runStep(new CompressRelationships(graph, displayConfiguration));
    await this._runStep(new ApplyLabels(graph));
    await this._runStep(new ApplyNodeDegrees(graph));
    await this._runStep(new ApplyEdgeParallelCounts(graph));
    await this._runStep(new ApplyNodeDisplayText(graph, displayConfiguration));
    await this._runStep(new ApplyNodeRadius(graph, displayConfiguration));
    await this._runStep(
      new ApplyNodeBackgroundColor(graph, displayConfiguration),
    );
    await this._runStep(new GrowNodeBasedOnDegree(graph, displayConfiguration));
    await this._runStep(new Layout(graph));

    return [graph, scenario];
  }

  private async _runStep<T>(step: ScenarioPipelineStep<T>): Promise<T> {
    this._onStep.next([step.title, this._stepCounter / this._stepCount]);
    this._stepCounter += 1;
    const profilerTask: ProfilerTask = Profiler.shared.profile(step.title);
    try {
      const result: T = await step.run();
      profilerTask.finish();
      return result;
    } catch (error: unknown) {
      profilerTask.finish();
      throw error;
    }
  }
}
