import { Stack } from "react-bootstrap";
import { useNavigate } from "react-router";

export function BackButton(props: {
  hidden?: boolean;
  href: string;
  title?: string | null;
}) {
  const navigate = useNavigate();

  if (props.hidden) {
    return null;
  }
  return (
    <Stack
      direction={"horizontal"}
      className={
        "border-end ps-2 pe-2 justify-content-center text-muted fw-bold small pointer"
      }
      onClick={() => {
        void navigate(props.href);
      }}
    >
      <i className={"bi bi-chevron-left"}></i>
      {props.title && <span className={"ms-1"}>{props.title}</span>}
    </Stack>
  );
}
