"use client";

import { useEffect, useState } from "react";
import { useAuthInitializer } from "../hooks/auth";
// import { migrateTokensFromLocalStorage } from '../migration';

/**
 * Client component to handle authentication initialization and cookie monitoring
 */
export function AuthInitializer() {
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    // Run migration once on mount
    // migrateTokensFromLocalStorage();
    setMigrationComplete(true);
  }, []);

  useAuthInitializer();

  return null; // This component doesn't render anything
}
