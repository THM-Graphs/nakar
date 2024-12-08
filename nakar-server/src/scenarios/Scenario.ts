import { GraphDto } from '../model/GraphDto';
import { Neo4jService } from '../neo4j/neo4j.service';

export abstract class Scenario {
  public title: string;

  protected constructor(title: string) {
    this.title = title;
  }

  public abstract process(neo4jService: Neo4jService): Promise<GraphDto>;
}
