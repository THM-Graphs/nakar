import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { useState } from "react";
import { useClipboard } from "../../lib/clipboard/useClipboard.ts";

export function QueryDisplay(props: { query: string }) {
  const [copied, setCopied] = useState(false);
  const [isClipboardEnabled, setClipboard] = useClipboard();

  return (
    <Stack gap={3}>
      <OverlayTrigger
        placement="bottom"
        delay={{ show: 0, hide: 0 }}
        overlay={
          <Tooltip hidden={!isClipboardEnabled} id="button-tooltip">
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
            if (!isClipboardEnabled) {
              return;
            }
            setClipboard(props.query)
              .then(() => {
                setCopied(true);
              })
              .catch(console.error);
          }}
          className={"font-monospace small"}
          style={{
            whiteSpace: "pre-line",
            cursor: isClipboardEnabled ? "pointer" : undefined,
          }}
        >
          {props.query}
        </div>
      </OverlayTrigger>
    </Stack>
  );
}
