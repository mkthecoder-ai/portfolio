import type { Certification, StackGroup, StackItem, WorkItem } from "./types";

const norm = (s: string) => s.trim().toLowerCase();
const namesOf = (item: StackItem) => [item.name, ...(item.aliases ?? [])].map(norm);

/** Work items whose stack mentions this tool by name or alias, in work order (for v1.1). */
export function usedIn(item: StackItem, work: WorkItem[]): WorkItem[] {
  const names = new Set(namesOf(item));
  return work.filter((w) => w.stack.some((term) => names.has(norm(term))));
}

/** Work stack terms that are neither a stack item, an alias nor explicitly allowed. */
export function unknownWorkTerms(groups: StackGroup[], work: WorkItem[], allowed: string[]): string[] {
  const known = new Set([...groups.flatMap((g) => g.items.flatMap(namesOf)), ...allowed.map(norm)]);
  return [...new Set(work.flatMap((w) => w.stack).filter((term) => !known.has(norm(term))))];
}

/** The stack item for a work term, if any. */
export function stackItemFor(term: string, groups: StackGroup[]): StackItem | undefined {
  const t = norm(term);
  return groups.flatMap((g) => g.items).find((i) => namesOf(i).includes(t));
}

/** The one line shown on the home page: the problem, or the summary for personal projects. */
export const oneLiner = (w: WorkItem) => w.problem ?? w.summary;

/** The year a certification was earned (from its ISO date). */
export const yearEarned = (c: Certification) => c.earned.slice(0, 4);
