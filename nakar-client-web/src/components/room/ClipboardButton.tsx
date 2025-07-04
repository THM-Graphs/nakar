import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useState } from "react";
import { useClipboard } from "../../lib/clipboard/useClipboard.ts";
import { NavbarButton } from "../shared/NavbarButton.tsx";
import clsx from "clsx";

export function ClipboardButton(props: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const [isClipboardEnabled, setClipboard] = useClipboard();

  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 500, hide: 0 }}
      overlay={<Tooltip>{copied ? "Copied" : "Copy"}</Tooltip>}
      onToggle={(shown) => {
        if (!shown) {
          setCopied(false);
        }
      }}
    >
      <NavbarButton
        className={clsx(props.className)}
        style={{ zIndex: 1 }}
        icon={copied ? "check" : "copy"}
        onClick={() => {
          (async () => {
            if (!isClipboardEnabled) {
              return;
            }

            try {
              await setClipboard(extractString(props.text));
              setCopied(true);
              setTimeout(() => {
                setCopied(false);
              }, 1000);
            } catch (error) {
              console.error(error);
            }
          })().catch(console.error);
        }}
      ></NavbarButton>
    </OverlayTrigger>
  );
}

/*
This function tries to interpret a string as a json string with quotes.
Then it should return the actual string value.
If the value is no json or any other json type it just should return the input.
This function is used so that a user that copies a property value will receive the simple string value.
*/
function extractString(input: string): string {
  try {
    const json: unknown = JSON.parse(input);
    if (typeof json == "string") {
      return json;
    } else {
      return input;
    }
  } catch {
    return input;
  }
}
