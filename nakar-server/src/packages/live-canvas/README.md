# Live Canvas

Ein objektorientierter Canvas-Kern für Node.js, Browser und Electron. Das Paket
verwaltet Graphen, Szenarien, Visualisierung, Benutzerrechte und eine
Physik-Simulation. Persistenz, Graphquellen, Ereignisverarbeitung und
plattformabhängige Laufzeitfunktionen sind über Delegate-Interfaces angebunden.

## Aufbau

| Bereich          | Inhalt                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| `canvas/`        | `LiveCanvas` zur Canvas-Steuerung und `RoomCanvasManager` für die Canvases eines Raums |
| `actions/`       | Polymorphe Canvas-Aktionen und ihr Ausführungskontext                                  |
| `data/`          | Datenverträge für Graphen, Szenarien, Räume und Visualisierung                         |
| `delegates/`     | Schnittstellen zur einbettenden Anwendung                                              |
| `error/`         | Fachliche Fehlerklassen mit stabilen Fehlercodes                                       |
| `events/`        | Fachereignisse für Änderungen, Fortschritt, Anwesenheit und Fehler                     |
| `graph/`         | Knoten, Beziehungen, Graphoperationen, Hierarchie-Layout und Histogramme               |
| `physics/`       | Worker-Protokoll, Worker-Steuerung, Laufzeit und Simulation                            |
| `users/`         | Benutzeridentitäten und Berechtigungen                                                 |
| `view-settings/` | Farben, Titel, Knotengrößen und Beziehungsbreiten                                      |
| `testing/`       | `TestHarness` und Delegate-Implementierungen für Tests                                 |

`CanvasAction`, `CanvasElement`, `CanvasUser` und `CanvasEvent` bilden abstrakte
Basisklassen. Konkrete Unterklassen implementieren das jeweilige Verhalten.
`CanvasNode` und `CanvasEdge` referenzieren ihre Datenobjekte; Änderungen am
Fachobjekt verändern diese Daten. `toData()` liefert tiefe Kopien.

## Verwendung

```ts
import { LiveCanvas } from './canvas/LiveCanvas';
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

`RoomCanvasManager` verwaltet die Canvases eines Raums über
`CanvasRoomDelegate.transact()`. Der Delegate stellt
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

## Automatisches Speichern

`LiveCanvas` fordert nach erfolgreich übernommenen Canvas-Änderungen automatisch
`CanvasStorageDelegate.save()` mit einem unabhängigen Snapshot an. Dazu gehören
Graphaktionen, Visualisierungseinstellungen, aktualisierte Notizzuordnungen,
Knotenpositionen und Locks sowie übernommene Physikpositionen. Lesezugriffe,
Anwesenheit, Cursorbewegungen und das reine Greifen eines Knotens lösen keine
Speicherung aus.

Die erste Änderung plant eine Speicherung nach einer Sekunde über das
Runtime-Delegate. Weitere Änderungen werden bis dahin zusammengefasst, ohne den
Termin zu verschieben. Während fortlaufender Änderungen werden weitere
Speicherungen angefordert. Ohne neue Änderungen gibt es keine periodischen
Schreibzugriffe.

Speicherungen laufen innerhalb der Canvas-Warteschlange. Änderungen durch
Physiknachrichten während eines laufenden Speichervorgangs bleiben vorgemerkt
und werden anschließend mit einem weiteren Snapshot gespeichert. Ein Fehler
beim automatischen Speichern erzeugt ein `CanvasErrorEvent`; nach einer Sekunde
wird die Speicherung des aktuellen Zustands erneut versucht.

`saveGraph(actor)` sowie Undo/Redo speichern unmittelbar und ersetzen einen noch
ausstehenden automatischen Speichertermin. Beim Beenden wird der Timer
abgebrochen und `destroy()` speichert den letzten Zustand nach dem Stoppen des
Workers. `destroy(false)` verzichtet auf die abschließende Speicherung. Ein im
Raum geschlossener Canvas wird nicht erneut gespeichert.

## Benutzerrechte und Sitzungen

`GuestCanvasUser`, `AuthenticatedCanvasUser` und `RootUser` implementieren die
Berechtigungsprüfung über die gemeinsame Basis `CanvasUser`:

- Öffentliche und ungelistete Räume erlauben Gästen und angemeldeten Benutzern
  Graphaktionen und die Verwaltung der Canvases im Raum.
- Private Räume erlauben diese Nutzung dem Projekteigentümer und den
  eingetragenen Mitwirkenden sowie `RootUser`.
- `canEditProject()` und `requireAccess(room, true)` gewähren Projektbearbeitung
  Eigentümern, Mitwirkenden und `RootUser`.

`RootUser` besitzt unabhängig von Sichtbarkeit, Eigentümer und Mitwirkenden alle
Nutzungs- und Projektbearbeitungsrechte. Die einbettende Anwendung stellt diese
vertrauenswürdige Benutzerklasse bereit.

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

`CanvasPhysicsWorker` verwaltet den Worker über `PhysicsWorkerDelegate`.
Die Simulation berechnet fortlaufend Ticks und veröffentlicht standardmäßig
16-mal pro Sekunde Positionen. Gesperrte oder gegriffene Knoten bleiben fixiert;
veraltete Worker-Ergebnisse werden verworfen.

`CanvasPhysicsOptions` konfiguriert Simulation und Ausgaberate. Läufe können
kurz (1 s), lang (4 s), zeitlich begrenzt oder unbegrenzt bis `stop()` sein.

## Fehler

`CanvasError` ist die abstrakte Basis der fachlichen Fehler. Konkrete Klassen
stellen den Fehlercode über `code`, ihren Klassennamen über `name` und die
Beschreibung über `message` bereit. Sie lassen sich über `instanceof` sowohl
gemeinsam als auch nach ihrem konkreten Typ behandeln.

| Klasse              | Fehlercode      | Bedeutung                                                                  |
| ------------------- | --------------- | -------------------------------------------------------------------------- |
| `ForbiddenError`    | `forbidden`     | Fehlende Berechtigung, Sitzung oder Projektzugehörigkeit                   |
| `NotFoundError`     | `not-found`     | Angeforderter Canvas, Graphbestandteil oder Szenario nicht verfügbar       |
| `ConflictError`     | `conflict`      | Zustandskonflikt, etwa Sitzungsübernahme oder Schließen des letzten Canvas |
| `InvalidDataError`  | `invalid-data`  | Ungültige Eingaben oder Konfigurationswerte                                |
| `InvalidStateError` | `invalid-state` | Operation im aktuellen Canvas- oder Worker-Zustand nicht zulässig          |

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
