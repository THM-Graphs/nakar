import { UpdateNodeConfigurationRequestBodyDto } from "api-client";
import { useCallback } from "react";
import { v4 } from "uuid";
import { Card, Stack } from "react-bootstrap";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { NodeConfigurationEditor } from "./NodeConfigurationEditor.tsx";

export function NodeConfigurationsEditor(props: {
  value: UpdateNodeConfigurationRequestBodyDto[];
  onChange: (newValue: UpdateNodeConfigurationRequestBodyDto[]) => void;
}) {
  const addNodeConfiguration = useCallback(() => {
    const newNodeConfiguration: UpdateNodeConfigurationRequestBodyDto = {
      id: v4(),
      type: "link",
      property: "",
      label: "",
      linkTemplate: "",
      urlEncode: false,
    };
    props.onChange([...props.value, newNodeConfiguration]);
  }, [props.value, props.onChange]);

  const removeNodeConfiguration = useCallback(
    (id: string) => {
      props.onChange(props.value.filter((p) => p.id !== id));
    },
    [props.value, props.onChange],
  );

  return (
    <Stack>
      <h5>Node Configurations</h5>
      <Stack gap={1}>
        {props.value.map((entry: UpdateNodeConfigurationRequestBodyDto) => (
          <NodeConfigurationEditor
            key={entry.id}
            value={entry}
            onChange={(
              newEntry: UpdateNodeConfigurationRequestBodyDto,
            ): void => {
              props.onChange(
                props.value.map(
                  (
                    p: UpdateNodeConfigurationRequestBodyDto,
                  ): UpdateNodeConfigurationRequestBodyDto =>
                    p.id === newEntry.id ? newEntry : p,
                ),
              );
            }}
            onDelete={(e) => {
              e.preventDefault();
              if (entry.label === "" || confirm("Remove node configuration?")) {
                removeNodeConfiguration(entry.id);
              }
            }}
          ></NodeConfigurationEditor>
        ))}

        <Card>
          <NavbarButton
            className={"align-self-stretch pt-1 pb-1"}
            icon={"plus-lg"}
            title={"Add Node Configuration"}
            onClick={(e) => {
              e.preventDefault();
              addNodeConfiguration();
            }}
          ></NavbarButton>
        </Card>
      </Stack>
    </Stack>
  );
}
