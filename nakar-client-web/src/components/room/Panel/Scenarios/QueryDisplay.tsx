import { Stack } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";

export function QueryDisplay(props: { query: string }) {
  return (
    <Stack gap={3} direction={"horizontal"} className={"align-items-baseline"}>
      <ClipboardButton text={props.query}></ClipboardButton>
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
