import { Spinner } from "react-bootstrap";

export function Loading(props: {
  size?: "sm";
  className?: string;
  hidden?: boolean;
}) {
  return <Spinner {...props}></Spinner>;
}
