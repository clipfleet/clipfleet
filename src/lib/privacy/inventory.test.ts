import { createHash } from "node:crypto";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";
import { DATA_SECTIONS, PERSONAL_DATA_INVENTORY } from "./inventory";
import { INVENTORY_FINGERPRINT, PRIVACY_POLICY_UPDATED } from "./policy";

const tables = (Object.values(schema) as unknown[]).filter((value): value is PgTable => is(value, PgTable));
const columnsOf = (table: PgTable) => Object.keys(getTableColumns(table)).sort();

describe("inventario de datos personales", () => {
  it("clasifica todas las tablas de la base, y ninguna que no exista", () => {
    expect(Object.keys(PERSONAL_DATA_INVENTORY).sort()).toEqual(tables.map(getTableName).sort());
  });

  it.each(tables.map((table) => [getTableName(table), table] as const))(
    "%s: cada columna está clasificada como personal o no personal",
    (name, table) => {
      const entry = PERSONAL_DATA_INVENTORY[name];
      const classified = [...Object.keys(entry.personal), ...entry.other].sort();
      // Si falla: hay una columna nueva (o una que ya no existe). Clasificala en inventory.ts
      // y actualizá la Política de privacidad si guarda un dato personal.
      expect(classified).toEqual(columnsOf(table));
    },
  );

  it("cada dato personal apunta a una sección que existe en la política", () => {
    const sections = Object.values(PERSONAL_DATA_INVENTORY).flatMap((entry) => Object.values(entry.personal));
    for (const section of sections) expect(Object.keys(DATA_SECTIONS)).toContain(section);
  });
});

describe("política de privacidad", () => {
  it("se revisó con el inventario actual", () => {
    const fingerprint = createHash("sha256").update(JSON.stringify(PERSONAL_DATA_INVENTORY)).digest("hex").slice(0, 16);
    // Si falla: cambió qué datos personales se guardan. Revisá el texto de
    // src/app/(public)/privacidad/page.tsx, actualizá PRIVACY_POLICY_UPDATED y recién entonces
    // copiá esta huella en INVENTORY_FINGERPRINT (src/lib/privacy/policy.ts).
    expect(INVENTORY_FINGERPRINT).toBe(fingerprint);
  });

  it("tiene una fecha de actualización válida y no futura", () => {
    expect(PRIVACY_POLICY_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${PRIVACY_POLICY_UPDATED}T00:00:00Z`).getTime()).toBeLessThanOrEqual(Date.now());
  });
});
