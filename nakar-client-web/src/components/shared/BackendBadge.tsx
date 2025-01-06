import { env } from "../../lib/env/env.ts";
import { Badge, Nav, Stack } from "react-bootstrap";
import { useCallback, useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable.ts";
import { getHealth } from "../../../src-gen";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { match } from "ts-pattern";

export function BackendBadge() {
  const [version, setVersion] = useState<Loadable<string>>({ type: "loading" });

  const reloadHealth = useCallback(() => {
    getHealth()
      .then((result) => {
        const data = resultOrThrow(result);
        setVersion({ type: "data", data: data.version });
      })
      .catch((error: unknown) => {
        setVersion({ type: "error", message: handleError(error) });
      });
  }, []);

  useEffect(() => {
    reloadHealth();
  }, []);

  return (
    <Nav.Link href={env().BACKEND_URL} target={"_blank"}>
      <Badge bg="secondary">
        <Stack direction={"horizontal"} gap={1}>
          <span>{env().BACKEND_URL}</span>
          {match(version)
            .with({ type: "loading" }, () => <span>(loading...)</span>)
            .with({ type: "data" }, ({ data }) => <span>({data})</span>)
            .with({ type: "error" }, ({ message }) => <span>({message})</span>)
            .exhaustive()}
        </Stack>
      </Badge>
    </Nav.Link>
  );
}
