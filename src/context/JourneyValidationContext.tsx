/* Context + provider; hook lives in hooks/useNodeValidation.ts */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { JourneyValidationResult } from "@/lib/journeyValidation";

export const JourneyValidationContext =
  createContext<JourneyValidationResult | null>(null);

export function JourneyValidationProvider({
  value,
  children,
}: {
  value: JourneyValidationResult;
  children: ReactNode;
}) {
  return (
    <JourneyValidationContext.Provider value={value}>
      {children}
    </JourneyValidationContext.Provider>
  );
}

export function useJourneyValidation(): JourneyValidationResult {
  const v = useContext(JourneyValidationContext);
  if (!v) {
    throw new Error(
      "useJourneyValidation must be used within JourneyValidationProvider",
    );
  }
  return v;
}
