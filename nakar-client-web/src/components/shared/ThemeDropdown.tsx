import { Dropdown, DropdownButton } from "react-bootstrap";
import { match } from "ts-pattern";
import { useTheme } from "../../lib/theme/useTheme.ts";
import { UserTheme } from "../../lib/theme/UserTheme.ts";
import { useUserTheme } from "../../lib/theme/useUserTheme.ts";

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

export function ThemeDropdown(props: { className?: string }) {
  const theme = useTheme();

  return (
    <DropdownButton
      className={props.className}
      variant={"secondary"}
      size={"sm"}
      title={
        <span>
          <i className={`bi bi-${getIcon(theme)} me-1`}></i>
        </span>
      }
    >
      <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
      <Dropdown.Divider />
      <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
      <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
    </DropdownButton>
  );
}

function ThemeDropdownEntry(props: { targetTheme: UserTheme }) {
  const [theme, setTheme] = useUserTheme();

  return (
    <Dropdown.Item
      onClick={() => {
        setTheme(props.targetTheme);
      }}
      active={props.targetTheme === theme}
    >
      <i className={`bi bi-${getIcon(props.targetTheme)} me-2`}></i>
      {getLabel(props.targetTheme)}
    </Dropdown.Item>
  );
}
