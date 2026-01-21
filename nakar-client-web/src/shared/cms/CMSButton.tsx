import { Button, Stack } from "react-bootstrap";
import { Link } from "react-router";
import { ButtonVariant } from "react-bootstrap/esm/types";
import { MouseEventHandler } from "react";

export function CMSButton(props: {
  title?: string;
  icon?: string;
  type?: "submit";
  link?: string;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement> | undefined;
}) {
  const button = (
    <Button
      size={"sm"}
      type={props.type}
      variant={props.variant}
      onClick={props.onClick}
      className={"shadow-sm"}
    >
      <Stack direction={"horizontal"} gap={2}>
        {props.icon && <i className={`bi bi-${props.icon}`}></i>}
        {props.title && <span>{props.title}</span>}
      </Stack>
    </Button>
  );

  return props.link ? <Link to={props.link}>{button}</Link> : button;
}
