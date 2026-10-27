---
Implemented: true
Priority: ❗❗
Description: As a 🛠️ KG Builder, I want to generate a shareable link to a specific room that includes a scenario trigger (e.g. via URL parameters), so that users coming from external websites can directly enter Nakar and start a predefined scenario without manual interaction.
---

### Akzeptanzkriterien

1. Link-Struktur
    - Der KG Builder kann einen Link zu einem spezifischen Raum erzeugen.
    - Der Link unterstützt URL-Parameter (z. B. `?scenario=xyz`).
2. Scenario-Trigger
    - Wenn ein gültiger Scenario-Parameter im Link enthalten ist, wird das entsprechende Scenario automatisch beim Betreten des Raums gestartet.
    - Falls kein Scenario angegeben ist, wird kein automatisches Scenario gestartet.
3. Validierung
    - Wenn ein ungültiger oder nicht existierender Scenario-Parameter übergeben wird, passiert Folgendes: Das System startet **kein Scenario**.
4. Zugänglichkeit
    - Der Link funktioniert für externe Nutzer ohne vorherige Navigation innerhalb von Nakar.
5. Mehrfachverwendung
    - Der generierte Link kann mehrfach verwendet werden und verhält sich konsistent.
6. Tracking (optional, falls relevant)
    - Das System kann erkennen, dass der Nutzer über einen externen Link mit Scenario-Parameter eingestiegen ist.