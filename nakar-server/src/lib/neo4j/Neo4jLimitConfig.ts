import { match } from 'ts-pattern';

export class Neo4jLimitConfig {
  public static readonly maximalElements: number = 5000;
  public static readonly maximalPreviewElements: number = 300;

  public constructor(private readonly _type: 'preview' | 'default' | 'none') {}

  public getLimit(): number | null {
    return match(this._type)
      .with('preview', (): number => Neo4jLimitConfig.maximalPreviewElements)
      .with('default', (): number => Neo4jLimitConfig.maximalElements)
      .with('none', (): null => null)
      .exhaustive();
  }
}
