import { compile, TemplateDelegate } from 'handlebars';
import { z } from 'zod';

export class FinalNodeDisplayConfiguration {
  // eslint-disable-next-line @typescript-eslint/typedef
  public static readonly schema = z.object({
    displayText: z.string().nullable(),
    radius: z.string().nullable(),
    backgroundColor: z.string().nullable(),
  });

  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;

  public readonly displayTextTemplate: TemplateDelegate | null;
  public readonly radiusTemplate: TemplateDelegate | null;
  public readonly backgroundColorTemplate: TemplateDelegate | null;

  public constructor(data: {
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
  }) {
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;

    this.displayTextTemplate = FinalNodeDisplayConfiguration._createTemplate(
      data.displayText,
    );
    this.radiusTemplate = FinalNodeDisplayConfiguration._createTemplate(
      data.radius,
    );
    this.backgroundColorTemplate =
      FinalNodeDisplayConfiguration._createTemplate(data.backgroundColor);
  }

  public static fromPlain(
    plain: z.infer<typeof FinalNodeDisplayConfiguration.schema>,
  ): FinalNodeDisplayConfiguration {
    return new FinalNodeDisplayConfiguration({
      displayText: plain.displayText,
      radius: plain.radius,
      backgroundColor: plain.backgroundColor,
    });
  }

  public static fromUnknown(
    data: unknown,
  ): FinalNodeDisplayConfiguration | null {
    const parsed: z.infer<typeof FinalNodeDisplayConfiguration.schema> =
      FinalNodeDisplayConfiguration.schema.parse(data);
    return FinalNodeDisplayConfiguration.fromPlain(parsed);
  }

  private static _createTemplate(
    input: string | null,
  ): TemplateDelegate | null {
    if (input == null) {
      return null;
    }
    if (input.trim().length === 0) {
      return null;
    }
    return compile(input, { noEscape: true, strict: true });
  }

  public toPlain(): z.infer<typeof FinalNodeDisplayConfiguration.schema> {
    return {
      displayText: this.displayText,
      radius: this.radius,
      backgroundColor: this.backgroundColor,
    } satisfies z.infer<typeof FinalNodeDisplayConfiguration.schema>;
  }
}
