import { visibleLessons } from '../content';
import type { Lane, Unit } from '../content/schemas';
import {
  UNIT_OVERVIEW_SECTIONS,
  type UnitOverviewAcknowledgement,
  type UnitOverviewSection,
} from './crate';

export function hasAcknowledgedUnitOverviewSection(
  acknowledgements: readonly UnitOverviewAcknowledgement[],
  unitId: string,
  section: UnitOverviewSection
): boolean {
  return acknowledgements.some((item) => item.unitId === unitId && item.section === section);
}

export function isUnitOverviewComplete(
  acknowledgements: readonly UnitOverviewAcknowledgement[],
  unitId: string
): boolean {
  return UNIT_OVERVIEW_SECTIONS.every((section) =>
    hasAcknowledgedUnitOverviewSection(acknowledgements, unitId, section)
  );
}

export function firstIncompleteUnitOverviewSection(
  acknowledgements: readonly UnitOverviewAcknowledgement[],
  unitId: string
): UnitOverviewSection | undefined {
  return UNIT_OVERVIEW_SECTIONS.find(
    (section) => !hasAcknowledgedUnitOverviewSection(acknowledgements, unitId, section)
  );
}

/** Completion follows the family's current lane and requires every visible checkpoint. */
export function isRouteComplete(unit: Unit, lane: Lane, explored: readonly string[]): boolean {
  const lessons = visibleLessons(unit, lane);
  return lessons.length > 0 && lessons.every((lesson) => explored.includes(lesson.id));
}
