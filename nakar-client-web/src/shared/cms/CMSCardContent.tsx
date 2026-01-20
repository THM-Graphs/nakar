import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function CMSCardContent(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  rightBody?: ReactNode;
  rightBodyPaddingStart?: number;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={"p-3 justify-content-between"}
      gap={2}
    >
      <Stack direction={"horizontal"} className={"align-self-start"}>
        <Stack
          gap={1}
          className={clsx(
            "position-relative flex-shrink-1 ellipsis flex-grow-0",
          )}
          style={{
            width:
              props.rightBody && props.rightBodyPaddingStart
                ? `${props.rightBodyPaddingStart.toString()}px`
                : undefined,
          }}
        >
          <span className={"fw-bold ellipsis"}>{props.title}</span>
          {props.subtitle && (
            <span className={"text-muted small ellipsis"}>
              {props.subtitle}
            </span>
          )}
        </Stack>
        {props.rightBody && (
          <div className={"border-start ps-2 ms-2"}>{props.rightBody}</div>
        )}
      </Stack>
      <Stack direction={"horizontal"} className={"align-self-start"}>
        {props.icon && <i className={`bi bi-${props.icon} flex-shrink-0`}></i>}
      </Stack>
    </Stack>
  );
}
