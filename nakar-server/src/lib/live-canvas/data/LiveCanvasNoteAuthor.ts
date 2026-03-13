import z from 'zod';

export class LiveCanvasNoteAuthor {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    id: z.string(),
    username: z.string().nullable(),
  });

  public readonly id: string;
  public readonly username: string | null;

  public constructor(data: { id: string; username: string | null }) {
    this.id = data.id;
    this.username = data.username;
  }

  public static fromPlain(
    data: z.infer<typeof LiveCanvasNoteAuthor.schema>,
  ): LiveCanvasNoteAuthor {
    return new LiveCanvasNoteAuthor({
      id: data.id,
      username: data.username,
    });
  }

  public toPlain(): z.infer<typeof LiveCanvasNoteAuthor.schema> {
    return new LiveCanvasNoteAuthor({
      id: this.id,
      username: this.username,
    });
  }

  public copy(): LiveCanvasNoteAuthor {
    return new LiveCanvasNoteAuthor({
      id: this.id,
      username: this.username,
    });
  }
}
