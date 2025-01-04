import { z } from "zod";
import dotenv from "dotenv";

const EnvSchema = z.object({
  BACKEND_URL: z.string().nonempty(),
});
type Env = z.infer<typeof EnvSchema>;

const defaultEnv: Env = {
  BACKEND_URL: "http://localhost:1337",
};

async function loadEnv(): Promise<Env> {
  const result = await fetch("/.env");
  const text = await result.text();
  const value = dotenv.parse(text);
  const env = EnvSchema.parse(value);
  return env;
}

async function loadEnvOrDefault(): Promise<Env> {
  try {
    const env = await loadEnv();
    console.log(`Will use env: ${JSON.stringify(env)}`);
    return env;
  } catch (error) {
    console.error(`Error loading .env file: ${JSON.stringify(error)}`);
    console.log(`Will use default env: ${JSON.stringify(defaultEnv)}`);
    return defaultEnv;
  }
}

export async function bootstrapEnv(): Promise<void> {
  currentEnv = await loadEnvOrDefault();
}

let currentEnv: Env = defaultEnv;

export function env(): Env {
  return currentEnv;
}
