/**
 * Logs an activity and triggers a step notification email.
 * Fire-and-forget — safe to call from any client or server context.
 */
export function logActivity({
  projectId,
  actorType,
  action,
  details,
}: {
  projectId: string;
  actorType: "client" | "admin";
  action: string;
  details?: string;
}) {
  fetch("/api/send-step-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, actorType, action, details }),
  }).catch(() => {});
}
