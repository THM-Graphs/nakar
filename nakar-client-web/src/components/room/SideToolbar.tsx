import { Stack } from "react-bootstrap";
import { ReactElement } from "react";

export function SideToolbar(props: {
  children: ReactElement;
  visible: boolean;
  width: number;
}) {
  return (
    <Stack
      className={"flex-shrink-0 flex-grow-0 overflow-x-hidden"}
      style={{
        width: props.visible ? `${props.width.toString()}px` : "0px",
        transition: "width 0.2s ease-in-out",
      }}
    >
      {props.children}
    </Stack>
  );
}
