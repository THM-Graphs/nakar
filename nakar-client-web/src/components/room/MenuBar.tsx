import { Dropdown, Stack } from "react-bootstrap";
import { DropdownButton } from "../shared/DropdownButton.tsx";
import { ThemeDropdownEntries } from "../shared/ThemeDropdownEntry.tsx";
import { ColorSchemaDropdownEntries } from "../shared/ColorSchemaDropdownEntries.tsx";
import { ClientInfoDropdownEntry } from "../shared/ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "../shared/ServerInfoDropdownEntry.tsx";
import { AppContext } from "../../lib/state/AppContext.ts";

export function MenuBar(props: { context: AppContext }) {
  return (
    <Stack direction={"horizontal"}>
      <DropdownButton title={"File"}>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-plus-lg me-1"}></i> New Scenario
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-plus-lg me-1"}></i> New Scenario Group
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-floppy me-1"}></i> Save as SVG-File
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-floppy me-1"}></i> Save as ZIP-File
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-chevron-left me-1"}></i> Close Room
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"Edit"}>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-arrow-left me-1"}></i> Undo
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-arrow-right me-1"}></i> Redo
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>Select all</Dropdown.Item>
        <Dropdown.Item className={"small"}>Deselect</Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-zoom-in me-1"}></i> Expand Node
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-eye-slash me-1"}></i> Remove Node
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-binoculars me-1"}></i> Focus Node
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-unlock me-1"}></i> Unlock Node
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-eye-slash me-1"}></i> Remove Relationship
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-pen me-1"}></i> Edit Room
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-pen me-1"}></i> Edit Scenario
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"Canvas"}>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-tropical-storm me-1"}></i> Relayout
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-unlock me-1"}></i> Unlock all nodes
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-aspect-ratio me-1"}></i> Zoom to fit
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-crosshair me-1"}></i> Zoom to selected elements
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-zoom-in me-1"}></i> Zoom in
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-zoom-out me-1"}></i> Zoom out
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"Scenario"}>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-arrow-clockwise me-1"}></i> Re-Run
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-intersect me-1"}></i> Connect Result Nodes
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-eye-slash me-1"}></i> Remove Dangling Nodes
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-arrows-collapse me-1"}></i> Compress
          Relationships
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"View"}>
        <Dropdown.Header>Theme</Dropdown.Header>
        <ThemeDropdownEntries></ThemeDropdownEntries>
        <Dropdown.Header>Color Schema</Dropdown.Header>
        <ColorSchemaDropdownEntries></ColorSchemaDropdownEntries>
        <Dropdown.Header className={"small"}>Tool Windows</Dropdown.Header>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-easel me-1"}></i> Scenarios
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-play-circle me-1"}></i> Query
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-info-circle me-1"}></i> Inspector
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-bar-chart me-1"}></i> Histogram
        </Dropdown.Item>
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header className={"small"}>Canvas</Dropdown.Header>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-bounding-box-circles me-1"}></i> Graph
        </Dropdown.Item>
        <Dropdown.Item className={"small"}>
          <i className={"bi bi-table me-1"}></i> Table
        </Dropdown.Item>
      </DropdownButton>
      <DropdownButton title={"Help"}>
        <ClientInfoDropdownEntry
          context={props.context}
        ></ClientInfoDropdownEntry>
        <ServerInfoDropdownEntry
          context={props.context}
        ></ServerInfoDropdownEntry>
      </DropdownButton>
    </Stack>
  );
}
