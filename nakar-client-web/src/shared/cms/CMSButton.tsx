import { NavbarButton } from "../elements/NavbarButton.tsx";
import { MouseEvent } from "react";
import { CMSCard } from "./CMSCard.tsx";

export function CMSButton(props: {
  title?: string;
  icon?: string;
  onClick?: (event: MouseEvent) => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <CMSCard>
      <NavbarButton
        disabled={props.disabled}
        title={props.title}
        icon={props.icon}
        className={"p-2"}
        onClick={props.onClick}
      ></NavbarButton>
    </CMSCard>
  );
}
