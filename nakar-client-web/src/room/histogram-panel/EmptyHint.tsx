export function EmptyHint(props: { list: unknown[] }) {
  if (props.list.length > 0) {
    return null;
  } else {
    return (
      <span className={"small text-muted fst-italic align-self-center p-2"}>
        none
      </span>
    );
  }
}
