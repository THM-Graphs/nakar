import { NavbarButton } from "../elements/NavbarButton.tsx";
import { MouseEvent } from "react";
import { CMSCard } from "./CMSCard.tsx";

export function CMSCreateButton(props: {
  title?: string;
  icon?: string;
  onClick?: (event: MouseEvent) => void | Promise<void>;
}) {
  return (
    <CMSCard>
      <NavbarButton
        title={props.title}
        icon={props.icon}
        className={"p-2"}
        onClick={props.onClick}
      ></NavbarButton>
    </CMSCard>
  );
}
