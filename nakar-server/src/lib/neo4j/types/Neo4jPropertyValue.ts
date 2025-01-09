/* eslint-disable @typescript-eslint/consistent-type-definitions,@typescript-eslint/consistent-indexed-object-style */

export type Neo4jPropertyValue =
  | string
  | number
  | boolean
  | null
  | Neo4jPropertyValueArray
  | Neo4jPropertyValueObject;
export type Neo4jPropertyValueArray = Neo4jPropertyValue[];
export type Neo4jPropertyValueObject = { [key: string]: Neo4jPropertyValue };
