import type { JourneyDocument } from "@/lib/journeySchema";

/**
 * Compiles a journey document to an n8n workflow JSON shape (stub for a future phase).
 * Authoring stays in React; n8n runs the compiled graph headlessly.
 */
export function journeyToN8nWorkflow(journey: JourneyDocument): Record<string, unknown> {
  return {
    name: journey.meta?.name ?? "Journey (compiled)",
    nodes: [],
    connections: {},
    meta: { template: "journey-to-n8n-stub" },
  };
}
