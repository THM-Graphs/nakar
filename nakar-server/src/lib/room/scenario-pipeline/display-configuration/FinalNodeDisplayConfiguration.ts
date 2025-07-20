import { compile, TemplateDelegate } from 'handlebars';
import { LayoutAlgorithm } from '../../../tools/LayoutAlgorithm';

export class FinalNodeDisplayConfiguration {
  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;
  public readonly compress: boolean;
  public readonly circleLayoutDistance: number;
  public readonly layoutAlgorithm: LayoutAlgorithm;

  public readonly displayTextTemplate: TemplateDelegate | null;
  public readonly radiusTemplate: TemplateDelegate | null;
  public readonly backgroundColorTemplate: TemplateDelegate | null;

  public constructor(data: {
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
    compress: boolean;
    circleLayoutDistance: number;
    layoutAlgorithm: LayoutAlgorithm;
  }) {
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;
    this.compress = data.compress;
    this.circleLayoutDistance = data.circleLayoutDistance;
    this.layoutAlgorithm = data.layoutAlgorithm;

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
    return compile(input, { noEscape: true, strict: true });
  }
}
