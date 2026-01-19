export function CMSEmptyHint<T>(props: { list: T[] }) {
  if (props.list.length > 0) {
    return null;
  } else {
    return <span className={"text-muted small fst-italic"}>None</span>;
  }
}
