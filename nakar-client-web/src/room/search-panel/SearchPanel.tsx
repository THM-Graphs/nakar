import { Stack } from "react-bootstrap";
import { Panel } from "../../shared/elements/Panel.tsx";
import { useState } from "react";
import { DatabaseSelect } from "../database/DatabaseSelect.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Loadable } from "../../shared/data/Loadable.ts";
import { handleError } from "../../shared/error/handleError.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { SearchForm } from "./SearchForm.tsx";
import { SearchResultDisplay } from "./SearchResultDisplay.tsx";
import { SearchCapabilitiesDisplay } from "./SearchCapabilitiesDisplay.tsx";
import {
  canvasDatabaseConnectionControllerPerformSearch,
  NodePreviewDto,
  PostSearchResponseBodyDto,
} from "../../../src-gen";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function SearchPanel() {
  const roomContext = useCanvasContext();
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null,
  );

  const searchTerm = useBearStore((s) => s.room.panels.search.searchTerm);
  const hide = useBearStore((s) => s.room.panels.search.hide);

  const [result, setResult] = useState<Loadable<NodePreviewDto[] | null>>({
    type: "data",
    data: null,
  });

  // useEffect(() => {
  //   if (searchTerm.length > 0) {
  //     if (result.type != "loading") {
  //       void executeSearch();
  //     }
  //   } else {
  //     setResult({ type: "data", data: null });
  //   }
  // }, [searchTerm]);

  const executeSearch = async (): Promise<void> => {
    setResult({ type: "loading" });
    try {
      const postResult: PostSearchResponseBodyDto = resultOrThrow(
        await canvasDatabaseConnectionControllerPerformSearch({
          path: {
            roomId: roomContext.initialRoomData.id,
            databaseId: selectedDatabaseId ?? "",
            canvasId: roomContext.initialCanvasData.id,
          },
          body: {
            searchTerm: searchTerm,
          },
        }),
      );
      setResult({ type: "data", data: postResult.nodes });
    } catch (error) {
      setResult({ type: "error", message: handleError(error) });
    }
  };

  return (
    <Panel
      title={"Search"}
      onClose={hide}
      direction={"left"}
      toolbar={
        <DatabaseSelect
          database={selectedDatabaseId}
          onChange={setSelectedDatabaseId}
        ></DatabaseSelect>
      }
    >
      <Stack gap={5}>
        {selectedDatabaseId == null && (
          <span className={"small text-muted p-3"}>
            Select a database to search.
          </span>
        )}
        {selectedDatabaseId != null && (
          <>
            <SearchForm
              onSearch={async () => {
                await executeSearch();
              }}
            ></SearchForm>
            <SearchResultDisplay
              result={result}
              roomContext={roomContext}
              databaseId={selectedDatabaseId}
            ></SearchResultDisplay>
            <SearchCapabilitiesDisplay
              databaseId={selectedDatabaseId}
              canvasContext={roomContext}
            ></SearchCapabilitiesDisplay>
          </>
        )}
      </Stack>
      <div className={"flex-grow-1"}></div>
    </Panel>
  );
}
