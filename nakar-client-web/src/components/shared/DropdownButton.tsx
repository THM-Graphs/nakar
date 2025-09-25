import {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactNode,
} from "react";
import { NavbarButton } from "./NavbarButton.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import clsx from "clsx";
import { AlignType, Placement } from "react-bootstrap/types";

export function DropdownButton(props: {
  icon?: string;
  title?: ReactNode;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
  buttonSize?: "sm";
  menuClassName?: string;
  menuStyle?: CSSProperties;
  children: ReactNode;
  align?: AlignType;
  tooltip?: string;
  tooltipPlacement?: Placement;
  hidden?: boolean;
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
      ref: ForwardedRef<HTMLButtonElement>,
    ) => (
      <Stack>
        <NavbarButton
          hidden={props.hidden}
          icon={props.icon}
          ref={ref}
          tooltip={props.tooltip}
          tooltipPlacement={props.tooltipPlacement}
          title={props.title}
          size={props.buttonSize}
          className={props.buttonClassName}
          onClick={(event) => {
            event.preventDefault();
            onClick(event);
          }}
          style={{
            ...props.buttonStyle,
          }}
        >
          {children}
        </NavbarButton>
      </Stack>
    ),
  );

  return (
    <>
      <Dropdown autoClose={true} align={props.align}>
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
