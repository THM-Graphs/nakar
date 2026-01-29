import { CanvasEventNodeLocksUpdated } from './CanvasEventNodeLocksUpdated';
import { CanvasEventRoomPhysicsUpdated } from './CanvasEventRoomPhysicsUpdated';
import { CanvasEventGraphMetaDataChanged } from './CanvasEventGraphMetaDataChanged';
import { CanvasEventProgressChanged } from './CanvasEventProgressChanged';
import { CanvasEventProgressCleared } from './CanvasEventProgressCleared';
import { CanvasEventGraphElementsChanged } from './CanvasEventGraphElementsChanged';
import { CanvasEventGraphTableChanged } from './CanvasEventGraphTableChanged';
import { CanvasEventEventKick } from './CanvasEventEventKick';
import { CanvasEventNotAllNodesLoaded } from './CanvasEventNotAllNodesLoaded';
import { CanvasEventError } from './CanvasEventError';
import { CanvasEventShouldShutDown } from './CanvasEventShouldShutDown';
import { CanvasEventViewSettingsChanged } from './CanvasEventViewSettingsChanged';
import { CanvasEventHistogramChanged } from './CanvasEventHistogramChanged';
import { CanvasEventNotesChanged } from './CanvasEventNotesChanged';
import { CanvasEventUserJoined } from './CanvasEventUserJoined';
import { CanvasEventUserLeft } from './CanvasEventUserLeft';
import { CanvasEventCursorChanged } from './CanvasEventCursorChanged';

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
