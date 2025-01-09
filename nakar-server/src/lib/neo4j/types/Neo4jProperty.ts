import { Neo4jPropertyValue } from './Neo4jPropertyValue';

export class Neo4jProperty {
  public readonly slug: string;
  public readonly value: Neo4jPropertyValue;

  public constructor(data: { slug: string; value: Neo4jPropertyValue }) {
    this.slug = data.slug;
    this.value = data.value;
  }
}
