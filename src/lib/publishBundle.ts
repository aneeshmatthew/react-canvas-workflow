import { journeyToN8nWorkflow } from "@/lib/adapters/n8n";
import type { JourneyDocument } from "@/lib/journeySchema";

export const PUBLISH_BUNDLE_VERSION = 1 as const;

export type PublishBundle = {
  bundleVersion: typeof PUBLISH_BUNDLE_VERSION;
  publishedAt: string;
  journey: JourneyDocument;
  /** Compiled n8n workflow JSON (stub until the compiler is fully implemented). */
  n8nWorkflow: Record<string, unknown>;
};

export function buildPublishBundle(journey: JourneyDocument): PublishBundle {
  return {
    bundleVersion: PUBLISH_BUNDLE_VERSION,
    publishedAt: new Date().toISOString(),
    journey,
    n8nWorkflow: journeyToN8nWorkflow(journey),
  };
}

export function serializePublishBundle(bundle: PublishBundle): string {
  return JSON.stringify(bundle, null, 2);
}
