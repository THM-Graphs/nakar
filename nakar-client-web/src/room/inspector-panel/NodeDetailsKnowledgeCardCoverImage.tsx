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
          <span className={"small ps-1 pe-1"}>
            Source:{" "}
            <Link to={url.toString()} target={"_blank"}>
              {url.host}
            </Link>
          </span>
        </Stack>
      )}
    </>
  );
}
