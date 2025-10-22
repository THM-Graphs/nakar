import { Panel } from "../elements/Panel.tsx";
import { Alert, Form, Modal, Stack } from "react-bootstrap";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useState } from "react";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { postAuth } from "../../../src-gen";
import { Loading } from "../elements/Loading.tsx";

export function AuthModal() {
  const shown = useBearStore((s) => s.global.auth.loginWindow.shown);
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
    <Modal show={shown} onHide={hide}>
      <Panel
        title={"Login"}
        onClose={hide}
        direction={"none"}
        hidden={false}
        fullWidth={true}
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            (async () => {
              setLoading(true);
              const res = resultOrThrow(
                await postAuth({ body: { username: username, password } }),
              );
              setJWT(res.jwt);
              location.reload();
            })()
              .catch((e: unknown) => {
                if (e === "Unauthorized") {
                  setError("Wrong username or password.");
                } else {
                  setError(JSON.stringify(e));
                }
              })
              .finally(() => {
                setLoading(false);
              });
          }}
        >
          <Stack gap={0}>
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
            <Stack
              direction={"horizontal"}
              className={"justify-content-between border-top"}
            >
              <NavbarButton
                title={"Cancel"}
                className={"border-end"}
                buttonType={"button"}
                onClick={(ev) => {
                  ev.preventDefault();
                  hide();
                }}
              ></NavbarButton>
              <Stack direction={"horizontal"} gap={2}>
                {loading && <Loading size={"sm"}></Loading>}
                <NavbarButton
                  title={"Login"}
                  className={"border-start"}
                  buttonType={"submit"}
                ></NavbarButton>
              </Stack>
            </Stack>
          </Stack>
        </Form>
      </Panel>
    </Modal>
  );
}
