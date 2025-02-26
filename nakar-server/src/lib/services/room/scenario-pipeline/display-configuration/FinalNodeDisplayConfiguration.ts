import { compile, TemplateDelegate } from 'handlebars';

export class FinalNodeDisplayConfiguration {
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

  private static _createTemplate(
    input: string | null,
  ): TemplateDelegate | null {
    if (input == null) {
      return null;
    }
    if (input.trim().length === 0) {
      return null;
    }
    return compile(input);
  }
}
