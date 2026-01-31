import { DropdownButton } from "../elements/DropdownButton.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Dropdown } from "react-bootstrap";
import { useAppContext } from "../../state/AppContextData.ts";
import { useNavigate } from "react-router";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";

export function AuthButton() {
  const context = useAppContext();
  const isLoggedIn = useIsLoggedIn();
  const username = useBearStore((s) => s.global.auth.username);
  const showLoginWindow = useBearStore((s) => s.global.auth.loginWindow.show);
  const navigate = useNavigate();

  return (
    <>
      <DropdownButton
        title={
          isLoggedIn ? (
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
        {isLoggedIn && (
          <Dropdown.Item
            className={"small"}
            onClick={() => {
              context.logout(navigate);
            }}
          >
            <i className={"bi bi-person me-2"}></i>
            Logout
          </Dropdown.Item>
        )}
        {!isLoggedIn && (
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
    </>
  );
}
