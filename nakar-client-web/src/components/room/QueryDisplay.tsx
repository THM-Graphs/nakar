import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { useState } from "react";

export function QueryDisplay(props: { query: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Stack gap={3}>
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 0, hide: 0 }}
        overlay={
          <Tooltip id="button-tooltip">
            {copied ? "Copied!" : "Click to copy query"}
          </Tooltip>
        }
        onToggle={(shown) => {
          if (!shown) {
            setCopied(false);
          }
        }}
      >
        <div
          onClick={() => {
            navigator.clipboard
              .writeText(props.query)
              .then(() => {
                setCopied(true);
              })
              .catch(alert);
          }}
          className={"font-monospace small"}
          style={{ whiteSpace: "pre-line", cursor: "pointer" }}
        >
          {props.query}
        </div>
      </OverlayTrigger>
    </Stack>
  );
}
