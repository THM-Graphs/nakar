import { Stack } from "react-bootstrap";
import { ReactElement } from "react";

export function SideToolbar(props: {
  children?: () => ReactElement;
  hidden?: boolean;
  width: number;
}) {
  if (props.hidden) {
    return null;
  }
  return (
    <Stack
      className={
        "flex-shrink-0 flex-grow-0 overflow-x-hidden overflow-y-scroll"
      }
      style={{
        width: `${props.width.toString()}px`,
      }}
    >
      {props.children?.()}
    </Stack>
  );
}
