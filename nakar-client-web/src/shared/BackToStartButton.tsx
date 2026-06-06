import { Link } from "react-router";
import { Router } from "../routing/Router.ts";
import { CMSButton } from "./cms/CMSButton.tsx";

export function BackToStartButton() {
  return (
    <Link to={Router.getHomePath()}>
      <CMSButton title={"Back to Start"}></CMSButton>
    </Link>
  );
}
