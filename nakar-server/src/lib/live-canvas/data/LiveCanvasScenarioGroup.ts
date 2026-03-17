import { LiveCanvasScenario } from './LiveCanvasScenario';
import z from 'zod';

export class LiveCanvasScenarioGroup {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    title: z.string(),
    scenarios: z.array(LiveCanvasScenario.schema),
  });

  public readonly id: string;
  public readonly title: string;
  public readonly scenarios: LiveCanvasScenario[];

  public constructor(data: {
    id: string;
    title: string;
    scenarios: LiveCanvasScenario[];
  }) {
    this.id = data.id;
    this.title = data.title;
    this.scenarios = data.scenarios;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasScenarioGroup.schema>,
  ): LiveCanvasScenarioGroup {
    return new LiveCanvasScenarioGroup({
      id: data.id,
      title: data.title,
      scenarios: data.scenarios.map(
        (s: z.infer<typeof LiveCanvasScenario.schema>): LiveCanvasScenario =>
          LiveCanvasScenario.fromPlain(s),
      ),
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasScenarioGroup.schema> {
    return {
      id: this.id,
      title: this.title,
      scenarios: this.scenarios.map(
        (s: LiveCanvasScenario): z.infer<typeof LiveCanvasScenario.schema> =>
          s.toPlain(),
      ),
    };
  }

  public copy(): LiveCanvasScenarioGroup {
    return new LiveCanvasScenarioGroup({
      id: this.id,
      title: this.title,
      scenarios: this.scenarios.map(
        (s: LiveCanvasScenario): LiveCanvasScenario => s.copy(),
      ),
    });
  }
}
