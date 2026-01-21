import { Alert, Form, Modal, Spinner, Stack } from "react-bootstrap";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { authControllerPostAuth } from "../../../src-gen";
import { match } from "ts-pattern";
import { handleError } from "../error/handleError.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { useState } from "react";
import { CMSButton } from "../cms/CMSButton.tsx";

export function AuthModalContent() {
  const hide = useBearStore((s) => s.global.auth.loginWindow.hide);
  const username = useBearStore((s) => s.global.auth.loginWindow.username);
  const setUsername = useBearStore(
    (s) => s.global.auth.loginWindow.setUsername,
  );
  const password = useBearStore((s) => s.global.auth.loginWindow.password);
  const setPassword = useBearStore(
    (s) => s.global.auth.loginWindow.setPassword,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const setJWT = useBearStore((s) => s.global.auth.setJWT);

  return (
    <>
      <Modal.Header closeButton={true}>Login</Modal.Header>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          (async () => {
            setLoading(true);
            const res = resultOrThrow(
              await authControllerPostAuth({
                body: { username: username, password },
              }),
            );
            setJWT(res.jwt);
            location.reload();
          })()
            .catch((e: unknown) => {
              setError(
                match(e)
                  .with(
                    { statusCode: 401 },
                    () => "Wrong username or password.",
                  )
                  .otherwise(handleError),
              );
            })
            .finally(() => {
              setLoading(false);
            });
        }}
      >
        <Stack gap={2} className={"p-2"}>
          <Form.Group controlId={"email"}>
            <Form.Label className={"small"}>
              Username / Email address
            </Form.Label>
            <Form.Control
              size={"sm"}
              type="text"
              placeholder="Username / Email address"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            />
          </Form.Group>
          <Form.Group controlId={"password"}>
            <Form.Label className={"small"}>Password</Form.Label>
            <Form.Control
              size={"sm"}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
            />
          </Form.Group>
        </Stack>
        {error && (
          <Alert
            variant={"danger"}
            className={"m-2 small"}
            dismissible
            onClose={() => {
              setError(null);
            }}
          >
            {error}
          </Alert>
        )}
        <Modal.Footer>
          {loading && <Spinner variant={"primary"} size={"sm"}></Spinner>}
          <CMSButton
            title={"Cancel"}
            variant={"secondary"}
            onClick={(ev) => {
              ev.preventDefault();
              hide();
            }}
          ></CMSButton>
          <CMSButton
            title={"Login"}
            type={"submit"}
            variant={"primary"}
          ></CMSButton>
        </Modal.Footer>
      </Form>
    </>
  );
}
