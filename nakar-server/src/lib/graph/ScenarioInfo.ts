import { DBScenario } from '../documents/collection-types/DBScenario';
import z from 'zod';

export class ScenarioInfo {
  public static schema = z.object({
    id: z.string(),
    title: z.string().nullable(),
  });

  public id: string;
  public title: string | null;

  public constructor(data: { id: string; title: string | null }) {
    this.id = data.id;
    this.title = data.title;
  }

  public static create(scenario: DBScenario): ScenarioInfo {
    return new ScenarioInfo({
      id: scenario.documentId,
      title: scenario.title,
    });
  }

  public static empty(): ScenarioInfo {
    return new ScenarioInfo({
      id: '',
      title: null,
    });
  }

  public static fromPlain(
    scenarioInfo: z.infer<typeof ScenarioInfo.schema>,
  ): ScenarioInfo {
    return new ScenarioInfo({
      id: scenarioInfo.id,
      title: scenarioInfo.title,
    });
  }

  public toPlain(): z.infer<typeof ScenarioInfo.schema> {
    return {
      id: this.id,
      title: this.title,
    };
  }
}
