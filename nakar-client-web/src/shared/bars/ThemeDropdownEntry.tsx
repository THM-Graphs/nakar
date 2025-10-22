import { Dropdown } from "react-bootstrap";
import { UserTheme } from "../../theme/UserTheme.ts";
import { match } from "ts-pattern";
import { useBearStore } from "../../state/useBearStore.ts";

export function ThemeDropdownEntries() {
  return (
    <>
      <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
      <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
      <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
    </>
  );
}

export function ThemeDropdownEntry(props: { targetTheme: UserTheme }) {
  const setUserTheme = useBearStore((s) => s.global.theme.setUserTheme);
  const userTheme = useBearStore((s) => s.global.theme.user);

  return (
    <Dropdown.Item
      className={"small"}
      onClick={() => {
        setUserTheme(props.targetTheme);
      }}
      active={props.targetTheme === userTheme}
    >
      <i className={`bi bi-${getIcon(props.targetTheme)} me-1`}></i>{" "}
      {getLabel(props.targetTheme)}
    </Dropdown.Item>
  );
}

function getIcon(_theme: UserTheme): string {
  return match(_theme)
    .with("dark", () => "moon-fill")
    .with("light", () => "brightness-high-fill")
    .with(null, () => "circle-half")
    .exhaustive();
}

function getLabel(_theme: UserTheme): string {
  return match(_theme)
    .with("dark", () => "Dark")
    .with("light", () => "Light")
    .with(null, () => "Auto")
    .exhaustive();
}
