import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function openDatabase(filename) {
  mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(readFileSync(resolve(import.meta.dirname, "../migrations/0001_sources.sql"), "utf8"));
  return {
    close: () => db.close(),
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              return db.prepare(sql).get(...values) || null;
            },
            async run() {
              const result = db.prepare(sql).run(...values);
              return { meta: { changes: Number(result.changes) } };
            },
          };
        },
      };
    },
  };
}
