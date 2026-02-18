import { ReactElement, ReactNode, useState } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function Collapsable(props: {
  title: ReactNode;
  children: ReactNode;
  inset?: number;
  initialState?: boolean;
  className?: string;
  sticky?: boolean;
}): ReactElement {
  const [collapsed, setCollapsed] = useState<boolean>(
    props.initialState ?? true,
  );
  return (
    <Stack className={props.className}>
      <Stack
        direction={"horizontal"}
        className={clsx(
          "pointer bg-body-secondary-hover align-items-baseline",
          props.inset && `ms-${props.inset.toString()}`,
          (props.sticky ?? true) ? "sticky-top bg-body-tertiary" : "",
        )}
        onClick={() => {
          setCollapsed((old) => !old);
        }}
      >
        <i
          className={clsx(
            "small bi me-1 ms-1",
            collapsed ? "bi-chevron-right" : "bi-chevron-down",
          )}
        ></i>
        {props.title}
      </Stack>
      {!collapsed && props.children}
    </Stack>
  );
}
