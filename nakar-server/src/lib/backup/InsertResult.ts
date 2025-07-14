import { SMap } from '../tools/Map';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';

export class InsertResult {
  public readonly insertedDatabases: SMap<string, GetDatabaseDBDTO>;
  public readonly insertedScenarioGroups: SMap<string, GetScenarioGroupDBDTO>;
  public readonly insertedScenarios: SMap<string, GetScenarioDBDTO>;
  public readonly errors: unknown[];

  public constructor() {
    this.insertedDatabases = new SMap();
    this.insertedScenarioGroups = new SMap();
    this.insertedScenarios = new SMap();
    this.errors = [];
  }
}
