import { Stack } from "react-bootstrap";
import { ReactNode } from "react";
import clsx from "clsx";

export function CMSCard(props: { width?: number; children?: ReactNode }) {
  return (
    <Stack
      className={clsx(
        "shadow-sm border shadow bg-body rounded overflow-hidden",
      )}
      style={{ width: props.width ? `${props.width.toString()}px` : undefined }}
    >
      {props.children}
    </Stack>
  );
}
