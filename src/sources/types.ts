import type { Entry } from "@/lib/knowledge";

export type ImportResult = { entries: Entry[]; note: string };
export type ImportOptions = { text?: string; format?: string };
export type SourceAdapter = {
  id: string;
  label: string;
  import(input: string, options?: ImportOptions): Promise<ImportResult>;
};
export class SourceError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
