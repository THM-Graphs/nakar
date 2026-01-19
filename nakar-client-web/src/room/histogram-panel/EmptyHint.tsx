import clsx from "clsx";
import { match, P } from "ts-pattern";

export function EmptyHint(props: {
  list: unknown[];
  align?: "left" | "middle";
}) {
  if (props.list.length > 0) {
    return null;
  } else {
    return (
      <span
        className={clsx(
          "small text-muted fst-italic pt-2 pb-2",
          match(props.align)
            .with("left", () => "align-self-start")
            .with("middle", () => "align-self-center")
            .with(P.nullish, () => "align-self-center")
            .exhaustive(),
        )}
      >
        none
      </span>
    );
  }
}
