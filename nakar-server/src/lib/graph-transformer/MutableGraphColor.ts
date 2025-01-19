import { SchemaColor } from '../../../src-gen/schema';

export abstract class MutableGraphColor {
  public abstract toDto(): SchemaColor;
}
