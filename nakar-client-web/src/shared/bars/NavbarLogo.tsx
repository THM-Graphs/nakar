import { Image, Stack } from "react-bootstrap";

export function NavbarLogo(props: { subtitle?: string }) {
  return (
    <Stack direction={"horizontal"} gap={1}>
      <Image alt="" src="/logo.png" width="20" height="20" roundedCircle />
      <span className={"small fw-bold"}>NAKAR {props.subtitle}</span>
    </Stack>
  );
}
