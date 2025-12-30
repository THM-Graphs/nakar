export function StringListDisplay(props: {
  input: string[] | null | undefined;
}) {
  if (props.input == null || props.input.length === 0) {
    return <span className={"fst-italic"}>None</span>;
  } else {
    return props.input.join(", ");
  }
}
