export type WrappedText = {
  lines: string[];
  lineHeight: number;
  maxLineWidth: number;
};

export class TextMeasurer {
  private readonly ctx: CanvasRenderingContext2D;

  public constructor() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx == null) {
      throw new Error("Could not initialize 2D context for text measurement.");
    }
    this.ctx = ctx;
  }

  public measureWidth(text: string, font: string): number {
    this.ctx.font = font;
    return this.ctx.measureText(text).width;
  }

  public wrapText(
    text: string,
    font: string,
    maxWidth: number,
    maxHeight: number,
    fontSize: number,
    lineHeightFactor: number,
  ): WrappedText {
    if (text.trim().length === 0 || maxWidth <= 1 || maxHeight <= 1) {
      return {
        lines: [],
        lineHeight: fontSize * lineHeightFactor,
        maxLineWidth: 0,
      };
    }

    const lineHeight = fontSize * lineHeightFactor;
    const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
    this.ctx.font = font;

    const words = text.split(/\s+/).filter((word) => word.length > 0);
    const lines: string[] = [];
    let current = "";

    const pushLine = () => {
      if (current.length > 0) {
        lines.push(current);
        current = "";
      }
    };

    const fitWord = (word: string): string[] => {
      if (this.ctx.measureText(word).width <= maxWidth) {
        return [word];
      }
      const chunks: string[] = [];
      let rest = word;
      while (rest.length > 0) {
        let chunk = "";
        for (let i = 1; i <= rest.length; i += 1) {
          const candidate = rest.slice(0, i);
          if (this.ctx.measureText(candidate).width <= maxWidth) {
            chunk = candidate;
          } else {
            break;
          }
        }
        if (chunk.length === 0) {
          chunk = rest.slice(0, 1);
        }
        chunks.push(chunk);
        rest = rest.slice(chunk.length);
      }
      return chunks;
    };

    for (const word of words) {
      const chunks = fitWord(word);
      for (const chunk of chunks) {
        const candidate = current.length === 0 ? chunk : `${current} ${chunk}`;
        if (this.ctx.measureText(candidate).width <= maxWidth) {
          current = candidate;
        } else {
          pushLine();
          current = chunk;
        }
        if (lines.length >= maxLines) {
          break;
        }
      }
      if (lines.length >= maxLines) {
        break;
      }
    }
    pushLine();

    const result = lines.slice(0, maxLines);
    if (lines.length > maxLines && result.length > 0) {
      let last = result[result.length - 1];
      while (
        last.length > 0 &&
        this.ctx.measureText(`${last}…`).width > maxWidth
      ) {
        last = last.slice(0, -1);
      }
      result[result.length - 1] = `${last}…`;
    }

    let maxLineWidth = 0;
    for (const line of result) {
      maxLineWidth = Math.max(maxLineWidth, this.ctx.measureText(line).width);
    }

    return {
      lines: result,
      lineHeight,
      maxLineWidth,
    };
  }
}
