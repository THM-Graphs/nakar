import z from 'zod';

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

  public static fromPlain(
    scenarioInfo: z.infer<typeof MutableScenarioInfo.schema>,
  ): MutableScenarioInfo {
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
}
