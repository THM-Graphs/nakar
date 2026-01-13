import { Stack } from "react-bootstrap";
import { ClipboardButton } from "../../shared/elements/ClipboardButton.tsx";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { ScenarioQueryDto } from "../../../src-gen";

export function QueryDisplay(props: { query: ScenarioQueryDto }) {
  return (
    <Stack gap={0}>
      <Stack direction={"horizontal"} className={"justify-content-start"}>
        {props.query.database != null && (
          <span className={"small text-muted"}>
            {props.query.database.title}
          </span>
        )}
        {props.query.database?.browserUrl && (
          <NavbarButton
            size={"sm"}
            icon={"box-arrow-up-right"}
            className={"border-start-0 border-end-0 flex-grow-0"}
            onClick={() => {
              if (props.query.database?.browserUrl) {
                window.open(props.query.database.browserUrl, "_blank");
              }
            }}
          ></NavbarButton>
        )}
      </Stack>
      <Stack gap={0} direction={"horizontal"}>
        <Stack>
          <ClipboardButton
            text={props.query.query}
            className={"align-self-baseline"}
          ></ClipboardButton>
        </Stack>
        <div
          className={"font-monospace small user-select-text text-break"}
          style={{
            whiteSpace: "pre-line",
          }}
        >
          {props.query.query}
        </div>
      </Stack>
    </Stack>
  );
}
