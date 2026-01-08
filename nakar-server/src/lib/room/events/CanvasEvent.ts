import type { CanvasEventNodeLocksUpdated } from './CanvasEventNodeLocksUpdated';
import type { CanvasEventRoomPhysicsUpdated } from './CanvasEventRoomPhysicsUpdated';
import type { CanvasEventGraphMetaDataChanged } from './CanvasEventGraphMetaDataChanged';
import type { CanvasEventProgressChanged } from './CanvasEventProgressChanged';
import type { CanvasEventProgressCleared } from './CanvasEventProgressCleared';
import type { CanvasEventGraphElementsChanged } from './CanvasEventGraphElementsChanged';
import type { CanvasEventGraphTableChanged } from './CanvasEventGraphTableChanged';
import type { CanvasEventEventKick } from './CanvasEventEventKick';
import type { CanvasEventNotAllNodesLoaded } from './CanvasEventNotAllNodesLoaded';
import { CanvasEventError } from './CanvasEventError';
import { CanvasEventShouldShutDown } from './CanvasEventShouldShutDown';
import { CanvasEventViewSettingsChanged } from './CanvasEventViewSettingsChanged';

export type CanvasEvent =
  | CanvasEventError
  | CanvasEventGraphMetaDataChanged
  | CanvasEventGraphTableChanged
  | CanvasEventGraphElementsChanged
  | CanvasEventRoomPhysicsUpdated
  | CanvasEventNodeLocksUpdated
  | CanvasEventProgressChanged
  | CanvasEventProgressCleared
  | CanvasEventEventKick
  | CanvasEventNotAllNodesLoaded
  | CanvasEventShouldShutDown
  | CanvasEventViewSettingsChanged;
