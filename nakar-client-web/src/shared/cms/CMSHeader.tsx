export function CMSHeader(props: { title: string; className?: string }) {
  return <h1 className={props.className}>{props.title}</h1>;
}
