import { match } from "ts-pattern";
import { UserTheme } from "./UserTheme";

export function getLabel(_theme: UserTheme): string {
  return match(_theme)
    .with("dark", () => "Dark")
    .with("light", () => "Light")
    .with(null, () => "Auto")
    .exhaustive();
}
