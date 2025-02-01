import { Badge, Nav, Stack } from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable.ts";
import { getVersion } from "../../../src-gen";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { match } from "ts-pattern";
import { Env } from "../../lib/env/env.ts";

export function BackendBadge(props: { env: Env }) {
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

  return (
    <Badge bg="secondary">
      <Stack direction={"horizontal"} gap={1}>
        <Nav.Link href={props.env.BACKEND_URL} target={"_blank"}>
          {props.env.BACKEND_URL}
        </Nav.Link>
        {match(version)
          .with({ type: "loading" }, () => <span>(loading...)</span>)
          .with({ type: "data" }, ({ data }) => <span>({data})</span>)
          .with({ type: "error" }, ({ message }) => <span>({message})</span>)
          .exhaustive()}
      </Stack>
    </Badge>
  );
}
