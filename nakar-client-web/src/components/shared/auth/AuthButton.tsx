import { DropdownButton } from "../DropdownButton.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { Dropdown } from "react-bootstrap";
import { useEffect, useState } from "react";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { getAuth } from "../../../../src-gen";
import { Loading } from "../Loading.tsx";

export function AuthButton() {
  const jwt = useBearStore((s) => s.global.auth.jwt);
  const setJWT = useBearStore((s) => s.global.auth.setJWT);
  const username = useBearStore((s) => s.global.auth.username);
  const setUsername = useBearStore((s) => s.global.auth.setUsername);
  const showLoginWindow = useBearStore((s) => s.global.auth.loginWindow.show);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = resultOrThrow(await getAuth());
      setUsername(res.username);
    })()
      .catch(() => {
        setUsername(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [jwt]);

  return (
    <DropdownButton
      title={
        loading ? (
          <Loading size={"sm"}></Loading>
        ) : username ? (
          <span>
            <i className={"bi bi-person-fill"}></i> {username}
          </span>
        ) : (
          <span>
            <i className={"bi bi-person"}></i>
          </span>
        )
      }
    >
      {username && (
        <Dropdown.Item
          className={"small"}
          onClick={() => {
            setJWT(null);
            location.reload();
          }}
        >
          <i className={"bi bi-person me-2"}></i>
          Logout
        </Dropdown.Item>
      )}
      {!username && (
        <Dropdown.Item
          className={"small"}
          onClick={() => {
            showLoginWindow();
          }}
        >
          <i className={"bi bi-person me-2"}></i>
          Login
        </Dropdown.Item>
      )}
    </DropdownButton>
  );
}
