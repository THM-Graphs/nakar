import { Backend } from "../backend/Backend.ts";

export type Action = (backend: Backend) => Promise<void> | void;
