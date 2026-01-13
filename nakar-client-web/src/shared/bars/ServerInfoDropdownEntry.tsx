import { Dropdown, Stack } from "react-bootstrap";
import { AppContext } from "../../state/AppContext.ts";
import { match } from "ts-pattern";
import { useCallback, useEffect, useState } from "react";
import { Loadable } from "../data/Loadable.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { handleError } from "../error/handleError.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import {
  GetVersionResponseBodyDto,
  systemControllerGetVersion,
} from "../../../src-gen";

export function ServerInfoDropdownEntry(props: { context: AppContext }) {
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const [version, setVersion] = useState<Loadable<string>>({ type: "loading" });
  const reloadVersion = useCallback(() => {
    (async () => {
      try {
        const data: GetVersionResponseBodyDto = resultOrThrow(
          await systemControllerGetVersion(),
        );
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
    </>
  );
}
