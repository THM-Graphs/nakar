import { z } from "zod";
import dotenv from "dotenv";

const EnvFileSchema = z.object({
  BACKEND_URL: z.string().optional(),
  BACKEND_SOCKET_URL: z.string().optional(),
  VERSION: z.string().optional(),
});
export type Env = {
  BACKEND_URL: string;
  BACKEND_SOCKET_URL: string;
  VERSION: string;
};

const defaultEnv: Env = {
  BACKEND_URL: "http://localhost:1337",
  BACKEND_SOCKET_URL: "ws://localhost:1337",
  VERSION: "0.0.0",
};

async function loadEnv(): Promise<Env> {
  const result = await fetch("/.env");
  const text = await result.text();
  const value = dotenv.parse(text);
  const envFile = EnvFileSchema.parse(value);
  return {
    BACKEND_URL: nullIfEmpty(envFile.BACKEND_URL) ?? defaultEnv.BACKEND_URL,
    BACKEND_SOCKET_URL:
      nullIfEmpty(envFile.BACKEND_SOCKET_URL) ?? defaultEnv.BACKEND_SOCKET_URL,
    VERSION: nullIfEmpty(envFile.VERSION) ?? defaultEnv.VERSION,
  };
}

export async function loadEnvOrDefault(): Promise<Env> {
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

function nullIfEmpty(input: string | null | undefined): string | null {
  if (input == null) {
    return null;
  }
  if (input.trim().length == 0) {
    return null;
  } else {
    return input;
  }
}
