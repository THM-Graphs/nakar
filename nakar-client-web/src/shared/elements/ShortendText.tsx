import { ReactNode, useMemo, useState } from "react";
import clsx from "clsx";
import { Button } from "react-bootstrap";

export function ShortendText(props: {
  text: string;
  maxCharacters?: number;
  render?: (text: string) => ReactNode;
}) {
  const render = props.render ?? ((t: string) => <>{t}</>);
  const maxCharacters = props.maxCharacters ?? 100;
  const [expand, setExpand] = useState(false);
  const requiresShortening = props.text.length > maxCharacters;
  const textToUse = useMemo(() => {
    if (expand) {
      return props.text;
    }
    return props.text.length > maxCharacters
      ? props.text.substring(0, maxCharacters) + "…"
      : props.text;
  }, [props.text, maxCharacters, expand]);

  return (
    <>
      {requiresShortening && (
        <Button
          size={"sm"}
          variant={"icon"}
          className={clsx(
            "p-0 m-0 border-0 bi me-1 align-baseline",
            expand ? "bi-chevron-down" : "bi-chevron-right",
          )}
          onClick={() => {
            setExpand((e) => !e);
          }}
        ></Button>
      )}
      {render(textToUse)}
    </>
  );
}
