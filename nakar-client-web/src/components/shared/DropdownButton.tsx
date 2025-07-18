import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactNode,
} from "react";
import { NavbarButton } from "./NavbarButton.tsx";
import { Dropdown } from "react-bootstrap";
import clsx from "clsx";

export function DropdownButton(props: {
  icon?: string;
  title?: string;
  buttonClassName?: string;
  buttonSize?: "sm";
  menuClassName?: string;
  menuStyle?: CSSProperties;
  children: ReactNode;
}) {
  const CustomToggle = forwardRef(
    (
      {
        onClick,
        children,
      }: {
        onClick: (event: MouseEvent) => void;
        children: ReactNode;
      },
      ref: ForwardedRef<HTMLDivElement>,
    ) => (
      <NavbarButton
        icon={props.icon}
        ref={ref}
        title={props.title}
        size={props.buttonSize}
        onClick={(event) => {
          event.preventDefault();
          onClick(event);
        }}
      >
        {children}
      </NavbarButton>
    ),
  );

  return (
    <>
      <Dropdown autoClose={true} className={props.buttonClassName}>
        <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
        <Dropdown.Menu
          className={clsx("rounded-0", props.menuClassName)}
          style={{ ...props.menuStyle, zIndex: "1050" }}
        >
          {props.children}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
