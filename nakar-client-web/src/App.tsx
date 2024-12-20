import { MainNavbar } from "./components/MainNavbar.tsx";
import { Stack } from "react-bootstrap";
import { MainMenu } from "./components/MainMenu.tsx";
import { Outlet } from "react-router";

export default function App() {
  return (
    <>
      <Stack style={{ height: "100%" }}>
        <MainNavbar></MainNavbar>
        <Stack
          className={"flex-grow-1 align-items-stretch"}
          direction={"horizontal"}
        >
          <MainMenu></MainMenu>
          <Outlet></Outlet>
        </Stack>
      </Stack>
    </>
  );
}
