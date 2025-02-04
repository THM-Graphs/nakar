import { DBScenario } from '../documents/collection-types/DBScenario';
import z from 'zod';
import { SchemaScenarioInfo } from '../../../src-gen/schema';

export class MutableScenarioInfo {
  // eslint-disable-next-line @typescript-eslint/typedef
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

  public static create(scenario: DBScenario): MutableScenarioInfo {
    return new MutableScenarioInfo({
      id: scenario.documentId,
      title: scenario.title,
    });
  }

  public static empty(): MutableScenarioInfo {
    return new MutableScenarioInfo({
      id: '',
      title: null,
    });
  }

  public static fromPlain(scenarioInfo: z.infer<typeof MutableScenarioInfo.schema>): MutableScenarioInfo {
    return new MutableScenarioInfo({
      id: scenarioInfo.id,
      title: scenarioInfo.title,
    });
  }

  public toPlain(): z.infer<typeof MutableScenarioInfo.schema> {
    return {
      id: this.id,
      title: this.title,
    };
  }

  public toDto(): SchemaScenarioInfo {
    return {
      id: this.id,
      title: this.title,
    };
  }
}
