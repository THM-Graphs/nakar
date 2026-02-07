import { Button, Stack } from "react-bootstrap";
import { Link } from "react-router";
import { ButtonVariant } from "react-bootstrap/esm/types";
import { MouseEventHandler } from "react";
import clsx from "clsx";

export function CMSButton(props: {
  title?: string;
  icon?: string;
  type?: "submit";
  link?: string;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
  className?: string;
}) {
  const button = (
    <Button
      size={"sm"}
      type={props.type}
      variant={props.variant}
      onClick={props.onClick}
      className={clsx("shadow-sm", props.className)}
    >
      <Stack direction={"horizontal"} gap={2}>
        {props.icon && <i className={`bi bi-${props.icon}`}></i>}
        {props.title && <span>{props.title}</span>}
      </Stack>
    </Button>
  );

  return props.link ? (
    <Link to={props.link} className={clsx(props.className)}>
      {button}
    </Link>
  ) : (
    button
  );
}
