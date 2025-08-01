export class ColorSchema {
  public readonly slug: string;
  private readonly _backgroundColors: [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  private readonly _textColors: [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  public constructor(
    slug: string,
    backgroundColors: [string, string, string, string, string, string],
    textColors: [string, string, string, string, string, string],
  ) {
    this.slug = slug;
    this._backgroundColors = backgroundColors;
    this._textColors = textColors;
  }

  getBackgroundColor(index: 0 | 1 | 2 | 3 | 4 | 5): string {
    return this._backgroundColors[index];
  }

  getTextColor(index: 0 | 1 | 2 | 3 | 4 | 5): string {
    return this._textColors[index];
  }

  public static bootstrap(): ColorSchema {
    return new ColorSchema(
      "bootstrap",
      ["#3B71CA", "#14A44D", "#DC4C64", "#E4A11B", "#54B4D3", "#332D2D"],
      ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
    );
  }

  public static pastel(): ColorSchema {
    return new ColorSchema(
      "pastel",
      ["#ffcbe1", "#d6e5bd", "#bcd8ec", "#dcccec", "#ffcbe1", "#d6e5bd"],
      ["#000", "#000", "#000", "#000", "#000", "#000"],
    );
  }
}
