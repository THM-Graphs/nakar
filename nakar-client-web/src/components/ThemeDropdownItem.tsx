import { userTheme as userThemeSubject } from "../theme.ts";
import { NavDropdown } from "react-bootstrap";
import clsx from "clsx";
import { useEffect, useState } from "react";

export function ThemeDropdownItem(props: {
  icon: string;
  title: string;
  targetTheme: "dark" | "light" | null;
}) {
  const [userTheme, setUserTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const s = userThemeSubject.asObservable().subscribe((next) => {
      setUserTheme(next);
    });
    return () => {
      s.unsubscribe();
    };
  }, []);

  return (
    <>
      <NavDropdown.Item
        onClick={() => {
          userThemeSubject.next(props.targetTheme);
        }}
      >
        <i
          style={{ width: "20px" }}
          className={clsx(
            userTheme == props.targetTheme ? "bi bi-check-lg" : null,
            "d-inline-block me-2",
          )}
        ></i>
        <i className={`bi bi-${props.icon} me-1`}></i>
        {props.title}
      </NavDropdown.Item>
    </>
  );
}
