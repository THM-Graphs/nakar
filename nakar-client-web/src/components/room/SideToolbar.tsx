import { Stack } from "react-bootstrap";
import { ReactNode } from "react";

export function SideToolbar(props: {
  children: ReactNode;
  hidden?: boolean;
  width: number;
}) {
  if (props.hidden) {
    return null;
  }
  return (
    <Stack
      className={"flex-shrink-0 flex-grow-0 border-end"}
      style={{
        width: `${props.width.toString()}px`,
      }}
    >
      {props.children}
    </Stack>
  );
}
