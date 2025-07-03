import { Stack } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";

export function QueryDisplay(props: { query: string }) {
  return (
    <Stack gap={3} direction={"horizontal"}>
      <ClipboardButton
        text={props.query}
        className={"align-self-baseline"}
      ></ClipboardButton>
      <div
        className={"font-monospace small user-select-text"}
        style={{
          whiteSpace: "pre-line",
        }}
      >
        {props.query}
      </div>
    </Stack>
  );
}
