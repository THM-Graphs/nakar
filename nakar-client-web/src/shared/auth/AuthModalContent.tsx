import {
  Alert,
  Button,
  Form,
  Modal,
  Spinner,
  Stack,
  Tab,
  Tabs,
} from "react-bootstrap";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { authControllerPostAuth, authControllerPostRegister } from "api-client";
import { match } from "ts-pattern";
import { handleError } from "../error/handleError.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { useState } from "react";
import { CMSButton } from "../cms/CMSButton.tsx";
import { useNavigate } from "react-router";

export function AuthModalContent() {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <Modal.Header closeButton={true}>Login / Register</Modal.Header>
      <Tabs
        defaultActiveKey="login"
        id="auth-tabs"
        className="px-3 pt-3"
        mountOnEnter
      >
        <Tab eventKey="login" title="Login" disabled={loading}>
          <AuthForm mode="login" loading={loading} setLoading={setLoading} />
        </Tab>
        <Tab eventKey="register" title="Register" disabled={loading}>
          <AuthForm mode="register" loading={loading} setLoading={setLoading} />
        </Tab>
      </Tabs>
    </>
  );
}

function AuthForm({
  mode,
  loading,
  setLoading,
}: {
  mode: "login" | "register";
  loading: boolean;
  setLoading: (value: boolean) => void;
}) {
  const registering = mode === "register";
  const usernameLabel = registering ? "Username" : "Username / Email address";
  const hide = useBearStore((s) => s.global.auth.loginWindow.hide);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatedPassword, setRepeatedPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setJWT = useBearStore((s) => s.global.auth.setJWT);
  const navigate = useNavigate();

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (loading) {
          return;
        }
        if (registering && password !== repeatedPassword) {
          setError("Passwords do not match.");
          return;
        }
        setError(null);
        setLoading(true);
        (async () => {
          const res = resultOrThrow(
            registering
              ? await authControllerPostRegister({
                  body: { username, email, password },
                })
              : await authControllerPostAuth({ body: { username, password } }),
          );
          setJWT(res.jwt);
          await navigate(0);
        })()
          .catch((e: unknown) => {
            setError(
              match(e)
                .with({ statusCode: 401 }, () => "Wrong username or password.")
                .with(
                  { statusCode: 409 },
                  () => "Username or email address is already in use.",
                )
                .with(
                  { statusCode: 503 },
                  () => "Registration is currently unavailable.",
                )
                .otherwise(handleError),
            );
          })
          .finally(() => {
            setLoading(false);
          });
      }}
    >
      <Stack gap={3} className={"p-3"}>
        <Form.Group controlId={`${mode}-username`}>
          <Form.Label className="small">{usernameLabel}</Form.Label>
          <Form.Control
            autoFocus={!registering}
            size="sm"
            type="text"
            autoComplete="username"
            placeholder={usernameLabel}
            value={username}
            required={registering}
            minLength={registering ? 3 : undefined}
            maxLength={registering ? 255 : undefined}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
        </Form.Group>
        {registering && (
          <Form.Group controlId="register-email">
            <Form.Label className="small">Email address</Form.Label>
            <Form.Control
              type="email"
              size="sm"
              autoComplete="email"
              placeholder="Email address"
              required
              maxLength={254}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
            />
          </Form.Group>
        )}
        <Form.Group controlId={`${mode}-password`}>
          <Form.Label className="small">Password</Form.Label>
          <Form.Control
            size={"sm"}
            type="password"
            autoComplete={registering ? "new-password" : "current-password"}
            placeholder="Password"
            value={password}
            required={registering}
            minLength={registering ? 6 : undefined}
            maxLength={registering ? 72 : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
        </Form.Group>
        {registering && (
          <Form.Group controlId="register-repeat-password">
            <Form.Label className="small">Repeat password</Form.Label>
            <Form.Control
              size="sm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              required
              value={repeatedPassword}
              onChange={(e) => {
                setRepeatedPassword(e.target.value);
              }}
            />
          </Form.Group>
        )}
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
          title="Cancel"
          variant={"secondary"}
          onClick={(ev) => {
            ev.preventDefault();
            hide();
          }}
        ></CMSButton>
        <Button
          type="submit"
          size="sm"
          className="shadow-sm"
          disabled={loading}
        >
          {registering ? "Register" : "Login"}
        </Button>
      </Modal.Footer>
    </Form>
  );
}
