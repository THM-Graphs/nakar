import { useRef, useState } from "react";
import { Alert, Button, Form, Spinner, Stack } from "react-bootstrap";
import { canvasDatabaseConnectionControllerRunPrompt } from "api-client";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";

export function PromptPanel() {
  const context = useCanvasContext();
  const panel = useBearStore((s) => s.room.panels.prompt);
  const isLoggedIn = useIsLoggedIn();
  const databases = context.initialRoomData.databases;
  const [databaseId, setDatabaseId] = useState(databases[0]?.id ?? "");
  const [running, setRunning] = useState(false);
  const submitting = useRef(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (
      submitting.current ||
      !isLoggedIn ||
      !databaseId ||
      !panel.promptText.trim()
    ) {
      return;
    }
    submitting.current = true;
    setRunning(true);
    setError(null);
    setQuery("");
    try {
      const result = resultOrThrow(
        await canvasDatabaseConnectionControllerRunPrompt({
          path: {
            roomId: context.initialRoomData.id,
            canvasId: context.initialCanvasData.id,
            databaseId,
          },
          body: { prompt: panel.promptText.trim() },
        }),
      );
      setQuery(result.query);
    } catch (cause: unknown) {
      const message =
        cause instanceof Error
          ? cause.message
          : typeof cause === "object" && cause != null && "message" in cause
            ? String(cause.message)
            : "The prompt could not be executed. Please try again.";
      setError(message);
    } finally {
      submitting.current = false;
      setRunning(false);
    }
  };

  return (
    <Panel title="Prompt" onClose={panel.hide}>
      <Stack className="p-2" gap={3}>
        {databases.length === 0 ? (
          <p className="small text-muted">
            No database is available in this room.
          </p>
        ) : (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <Form.Group className="mb-3" controlId="prompt-database">
              <Form.Label className="small">Database</Form.Label>
              <Form.Select
                value={databaseId}
                disabled={running}
                onChange={(event) => {
                  setDatabaseId(event.target.value);
                  setQuery("");
                  setError(null);
                }}
              >
                {databases.map((database) => (
                  <option key={database.id} value={database.id}>
                    {database.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3" controlId="prompt-input">
              <Form.Label className="small">
                Describe what you want to explore
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                maxLength={4000}
                placeholder="Show people and the letters they sent to each other."
                value={panel.promptText}
                disabled={running}
                onChange={(event) => {
                  panel.setPromptText(event.target.value);
                }}
              />
              <Form.Text>
                The database schema and your prompt are sent to the configured
                AI provider. Results replace the current graph and can be
                undone.
              </Form.Text>
            </Form.Group>
            {!isLoggedIn && (
              <p className="small text-muted">Log in to run prompt queries.</p>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={
                running ||
                !isLoggedIn ||
                !databaseId ||
                !panel.promptText.trim()
              }
            >
              {running && (
                <Spinner size="sm" className="me-2" aria-hidden="true" />
              )}
              {running
                ? "Reading schema and generating query…"
                : "Send and run"}
            </Button>
          </Form>
        )}
        {error && (
          <Alert variant="danger" className="small" role="alert">
            {error}
          </Alert>
        )}
        {query && (
          <div aria-live="polite">
            <p className="small">
              Query queued. Results will appear on the canvas.
            </p>
            <span className="small">Generated query</span>
            <pre className="small border rounded p-2 mt-1 text-wrap text-break user-select-text">
              <code>{query}</code>
            </pre>
          </div>
        )}
      </Stack>
    </Panel>
  );
}
