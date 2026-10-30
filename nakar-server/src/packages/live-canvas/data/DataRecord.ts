/**
 * Creates dictionaries without a prototype so arbitrary source IDs and property names remain ordinary keys.
 */
export class DataRecord {
  /**
   * Creates a dictionary with no inherited keys.
   * @typeParam T - Value or result type preserved by this operation.
   * @returns A new empty dictionary with a null prototype.
   */
  public static empty<T>(): Record<string, T> {
    const record: Record<string, T> = {};
    Object.setPrototypeOf(record, null);
    return record;
  }
}
