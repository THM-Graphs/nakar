import { Fragment, ReactNode, useState } from "react";
import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import clsx from "clsx";
import { CMSButton } from "./CMSButton.tsx";
import { UserPreviewDto } from "../../../src-gen";
import { CMSUserCircle } from "./CMSUserCircle.tsx";
import { CMSUserCircleCollection } from "./CMSUserCircleCollection.tsx";

export function CMSCardContent(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: string;
  rightBody?: ReactNode;
  rightBodyPaddingStart?: number;
  onRemove?: () => void;
  users?: UserPreviewDto[];
}) {
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <Stack
      direction={"horizontal"}
      className={"p-3 justify-content-between gap-1"}
      gap={2}
      onMouseEnter={() => {
        setIsHover(true);
      }}
      onMouseLeave={() => {
        setIsHover(false);
      }}
    >
      <Stack direction={"horizontal"} className={"align-self-start ellipsis"}>
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
          <div className={"border-start ps-2 ms-2 align-self-stretch"}>
            {props.rightBody}
          </div>
        )}
      </Stack>
      <Stack direction={"horizontal"} className={"align-self-start gap-2"}>
        <CMSUserCircleCollection
          users={props.users ?? []}
        ></CMSUserCircleCollection>
        {isHover && props.onRemove != null ? (
          <CMSButton
            variant={"icon"}
            icon={"x-lg"}
            className={"p-0"}
            onClick={() => {
              props.onRemove?.();
            }}
          ></CMSButton>
        ) : (
          props.icon && <i className={`bi bi-${props.icon} flex-shrink-0`}></i>
        )}
      </Stack>
    </Stack>
  );
}
