export class MutableSourceDefinition {
  public databaseId: string;

  public constructor(data: { databaseId: string }) {
    this.databaseId = data.databaseId;
  }

  public static fromPlain(databaseId: string): MutableSourceDefinition {
    return new MutableSourceDefinition({ databaseId });
  }

  public toPlain(): string {
    return this.databaseId;
  }
}
