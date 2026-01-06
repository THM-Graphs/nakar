import clsx from "clsx";
import Button from "react-bootstrap/esm/Button";

export function ScnearioPlayButton(props: {
  onClick: React.MouseEventHandler;
  icon: string;
}) {
  return (
    <Button
      variant={"link"}
      size={"sm"}
      onClick={(event) => {
        event.stopPropagation();
        props.onClick(event);
      }}
      className={"p-0"}
    >
      <i className={clsx(`bi bi-${props.icon}`)}></i>
    </Button>
  );
}
