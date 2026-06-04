import z from 'zod';

export class LiveCanvasNoteNodeReference {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    sourceId: z.string(),
    nativeId: z.string(),
    title: z.string(),
    labels: z.array(z.string()),
  });

  public readonly id: string;
  public readonly sourceId: string;
  public readonly nativeId: string;
  public readonly title: string;
  public readonly labels: string[];

  public constructor(data: {
    id: string;
    sourceId: string;
    nativeId: string;
    title: string;
    labels: string[];
  }) {
    this.id = data.id;
    this.sourceId = data.sourceId;
    this.nativeId = data.nativeId;
    this.title = data.title;
    this.labels = data.labels;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasNoteNodeReference.schema>,
  ): LiveCanvasNoteNodeReference {
    return new LiveCanvasNoteNodeReference({
      id: data.id,
      sourceId: data.sourceId,
      nativeId: data.nativeId,
      title: data.title,
      labels: data.labels,
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasNoteNodeReference.schema> {
    return {
      id: this.id,
      sourceId: this.sourceId,
      nativeId: this.nativeId,
      title: this.title,
      labels: this.labels,
    };
  }

  public copy(): LiveCanvasNoteNodeReference {
    return new LiveCanvasNoteNodeReference({
      id: this.id,
      sourceId: this.sourceId,
      nativeId: this.nativeId,
      title: this.title,
      labels: [...this.labels],
    });
  }
}
