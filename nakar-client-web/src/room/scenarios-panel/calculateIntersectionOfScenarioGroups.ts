import { ScenarioGroupDto } from "../../../src-gen";

/**
 * Calculates the intersection of multiple ScenarioGroupDto lists.
 *
 * The function returns only those ScenarioGroupDto objects that:
 * - exist in every provided list (matched by `group.id`)
 * - and contain only those ScenarioDto objects that also exist
 *   in every corresponding group across all lists (matched by `scenario.id`)
 *
 * Behavior:
 * - Groups not present in all lists are removed.
 * - Within matching groups, scenarios not present in all lists are removed.
 * - Groups that end up with no remaining scenarios are removed entirely.
 * - The order of groups follows the order of the first list.
 *
 * @param {ScenarioGroupDto[][]} scenarioGroups
 * An array of ScenarioGroupDto arrays. Each inner array represents
 * a separate group list to be intersected.
 *
 * @returns {ScenarioGroupDto[]}
 * A new array containing the intersected ScenarioGroupDto objects
 * with their intersected scenarios.
 *
 * @example
 * // Input:
 * // List A: Group1[S1, S2], Group2[S3]
 * // List B: Group1[S2], Group2[S3, S4]
 *
 * // Output:
 * // Group1[S2], Group2[S3]
 */
export function calculateIntersectionOfScenarioGroups(
  scenarioGroups: ScenarioGroupDto[][],
): ScenarioGroupDto[] {
  if (!scenarioGroups.length) {
    return [];
  }

  // 1️⃣ Gruppen-Schnittmenge bilden (nach id)
  const baseGroups = new Map<string, ScenarioGroupDto>();

  for (const group of scenarioGroups[0]) {
    baseGroups.set(group.id, {
      ...group,
      scenarios: [...group.scenarios],
    });
  }

  for (let i = 1; i < scenarioGroups.length; i++) {
    const currentGroupMap = new Map(scenarioGroups[i].map((g) => [g.id, g]));

    for (const [groupId, baseGroup] of baseGroups) {
      const matchingGroup = currentGroupMap.get(groupId);

      if (!matchingGroup) {
        baseGroups.delete(groupId);
        continue;
      }

      // 2️⃣ Szenario-Schnittmenge innerhalb der Gruppe
      const currentScenarioIds = new Set(
        matchingGroup.scenarios.map((s) => s.id),
      );

      baseGroup.scenarios = baseGroup.scenarios.filter((s) =>
        currentScenarioIds.has(s.id),
      );

      // 3️⃣ Gruppe entfernen, wenn keine Szenarien übrig bleiben
      if (baseGroup.scenarios.length === 0) {
        baseGroups.delete(groupId);
      }
    }
  }

  return Array.from(baseGroups.values());
}
