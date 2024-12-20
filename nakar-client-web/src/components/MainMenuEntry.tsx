import { NavItem, NavLink, Stack } from "react-bootstrap";
import clsx from "clsx";
import { useNavigate } from "react-router";

export function MainMenuEntry(props: {
  targetUrl: string;
  title: string;
  icon: string;
}) {
  const nav = useNavigate();

  const selected = ((): boolean => {
    if (props.targetUrl === "/") {
      return location.pathname === "/";
    } else {
      return location.pathname.startsWith(props.targetUrl);
    }
  })();

  return (
    <NavItem>
      <NavLink
        active={selected}
        href={props.targetUrl}
        onClick={(e) => {
          e.preventDefault();
          void nav(props.targetUrl);
        }}
      >
        <Stack gap={2} direction={"horizontal"}>
          <i
            className={clsx(
              `bi bi-${props.icon}`,
              !selected && "text-body-emphasis",
            )}
          ></i>
          <span className={clsx(!selected && "text-body-emphasis")}>
            {props.title}
          </span>
        </Stack>
      </NavLink>
    </NavItem>
  );
}
