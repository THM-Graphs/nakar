/**
 * Represents recursively structured JSON data that can cross delegates without framework objects.
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | PropertyValue[]
  | {
      /**
       * Maps arbitrary source keys to their structured values without imposing a fixed schema.
       * @param key - Setting or property key to select.
       */
      [key: string]: PropertyValue;
    };
