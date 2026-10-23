import { github } from "./github";
import { linkedin } from "./linkedin";
import { scholar } from "./scholar";
import type { SourceAdapter } from "./types";

// Register future RSS, URL, or authenticated connectors here. Adapters only
// produce excluded drafts; approval and publication remain separate operations.
export const sourceAdapters: Record<string, SourceAdapter> = { github, linkedin, scholar };
