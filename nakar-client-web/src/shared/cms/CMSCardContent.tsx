import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function CMSCardContent(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  width?: number;
  rightBody?: ReactNode;
  rightBodyPaddingStart?: number;
}) {
  return (
    <Stack direction={"horizontal"} className={"align-items-start p-3"} gap={2}>
      <Stack
        gap={1}
        className={clsx("position-relative flex-shrink-1 ellipsis flex-grow-0")}
        style={{
          width:
            props.rightBody && props.rightBodyPaddingStart
              ? `${props.rightBodyPaddingStart.toString()}px`
              : undefined,
        }}
      >
        <span className={"fw-bold ellipsis"}>{props.title}</span>
        {props.subtitle && (
          <span className={"text-muted small ellipsis"}>{props.subtitle}</span>
        )}
      </Stack>
      {props.rightBody && (
        <div className={"border-start ps-2 ms-2"}>{props.rightBody}</div>
      )}
      <div className={"flex-grow-1"}></div>
      {props.icon && <i className={`bi bi-${props.icon} flex-shrink-0`}></i>}
    </Stack>
  );
}
