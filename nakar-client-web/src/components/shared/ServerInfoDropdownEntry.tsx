import { Dropdown, Stack } from "react-bootstrap";
import { AppContext } from "../../lib/state/AppContext.ts";
import { match } from "ts-pattern";
import { useCallback, useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable.ts";
import { getVersion } from "../../../src-gen";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function ServerInfoDropdownEntry(props: { context: AppContext }) {
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
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
