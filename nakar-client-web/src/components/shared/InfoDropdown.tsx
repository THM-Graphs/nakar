import { DropdownButton, Dropdown, Stack, Badge } from "react-bootstrap";
import { getVersion } from "../../../src-gen";
import { useState, useCallback, useEffect } from "react";
import { Loadable } from "../../lib/data/Loadable";
import { resultOrThrow } from "../../lib/data/resultOrThrow";
import { handleError } from "../../lib/error/handleError";
import { match } from "ts-pattern";
import { Env } from "../../lib/env/env";
import { ThemeDropdownEntry } from "./ThemeDropdownEntry";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine";

export function InfoDropdown(props: {
  className?: string;
  env: Env;
  renderer?: {
    current: GraphRendererEngine;
    onChange: (newRenderer: GraphRendererEngine) => void;
  };
  tableDataWindow?: {
    rowCount: number;
    isOpen: boolean;
    onToggle: () => void;
  };
}) {
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

  const renderer = props.renderer;
  const tableDataWindow = props.tableDataWindow;

  return (
    <DropdownButton
      className={props.className}
      variant={"secondary"}
      size={"sm"}
      align={"end"}
      title={
        <span>
          <i className={`bi bi-gear-fill me-1`}></i>
        </span>
      }
    >
      {tableDataWindow && (
        <>
          <Dropdown.Item
            onClick={() => {
              tableDataWindow.onToggle();
            }}
            active={tableDataWindow.isOpen}
          >
            <Stack
              direction={"horizontal"}
              gap={2}
              className={"align-items-baseline"}
            >
              <i className={"bi bi-table"}></i>
              <span>Table</span>
              <Badge bg="secondary">{tableDataWindow.rowCount}</Badge>
            </Stack>
          </Dropdown.Item>
          <Dropdown.Divider />
        </>
      )}

      <Dropdown.Item disabled>Theme</Dropdown.Item>
      <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
      <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
      <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
      <Dropdown.Divider />

      {renderer && (
        <>
          <Dropdown.Item disabled>Renderer</Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              renderer.onChange("d3");
            }}
            active={renderer.current === "d3"}
          >
            D3.js
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              renderer.onChange("nvl");
            }}
            active={renderer.current === "nvl"}
          >
            Neo4j Visualization Library
          </Dropdown.Item>
          <Dropdown.Divider />
        </>
      )}

      <Dropdown.Item disabled>Client ({props.env.VERSION})</Dropdown.Item>
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
      <Dropdown.Item href={props.env.BACKEND_URL} target={"_blank"}>
        <span className="me-1">{props.env.BACKEND_URL}</span>
        <span className="me-2"></span>
        <i className="bi bi-box-arrow-up-right"></i>
      </Dropdown.Item>
    </DropdownButton>
  );
}
