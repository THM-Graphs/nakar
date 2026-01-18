import { NavbarButton } from "../elements/NavbarButton.tsx";
import { Stack } from "react-bootstrap";
import { MouseEvent } from "react";

export function CMSCreateButton(props: {
  title?: string;
  icon?: string;
  onClick?: (event: MouseEvent) => void | Promise<void>;
}) {
  return (
    <Stack className={"border rounded overflow-hidden bg-body"}>
      <NavbarButton
        title={props.title}
        icon={props.icon}
        className={"p-2"}
        onClick={props.onClick}
      ></NavbarButton>
    </Stack>
  );
}
