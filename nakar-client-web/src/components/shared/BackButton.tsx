import { Nav } from "react-bootstrap";

export function BackButton(props: {
  hidden?: boolean;
  href: string;
  title: string;
}) {
  if (props.hidden) {
    return null;
  }
  return (
    <Nav.Link className={"fw-bold"} href={props.href}>
      <i className={"bi bi-chevron-left me-2"}></i>
      <span>{props.title}</span>
    </Nav.Link>
  );
}
