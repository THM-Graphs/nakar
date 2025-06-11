import { Dropdown } from "react-bootstrap";
import { getVersion } from "../../../src-gen";
import {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  ReactNode,
  ForwardedRef,
  MouseEvent,
} from "react";
import { Loadable } from "../../lib/data/Loadable";
import { resultOrThrow } from "../../lib/data/resultOrThrow";
import { handleError } from "../../lib/error/handleError";
import { match } from "ts-pattern";
import { ThemeDropdownEntry } from "./ThemeDropdownEntry";
import { ImportBackupDropdownItem } from "./ImportBackupDropdownItem.tsx";
import { NavbarButton } from "./NavbarButton.tsx";
import { AppContext } from "../../lib/state/AppContext.ts";

export function InfoDropdown(props: { context: AppContext }) {
  const [version, setVersion] = useState<Loadable<string>>({ type: "loading" });

  const reloadVersion = useCallback(() => {
    getVersion()
      .then((result) => {
        const data = resultOrThrow(result);
        setVersion({ type: "data", data: data.version });
      })
      .catch((error: unknown) => {
        setVersion({ type: "error", message: handleError(error) });
      });
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
        <Dropdown.Menu>
          <Dropdown.Item disabled>Theme</Dropdown.Item>
          <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
          <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
          <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
          <Dropdown.Divider />

          <Dropdown.Item disabled>
            Client ({props.context.env.VERSION})
          </Dropdown.Item>
          <Dropdown.Item disabled>Mode: {import.meta.env.MODE}</Dropdown.Item>
          <Dropdown.Divider />

          <Dropdown.Item disabled>
            Server (
            {match(version)
              .with({ type: "loading" }, () => <span>loading...</span>)
              .with({ type: "data" }, ({ data }) => <span>{data}</span>)
              .with({ type: "error" }, ({ message }) => <span>{message}</span>)
              .exhaustive()}
            )
          </Dropdown.Item>
          <Dropdown.Item href={props.context.env.BACKEND_URL} target={"_blank"}>
            <span className="me-1">{props.context.env.BACKEND_URL}</span>
            <span className="me-2"></span>
            <i className="bi bi-box-arrow-up-right"></i>
          </Dropdown.Item>
          <Dropdown.Item
            href={props.context.env.BACKEND_URL + "/system/backup"}
            target={"_blank"}
          >
            <span className="me-1">Download Backup (.tar.gz)</span>
            <span className="me-2"></span>
            <i className="bi bi-download"></i>
          </Dropdown.Item>
          <ImportBackupDropdownItem></ImportBackupDropdownItem>
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
}
