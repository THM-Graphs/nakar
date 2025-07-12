import { Dropdown, Stack } from "react-bootstrap";
import { getVersion } from "../../../src-gen";
import {
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Loadable } from "../../lib/data/Loadable";
import { resultOrThrow } from "../../lib/data/resultOrThrow";
import { handleError } from "../../lib/error/handleError";
import { match } from "ts-pattern";
import { ThemeDropdownEntry } from "./ThemeDropdownEntry";
import { NavbarButton } from "./NavbarButton.tsx";
import { AppContext } from "../../lib/state/AppContext.ts";

export function InfoDropdown(props: { context: AppContext }) {
  const [version, setVersion] = useState<Loadable<string>>({ type: "loading" });

  const reloadVersion = useCallback(() => {
    (async () => {
      try {
        const result = await getVersion();
        const data = resultOrThrow(result);
        setVersion({ type: "data", data: data.version });
      } catch (error) {
        setVersion({ type: "error", message: handleError(error) });
      }
    })().catch(console.error);
  }, []);

  useEffect(() => {
    reloadVersion();
  }, []);

  const CustomToggle = forwardRef(
    (
      {
        onClick,
      }: {
        onClick: (event: MouseEvent) => void;
        children: ReactNode;
      },
      ref: ForwardedRef<HTMLDivElement>,
    ) => (
      <NavbarButton
        ref={ref}
        icon={"gear-fill"}
        onClick={(event) => {
          event.preventDefault();
          onClick(event);
        }}
      ></NavbarButton>
    ),
  );

  return (
    <>
      <Dropdown className={"align-items-stretch d-flex"}>
        <Dropdown.Toggle as={CustomToggle}></Dropdown.Toggle>
        <Dropdown.Menu className={"rounded-0"}>
          <Dropdown.Header>Theme</Dropdown.Header>
          <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
          <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
          <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
          <Dropdown.Divider />

          <Dropdown.Item disabled className={"small"}>
            Client ({props.context.env.VERSION})
          </Dropdown.Item>
          <Dropdown.Item disabled className={"small"}>
            Mode: {import.meta.env.MODE}
          </Dropdown.Item>
          <Dropdown.Divider />

          <Dropdown.Item disabled className={"small"}>
            Server (
            {match(version)
              .with({ type: "loading" }, () => <span>loading…</span>)
              .with({ type: "data" }, ({ data }) => <span>{data}</span>)
              .with({ type: "error" }, ({ message }) => <span>{message}</span>)
              .exhaustive()}
            )
          </Dropdown.Item>
          <Dropdown.Item
            href={props.context.env.BACKEND_URL}
            target={"_blank"}
            className={"small"}
          >
            <Stack gap={2} direction={"horizontal"}>
              <i className="bi bi-box-arrow-up-right"></i>
              <span className="">{props.context.env.BACKEND_URL}</span>
            </Stack>
          </Dropdown.Item>
          <Dropdown.Item
            href={props.context.env.BACKEND_URL + "/system/backup"}
            target={"_blank"}
            className={"small"}
          >
            <Stack gap={2} direction={"horizontal"}>
              <i className="bi bi-download"></i>
              <span>Download Backup (.tar.gz)</span>
            </Stack>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
