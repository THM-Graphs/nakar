import { match } from "ts-pattern";
import { UserTheme } from "./UserTheme";

export function getIcon(_theme: UserTheme): string {
  return match(_theme)
    .with("dark", () => "moon-fill")
    .with("light", () => "brightness-high-fill")
    .with(null, () => "circle-half")
    .exhaustive();
}
