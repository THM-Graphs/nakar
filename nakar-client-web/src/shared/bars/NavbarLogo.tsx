import { Image, Stack } from "react-bootstrap";

export function NavbarLogo() {
  return (
    <Stack direction={"horizontal"} gap={1}>
      <Image alt="" src="/logo.png" width="20" height="20" roundedCircle />
      <span className={"small fw-bold"}>NAKAR</span>
    </Stack>
  );
}
