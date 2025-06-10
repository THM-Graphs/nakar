import { ReactNode, useState } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function Collapsable(props: {
  title: ReactNode;
  children: ReactNode;
  inset?: number;
  initialState?: boolean;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(
    props.initialState ?? true,
  );
  return (
    <Stack>
      <Stack
        direction={"horizontal"}
        className={clsx(
          "pointer",
          props.inset && `ms-${props.inset.toString()}`,
        )}
        onClick={() => {
          setCollapsed((old) => !old);
        }}
      >
        <i
          className={clsx(
            "bi me-1 ms-1",
            collapsed ? "bi-chevron-right" : "bi-chevron-down",
          )}
        ></i>
        {props.title}
      </Stack>
      {!collapsed && props.children}
    </Stack>
  );
}
