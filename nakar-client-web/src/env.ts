import { match } from "ts-pattern";

export interface Env {
  backendUrl: string;
}

export const env = {
  prod: {
    backendUrl: "http://romantikerbriefe.de:1337",
  } satisfies Env,
  dev: {
    backendUrl: "http://localhost:1337",
  } satisfies Env,
};

export function getEnv(): Env {
  return match(import.meta.env.MODE)
    .with("production", () => env.prod)
    .with("development", () => env.dev)
    .run();
}
