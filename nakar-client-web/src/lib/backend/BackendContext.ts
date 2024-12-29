import { Backend } from "./Backend.ts";
import { createContext } from "react";

export const BackendContext = createContext(
  new Backend("http://localhost:1337"),
);
