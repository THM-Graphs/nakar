# Live Canvas

Ein objektorientierter Canvas-Kern für Node.js, Browser und Electron. Das Paket
verwaltet Graphen, Szenarien, Visualisierung, Benutzerrechte und eine
Physik-Simulation. Persistenz, Graphquellen, Ereignisverarbeitung und
plattformabhängige Laufzeitfunktionen sind über Delegate-Interfaces angebunden.

## Aufbau

| Bereich          | Inhalt                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `LiveCanvas`     | Lebenszyklus, Aktionsverarbeitung, History, Sitzungen und Worker-Steuerung |
| `CanvasRoom`     | Anlegen, Duplizieren, Schließen und Umbenennen von Canvases im Raum        |
| `actions/`       | Polymorphe Canvas-Aktionen und ihr Ausführungskontext                      |
| `data/`          | Datenverträge für Graphen, Szenarien, Räume und Visualisierung             |
| `delegates/`     | Schnittstellen zur einbettenden Anwendung                                  |
| `events/`        | Fachereignisse für Änderungen, Fortschritt, Anwesenheit und Fehler         |
| `graph/`         | Knoten, Beziehungen, Graphoperationen, Hierarchie-Layout und Histogramme   |
| `physics/`       | Worker-Protokoll, Worker-Steuerung, Laufzeit und Simulation                |
| `users/`         | Benutzeridentitäten und Berechtigungen                                     |
| `view-settings/` | Farben, Titel, Knotengrößen und Beziehungsbreiten                          |
| `testing/`       | `TestHarness` und Delegate-Implementierungen für Tests                     |

`CanvasAction`, `CanvasElement`, `CanvasUser` und `CanvasEvent` bilden abstrakte
Basisklassen. Konkrete Unterklassen implementieren das jeweilige Verhalten.
`CanvasNode` und `CanvasEdge` referenzieren ihre Datenobjekte; Änderungen am
Fachobjekt verändern diese Daten. `toData()` liefert tiefe Kopien.

## Verwendung

```ts
import { LiveCanvas } from './LiveCanvas';
import { AuthenticatedCanvasUser } from './users/AuthenticatedCanvasUser';
import { LoadScenarioAction } from './actions/LoadScenarioAction';
import type { CanvasDelegates } from './delegates/CanvasDelegates';

declare const delegates: CanvasDelegates;

const canvas = new LiveCanvas(
  { id: 'canvas-id', roomId: 'room-id', title: 'Untersuchung' },
  delegates,
);
const actor = new AuthenticatedCanvasUser({
  id: 'user-id',
  sessionId: 'session-id',
  username: 'Name',
  position: null,
});

await canvas.bootstrap();
await canvas.addUser(actor);
await canvas.execute(actor, new LoadScenarioAction('scenario-id'));

const snapshot = await canvas.read(actor);
const histogram = await canvas.getHistogram(actor);

await canvas.destroy();
```

Die Anwendung stellt die Delegate-Implementierungen und vertrauenswürdig
ermittelte Benutzeridentitäten bereit. `read(actor)` und `getHistogram(actor)`
prüfen den Zugriff auf den Raum. `toData()` stellt einen internen Snapshot ohne
Berechtigungsprüfung bereit.

## Delegates

| Interface                | Zuständigkeit                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `CanvasStorageDelegate`  | Canvas-Snapshots, Raumdaten, Notizen, Szenarien, Szenariogruppen und Verknüpfungsregeln |
| `GraphSourceDelegate`    | Queries, Expansionen, Verbindungssuche, kürzeste Pfade und Einzelknoten                 |
| `CanvasRoomDelegate`     | Atomare, pro Raum serialisierte Canvas-Transaktionen                                    |
| `CanvasEventDelegate`    | Synchrone Verarbeitung von Fachereignissen                                              |
| `PhysicsWorkerDelegate`  | Start, Nachrichtenübertragung und Beenden eines Workers der Zielplattform               |
| `CanvasRuntimeDelegate`  | Eindeutige IDs und abbrechbare Timer                                                    |
| `PhysicsRuntimeDelegate` | Uhr, Timer und ausgehende Nachrichten innerhalb des Physik-Workers                      |

`CanvasDelegates` fasst die sechs Delegates der Canvas-Instanz zusammen.
`PhysicsRuntimeDelegate` wird innerhalb des Workers verwendet.

`CanvasStorageDelegate.getRoom()` liefert den aktuellen Rechtezustand und die
Graphquellen des Projekts. `getNotes()` liefert die zum Graphen gehörenden
Notizen. `refreshNotes(actor)` aktualisiert deren Zuordnung auf dem Canvas.

Raumänderungen laufen über `CanvasRoomDelegate.transact()`. Der Delegate stellt
über alle Instanzen desselben Raums hinweg die Serialisierung und Atomarität
sicher. `RoomTransaction` bietet `list`, `create`, `remove` und
`rename` an. Das Anlegen eines Canvas und das Übernehmen eines optionalen
Snapshots erfolgen atomar; Fehler führen zum Rollback. Der Canvas-Kern prüft die
Raumzugehörigkeit und schützt den letzten Canvas vor dem Schließen.

## Daten und Graphoperationen

`CanvasData` enthält `GraphData` und `ViewSettingsData`. Zum Graphen gehören
Knoten, Beziehungen, Tabellenzeilen, Notizen sowie die aktive Szenario-ID mit
Parametern und Argumenten. `PropertyValue` beschreibt strukturierte JSON-Werte;
Zeitstempel werden als Strings geführt.

Elemente besitzen eine kanonische Canvas-ID und eine quellenspezifische
`nativeId`. Cluster speichern native Mitglieds-IDs in `compressed` und kanonische
Mitglieds-IDs in `compressedIds`. Beziehungen enthalten kanonische und native
Endpunkt-IDs. Damit ordnet der Graph nachgeladene Beziehungen bestehenden
Knotenclustern zu und erhält die Zuordnung von Notizen.

| Funktion                                                       | API                                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Szenario laden, additiv laden oder erneut laden                | `LoadScenarioAction`; eine Szenario-ID von `null` lädt das aktive Szenario erneut   |
| Query ausführen oder Einzelknoten laden                        | `RunQueryAction`, `LoadNodeAction`                                                  |
| Knoten und Beziehungscluster expandieren                       | `ExpandNodesAction`, `ExpandRelationshipsAction`                                    |
| Ergebnisknoten verbinden und kürzeste Pfade suchen             | `ConnectResultNodesAction`, `ShowShortestPathAction`                                |
| Graph auf Knoten, Beziehungen oder Beziehungstypen fokussieren | `FocusNodesAction`, `FocusRelationshipsAction`, `FocusRelationshipTypesAction`      |
| Elemente löschen und isolierte Knoten entfernen                | `DeleteElementsAction`, `RemoveDanglingNodesAction`                                 |
| Knoten und Beziehungen clustern                                | `CompressNodesAction`, `CompressRelationshipsAction`                                |
| Knoten anhand gemeinsamer Eigenschaften verknüpfen             | Nachverarbeitung mit `CanvasStorageDelegate.getMergeRules()`                        |
| Kreis-, Hierarchie- und Force-Directed-Layout                  | `CircleLayoutAction`, `HierarchyLayoutAction`, `ForceDirectedLayoutAction`          |
| Graph spiegeln und Knoten entsperren                           | `FlipCanvasAction`, `UnlockNodesAction`, `unlockAllNodes(actor)`, `relayout(actor)` |
| Visualisierung konfigurieren oder zurücksetzen                 | `ConfigureViewAction`, `SetViewSettingsAction`                                      |
| Histogramme mit zugehörigen Element-IDs erzeugen               | `getHistogram(actor)`, `CanvasHistogram`                                            |

`ScenarioActionFactory` erzeugt konkrete Aktionen aus den Folgeaktionen eines
Szenarios. Das Kreis-Layout verwendet `CircleLayoutEngine`. Das Hierarchie-Layout
ordnet Knoten deterministisch in Schichten an und fasst Zyklen zu Komponenten
zusammen.

## Aktionsverarbeitung und History

`LiveCanvas.execute()` serialisiert Aktionen. Jede Aktion arbeitet mit einem
`CanvasActionContext` auf einem isolierten Datenentwurf. Nach der Ausführung
ergänzt die Nachverarbeitung Verknüpfungen, Notizen und passende Knotenszenarien.
Erst der erfolgreich abgeschlossene Entwurf wird veröffentlicht. Fehler während
der Berechnung oder Nachverarbeitung verwerfen den Entwurf.

`undo(actor)` und `redo(actor)` stellen Graphzustände wieder her und speichern sie
über das Storage-Delegate. Die History hält maximal zehn Einträge pro Stapel.
Visualisierungseinstellungen und direkte Knotenbewegungen erzeugen keine
Graph-History-Einträge. `history` liefert den aktuellen Undo-/Redo-Status.
`saveGraph(actor)` speichert den aktuellen Canvas-Snapshot.

## Benutzerrechte und Sitzungen

`GuestCanvasUser` und `AuthenticatedCanvasUser` implementieren die
Berechtigungsprüfung über die gemeinsame Basis `CanvasUser`:

- Öffentliche und ungelistete Räume erlauben Gästen und angemeldeten Benutzern
  Graphaktionen und die Verwaltung der Canvases im Raum.
- Private Räume erlauben diese Nutzung dem Projekteigentümer und den
  eingetragenen Mitwirkenden.
- `canEditProject()` und `requireAccess(room, true)` gewähren Projektbearbeitung
  ausschließlich Eigentümern und Mitwirkenden.

Benutzeraktionen prüfen die aktuellen Raumdaten. Asynchrone Entwurfsaktionen
prüfen die Berechtigung zusätzlich vor der Veröffentlichung. Quellen und
Szenarien werden auf ihre Projektzugehörigkeit geprüft.

`addUser(actor)` registriert eine Sitzung. `getActiveUsers()` liefert deren
Anwesenheitsdaten. Cursoränderungen und das Greifen von Knoten benötigen eine
registrierte Sitzung; die Sitzung bleibt an ihre Benutzeridentität gebunden.
Mehrere Sitzungen können denselben Knoten greifen. `moveNodes()` bewegt die von
der jeweiligen Sitzung gegriffenen Knoten, `ungrabNode()` übernimmt die
Endposition und löst den Griff. `removeUser(sessionId)` entfernt die Sitzung und
ihre Griffe als vertrauenswürdiger Aufruf der einbettenden Anwendung.

## Physik und Worker

`CanvasPhysicsWorker` steuert den Worker über `PhysicsWorkerDelegate`.
`CanvasPhysicsRuntime` verarbeitet im Worker die `WorkerCommand`-Nachrichten
über `handle()`. Ergebnisse und Fehler werden als `WorkerEvent` zurückgegeben.
Die eigentliche Berechnung übernimmt `CanvasPhysicsSimulation`.

Graph- und Lockänderungen erhöhen die Worker-Revision. Die Worker-Steuerung
verwirft Ergebnisse älterer Revisionen sowie Nachrichten nach dem Beenden.
Gesperrte oder gegriffene Knoten behalten ihre Position. Deckungsgleiche Knoten
erhalten eine deterministische Trennrichtung.

Die Laufzeit plant Simulationsschritte im Abstand von 15 Millisekunden. Kurze
Läufe dauern eine Sekunde, lange Läufe vier Sekunden. `relayout(actor)` fordert
einen langen Lauf an; `unlockAllNodes(actor)` einen kurzen Lauf.

## Lebenszyklus und Ereignisse

Eine Canvas-Instanz durchläuft die Zustände `new`, `starting`, `ready`, `closing`
und `destroyed`. Ein fehlgeschlagener Start führt zu `failed`. `bootstrap()` lädt
die Daten und startet den Worker. `destroy()` wartet laufende Aktionen und einen
laufenden Start ab, beendet den Worker und speichert optional den letzten
Snapshot. Wiederholte Aufrufe teilen dasselbe Promise.

Bei einer betriebsbereiten Canvas-Instanz ohne registrierte Sitzungen plant
`scheduleShutdown()` nach zehn Sekunden ein `CanvasLifecycleEvent` mit
`shouldShutdown`.
`cancelShutdown()` bricht den Timer ab. Der Besitzer der Instanz verarbeitet die
Anforderung und beendet die Instanz über `destroy()`. Ein im Raum geschlossener
Canvas wird beim Beenden nicht erneut gespeichert.

Alle Fachereignisse werden an `CanvasEventDelegate.handleEvent()` übergeben:

| Ereignis               | Inhalt                                                        |
| ---------------------- | ------------------------------------------------------------- |
| `CanvasChangedEvent`   | Geänderte Canvas-Bereiche                                     |
| `CanvasPresenceEvent`  | Beitritt, Austritt und Cursoränderungen                       |
| `CanvasProgressEvent`  | Aktionsmeldung und Anzahl wartender Operationen               |
| `CanvasPhysicsEvent`   | Übernommene Positionen und Physik-Leistungsdaten              |
| `CanvasRoomEvent`      | Aktuelle Canvas-Referenzen des Raums                          |
| `CanvasLimitEvent`     | Ergebnisgröße beim Erreichen eines Quellenlimits              |
| `CanvasLifecycleEvent` | Bereitschaft, Beendigung, Physikstopp und Abschaltanforderung |
| `CanvasErrorEvent`     | Fehler aus Aktionen oder Worker-Verarbeitung                  |

Worker-Transportfehler nach einer lokalen Veröffentlichung werden als
`CanvasErrorEvent` gemeldet; der veröffentlichte Zustand bleibt erhalten.
Speicherfehler bei Undo/Redo werden an den Aufrufer weitergegeben. Synchron
werfende Event-Delegates unterbrechen die Canvas-Verarbeitung nicht; die letzten
100 Fehler stehen in `observerErrors`. Asynchrone Transporte behandeln ihre
Promise-Fehler innerhalb ihrer Delegate-Implementierung.
