import { Dropdown } from "react-bootstrap";
import { UserTheme } from "../../lib/theme/UserTheme";
import { useUserTheme } from "../../lib/theme/useUserTheme";
import { getIcon } from "../../lib/theme/getIcon";
import { getLabel } from "../../lib/theme/getLabel";

export function ThemeDropdownEntry(props: { targetTheme: UserTheme }) {
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
