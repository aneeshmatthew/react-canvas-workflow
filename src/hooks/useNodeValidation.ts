import { useContext } from "react";
import { JourneyValidationContext } from "@/context/JourneyValidationContext";

/** Per-node validation; safe if context is missing (treat as ok for SSR/tests). */
export function useNodeValidation(nodeId: string): {
  ok: boolean;
  messages: string[];
} {
  const ctx = useContext(JourneyValidationContext);
  if (!ctx) return { ok: true, messages: [] };
  const messages = ctx.byNode[nodeId] ?? [];
  return { ok: messages.length === 0, messages };
}
