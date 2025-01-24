/* eslint-disable @typescript-eslint/consistent-type-definitions */

// TODO: Replace with full wrapper
export type JSONPrimitive = string | number | boolean | null;
export type JSONObject = { [k: string]: JSONValue };
export type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export type JSONArray = JSONValue[];
