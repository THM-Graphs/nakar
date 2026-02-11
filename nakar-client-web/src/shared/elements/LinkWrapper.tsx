import { ReactNode } from "react";
import { Link } from "react-router";

export function LinkWrapper(props: {
  onClick: (() => void) | null;
  children: ReactNode;
}) {
  if (props.onClick == null) {
    return props.children;
  } else {
    return (
      <Link
        to={""}
        onClick={(e) => {
          e.preventDefault();
          props.onClick?.();
        }}
      >
        {props.children}
      </Link>
    );
  }
}
