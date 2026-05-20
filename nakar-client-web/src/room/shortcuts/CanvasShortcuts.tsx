import { useEffect, useMemo, useRef } from "react";
import { tinykeys } from "tinykeys";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { useAppContext } from "../../state/AppContextData.ts";
import { SaveZIPAction } from "../actions/SaveZIPAction.ts";
import { SaveSVGAction } from "../actions/SaveSVGAction.ts";
import { UndoAction } from "../actions/UndoAction.ts";
import { RedoAction } from "../actions/RedoAction.ts";
import { SelectAllAction } from "../actions/SelectAllAction.ts";
import { DeselectAction } from "../actions/DeselectAction.ts";
import { RerunScenarioAction } from "../actions/RerunScenarioAction.ts";
import { RelayoutAction } from "../actions/RelayoutAction.ts";
import { UnlockAllNodesAction } from "../actions/UnlockAllNodesAction.ts";
import { FlipCanvasHorizontalAction } from "../actions/FlipCanvasHorizontalAction.ts";
import { FlipCanvasVerticalAction } from "../actions/FlipCanvasVerticalAction.ts";
import { ConnectResultNodesAction } from "../actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../actions/CompressRelationshipsAction.ts";
import { HideLabelsAction } from "../actions/HideLabelsAction.ts";
import { Action, ActionShortcut } from "../actions/Action.ts";
import { EdgeDto, NodeDto } from "../../../src-gen";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";
import { getRelationshipTypesFromEdges } from "../helper-functions/getRelationshipTypesFromEdges.ts";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { labelActions } from "../actions/groups/labelActions.ts";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";
import { relationshipTypeActions } from "../actions/groups/relationshipTypeActions.ts";

type RegisteredShortcut = {
  slug: string;
  shortcut: ActionShortcut | null;
  disabled: () => boolean;
  run: () => Promise<void>;
};

function registerShortcut<T>(action: Action<T>, params: T): RegisteredShortcut {
  return {
    slug: action.slug(),
    shortcut: action.shortcut(params),
    disabled: () => action.disabled(params),
    run: () => action.run(params),
  };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  return (
    target.closest("input, textarea, select, [contenteditable='true']") != null
  );
}

export function CanvasShortcuts() {
  const context = useAppContext();
  const roomContext = useCanvasContext();
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const setElements = useBearStore((s) => s.room.panels.inspector.setElements);
  const elements = useBearStore((s) => s.room.panels.inspector.element);
  const deselectElements = useBearStore(
    (s) => s.room.panels.inspector.deselectElements,
  );
  const undoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.undoAction,
  );
  const redoAction = useBearStore(
    (s) => s.room.scenario.graph.metaData.redoAction,
  );
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);
  const isLoggedIn = useIsLoggedIn();
  const runningActionsRef = useRef(new Set<string>());
  const selectedEdges = elements.reduce<EdgeDto[]>((akku, next) => {
    const foundEdge = graphElements.edges.find((edge) => edge.id === next);
    return foundEdge ? [...akku, foundEdge] : akku;
  }, []);
  const selectedNodes = elements.reduce<NodeDto[]>((akku, next) => {
    const foundNode = graphElements.nodes.find((node) => node.id === next);
    return foundNode ? [...akku, foundNode] : akku;
  }, []);
  const selectedRelationshipTypes =
    getRelationshipTypesFromEdges(selectedEdges);
  const selectedNodeLabels =
    selectedNodes.length === 1 ? selectedNodes[0].labels : [];
  const groupActionBindings = [
    ...nodeActions.map((action) =>
      registerShortcut(action, {
        nodes: selectedNodes,
        roomContext,
        isLoggedIn,
      }),
    ),
    ...(selectedNodeLabels.length === 1
      ? labelActions.map((action) =>
          registerShortcut(action, {
            labels: selectedNodeLabels,
            roomContext,
          }),
        )
      : []),
    ...relationshipActions.map((action) =>
      registerShortcut(action, {
        edges: selectedEdges,
        roomContext,
      }),
    ),
    ...relationshipTypeActions.map((action) =>
      registerShortcut(action, {
        relationshipTypes: selectedRelationshipTypes,
        roomContext,
      }),
    ),
  ];

  const actionBindings = useMemo(
    () =>
      [
        registerShortcut(SaveZIPAction.shared, { context }),
        registerShortcut(SaveSVGAction.shared, { selectedTab }),
        registerShortcut(UndoAction.shared, { roomContext, undoAction }),
        registerShortcut(RedoAction.shared, { roomContext, redoAction }),
        registerShortcut(SelectAllAction.shared, {
          graphElements,
          setElements,
          selectedTab,
        }),
        registerShortcut(DeselectAction.shared, { elements, deselectElements }),
        registerShortcut(RerunScenarioAction.shared, { roomContext }),
        registerShortcut(RelayoutAction.shared, {
          roomContext,
          nodes: graphElements.nodes,
          selectedTab,
        }),
        registerShortcut(UnlockAllNodesAction.shared, {
          roomContext,
          nodes: graphElements.nodes,
          selectedTab,
        }),
        registerShortcut(FlipCanvasHorizontalAction.shared, {
          roomContext,
          nodeCount: graphElements.nodes.length,
          selectedTab,
        }),
        registerShortcut(FlipCanvasVerticalAction.shared, {
          roomContext,
          nodeCount: graphElements.nodes.length,
          selectedTab,
        }),
        registerShortcut(ConnectResultNodesAction.shared, {
          roomContext,
          selectedTab,
        }),
        registerShortcut(RemoveDanglingNodesAction.shared, {
          roomContext,
          selectedTab,
        }),
        registerShortcut(CompressRelationshipsAction.shared, {
          roomContext,
          selectedTab,
        }),
        registerShortcut(HideLabelsAction.shared, {
          selectedTab,
          hideLabels,
          setHideLabels,
        }),
        ...groupActionBindings,
      ] satisfies RegisteredShortcut[],
    [
      context,
      deselectElements,
      elements,
      graphElements,
      groupActionBindings,
      hideLabels,
      isLoggedIn,
      redoAction,
      roomContext,
      selectedTab,
      setElements,
      setHideLabels,
      undoAction,
    ],
  );

  useEffect(() => {
    const seenSlugs = new Set<string>();
    const bindingsByKeys = new Map<string, RegisteredShortcut[]>();

    for (const binding of actionBindings) {
      const shortcut = binding.shortcut;
      if (shortcut == null || seenSlugs.has(binding.slug)) {
        continue;
      }
      seenSlugs.add(binding.slug);
      const registeredBindings = bindingsByKeys.get(shortcut.keys) ?? [];
      registeredBindings.push(binding);
      bindingsByKeys.set(shortcut.keys, registeredBindings);
    }

    const bindings = Object.fromEntries(
      Array.from(bindingsByKeys.entries()).map(([keys, keyBindings]) => [
        keys,
        (event: KeyboardEvent) => {
          if (event.repeat || isEditableTarget(event.target)) {
            return;
          }
          const binding = keyBindings.find(
            (candidate) => !candidate.disabled(),
          );
          if (binding == null) {
            return;
          }
          if (binding.shortcut?.preventDefault ?? false) {
            event.preventDefault();
          }
          if (runningActionsRef.current.has(binding.slug)) {
            return;
          }
          runningActionsRef.current.add(binding.slug);
          void binding.run().finally(() => {
            runningActionsRef.current.delete(binding.slug);
          });
        },
      ]),
    );

    return tinykeys(window, bindings);
  }, [actionBindings]);

  return null;
}
