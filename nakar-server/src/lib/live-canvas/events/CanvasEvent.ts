import type { CanvasEventNodeLocksUpdated } from './CanvasEventNodeLocksUpdated';
import type { CanvasEventRoomPhysicsUpdated } from './CanvasEventRoomPhysicsUpdated';
import type { CanvasEventGraphMetaDataChanged } from './CanvasEventGraphMetaDataChanged';
import type { CanvasEventProgressChanged } from './CanvasEventProgressChanged';
import type { CanvasEventProgressCleared } from './CanvasEventProgressCleared';
import type { CanvasEventGraphElementsChanged } from './CanvasEventGraphElementsChanged';
import type { CanvasEventGraphTableChanged } from './CanvasEventGraphTableChanged';
import type { CanvasEventEventKick } from './CanvasEventEventKick';
import type { CanvasEventNotAllNodesLoaded } from './CanvasEventNotAllNodesLoaded';
import type { CanvasEventError } from './CanvasEventError';
import type { CanvasEventShouldShutDown } from './CanvasEventShouldShutDown';
import type { CanvasEventViewSettingsChanged } from './CanvasEventViewSettingsChanged';
import type { CanvasEventHistogramChanged } from './CanvasEventHistogramChanged';
import type { CanvasEventNotesChanged } from './CanvasEventNotesChanged';
import type { CanvasEventUserJoined } from './CanvasEventUserJoined';
import type { CanvasEventUserLeft } from './CanvasEventUserLeft';
import type { CanvasEventCursorChanged } from './CanvasEventCursorChanged';

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
  | CanvasEventViewSettingsChanged
  | CanvasEventHistogramChanged
  | CanvasEventNotesChanged
  | CanvasEventUserJoined
  | CanvasEventUserLeft
  | CanvasEventCursorChanged;
