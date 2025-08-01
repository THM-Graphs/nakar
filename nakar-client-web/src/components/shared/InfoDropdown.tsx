import { Dropdown, Stack } from "react-bootstrap";
import { getVersion } from "../../../src-gen";
import { useCallback, useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable";
import { resultOrThrow } from "../../lib/data/resultOrThrow";
import { handleError } from "../../lib/error/handleError";
import { match } from "ts-pattern";
import { ThemeDropdownEntry } from "./ThemeDropdownEntry";
import { AppContext } from "../../lib/state/AppContext.ts";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import { DropdownButton } from "./DropdownButton.tsx";
import { ColorSchema } from "../../lib/color/ColorSchema.ts";

export function InfoDropdown(props: { context: AppContext }) {
  const [version, setVersion] = useState<Loadable<string>>({ type: "loading" });
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const colorSchema = useBearStore((s) => s.room.canvas.colorSchema);
  const setColorSchema = useBearStore((s) => s.room.canvas.setColorSchema);

  const reloadVersion = useCallback(() => {
    (async () => {
      try {
        const result = await getVersion();
        const data = resultOrThrow(result);
        setVersion({ type: "data", data: data.version });
      } catch (error) {
        setVersion({ type: "error", message: handleError(error) });
      }
    })().catch(pushErrorNotification);
  }, []);

  useEffect(() => {
    reloadVersion();
  }, []);

  return (
    <>
      <DropdownButton icon={"gear-fill"}>
        <Dropdown.Header>Theme</Dropdown.Header>
        <ThemeDropdownEntry targetTheme={null}></ThemeDropdownEntry>
        <ThemeDropdownEntry targetTheme={"light"}></ThemeDropdownEntry>
        <ThemeDropdownEntry targetTheme={"dark"}></ThemeDropdownEntry>
        <Dropdown.Divider />

        <Dropdown.Header>Color Schema</Dropdown.Header>
        <Dropdown.Item
          active={colorSchema.slug === "bootstrap"}
          onClick={() => {
            setColorSchema(ColorSchema.bootstrap());
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <span className={"small"}>Bootstrap</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Item
          active={colorSchema.slug === "pastel"}
          onClick={() => {
            setColorSchema(ColorSchema.pastel());
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <span className={"small"}>Pastel</span>
          </Stack>
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>

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
      </DropdownButton>
    </>
  );
}
