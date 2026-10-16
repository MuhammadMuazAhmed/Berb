export const STATUSES = ["pending", "assigned", "in_progress", "completed", "rejected", "cancelled"] as const;
export type Status = (typeof STATUSES)[number];
/** Statuses that block a team member's calendar. */
export const BLOCKING: Status[] = ["assigned", "in_progress"];
/**
 * pending      -> assigned | rejected | cancelled
 * assigned     -> in_progress | cancelled   (re-scheduling keeps `assigned`)
 * in_progress  -> completed | cancelled
 * completed / rejected / cancelled are terminal.
 */
export const TRANSITIONS: Record<Status, Status[]> = {
  pending: ["assigned", "rejected", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [], rejected: [], cancelled: [],
};
export const canTransition = (from: Status, to: Status) => TRANSITIONS[from].includes(to);
