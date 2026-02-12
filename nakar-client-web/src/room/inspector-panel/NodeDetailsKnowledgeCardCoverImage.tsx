import { NodeDto } from "../../../src-gen";
import { Image, Stack } from "react-bootstrap";
import { Link } from "react-router";
import { useMemo } from "react";

export function NodeDetailsKnowledgeCardCoverImage(props: { node: NodeDto }) {
  const url: URL | null = useMemo(() => {
    if (props.node.coverImageUrl == null) {
      return null;
    }
    try {
      return new URL(props.node.coverImageUrl);
    } catch (e: unknown) {
      console.error(e);
      return null;
    }
  }, [props.node.coverImageUrl]);

  return (
    <>
      {url != null && (
        <Stack className={"border-bottom position-relative bg-body p-2"}>
          <Link to={url.toString()} target={"_blank"}>
            <Image fluid={true} src={url.toString()}></Image>
          </Link>
          <span className={"small text-break"}>
            Source: <i className={"bi bi-box-arrow-up-right"}></i>{" "}
            <Link to={url.toString()} target={"_blank"}>
              {url.toString()}
            </Link>
          </span>
        </Stack>
      )}
    </>
  );
}
