import { Scenario } from './Scenario';
import { Neo4jService } from '../neo4j/neo4j.service';
import { GraphDto } from '../model/GraphDto';

export class TestScenario1 extends Scenario {
  constructor() {
    super('Test Scenario 1');
  }

  async process(neo4jService: Neo4jService): Promise<GraphDto> {
    const result: GraphDto = await neo4jService.executeQuery(
      `MATCH (p:Person) WHERE p.name = "Philip" AND p.surname = "Scott" MATCH (p)-[r]->(neighbor) RETURN p, r, neighbor`,
    );

    return result;
  }
}
