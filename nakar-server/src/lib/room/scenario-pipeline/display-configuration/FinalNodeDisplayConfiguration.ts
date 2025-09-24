import type { TemplateDelegate } from 'handlebars';
import { compile } from 'handlebars';
import type { SchemaLayoutSpecification } from '../../../../../src-gen/schema';

export class FinalNodeDisplayConfiguration {
  public readonly displayText: string | null;
  public readonly radius: string | null;
  public readonly backgroundColor: string | null;
  public readonly compress: boolean;
  public readonly layoutSpecification: SchemaLayoutSpecification;

  public readonly displayTextTemplate: TemplateDelegate | null;
  public readonly radiusTemplate: TemplateDelegate | null;
  public readonly backgroundColorTemplate: TemplateDelegate | null;

  public constructor(data: {
    displayText: string | null;
    radius: string | null;
    backgroundColor: string | null;
    compress: boolean;
    layoutSpecification: SchemaLayoutSpecification;
  }) {
    this.displayText = data.displayText;
    this.radius = data.radius;
    this.backgroundColor = data.backgroundColor;
    this.compress = data.compress;
    this.layoutSpecification = data.layoutSpecification;

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
