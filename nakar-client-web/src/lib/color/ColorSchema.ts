export class ColorSchema {
  public readonly slug: string;
  public readonly title: string;
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
    title: string,
    slug: string,
    backgroundColors: [string, string, string, string, string, string],
    textColors: [string, string, string, string, string, string],
  ) {
    this.title = title;
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

  public static allColorSchema(): ColorSchema[] {
    return [
      new ColorSchema(
        "Bootstrap",
        "bootstrap",
        ["#3B71CA", "#14A44D", "#DC4C64", "#E4A11B", "#54B4D3", "#332D2D"],
        ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
      ),
      new ColorSchema(
        "Pastel",
        "pastel",
        ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#bdb2ff"],
        ["#000", "#000", "#000", "#000", "#000", "#000"],
      ),
      new ColorSchema(
        "Nature",
        "nature",
        ["#cb997e", "#ddbea9", "#ffe8d6", "#b7b7a4", "#a5a58d", "#6b705c"],
        ["#000", "#000", "#000", "#000", "#000", "#000"],
      ),
      new ColorSchema(
        "Neon",
        "neon",
        ["#0000ff", "#ff00ff", "#ff0000", "#00ff00", "#00ffff", "#ffff00"],
        ["#fff", "#fff", "#fff", "#000", "#000", "#000"],
      ),
      new ColorSchema(
        "White",
        "white",
        ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
        ["#000", "#000", "#000", "#000", "#000", "#000"],
      ),
      new ColorSchema(
        "Black",
        "black",
        ["#000", "#000", "#000", "#000", "#000", "#000"],
        ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
      ),
    ];
  }
}
