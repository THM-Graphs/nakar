import z from 'zod';

export class LiveCanvasScenario {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    title: z.string().nullable(),
  });

  public readonly id: string;
  public readonly title: string | null;

  public constructor(data: { id: string; title: string | null }) {
    this.id = data.id;
    this.title = data.title;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasScenario.schema>,
  ): LiveCanvasScenario {
    return new LiveCanvasScenario({
      id: data.id,
      title: data.title,
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasScenario.schema> {
    return {
      id: this.id,
      title: this.title,
    };
  }

  public copy(): LiveCanvasScenario {
    return new LiveCanvasScenario({
      id: this.id,
      title: this.title,
    });
  }
}
