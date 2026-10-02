import { beforeEach, describe, expect, it } from "vitest";
import { rateLimits } from "@/lib/db/schema";
import { createTestDb } from "@/lib/db/testing";
import type { Db } from "@/lib/db/types";
import { hit } from "./rate-limit";

let db: Db;
const t0 = new Date("2026-10-02T12:00:00Z");
const at = (seconds: number) => new Date(t0.getTime() + seconds * 1000);

beforeEach(async () => {
  db = await createTestDb();
});

describe("límite de frecuencia", () => {
  it("permite hasta el límite y bloquea el siguiente", async () => {
    for (let i = 0; i < 5; i++) expect((await hit(db, "login:a", 5, 900, at(i))).allowed).toBe(true);
    const blocked = await hit(db, "login:a", 5, 900, at(10));
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(890);
  });

  it("sigue bloqueando dentro de la ventana y vuelve a permitir cuando vence", async () => {
    for (let i = 0; i < 6; i++) await hit(db, "login:a", 5, 900, at(i));
    expect((await hit(db, "login:a", 5, 900, at(899))).allowed).toBe(false);
    expect((await hit(db, "login:a", 5, 900, at(901))).allowed).toBe(true);
  });

  it("cada clave cuenta por separado", async () => {
    for (let i = 0; i < 6; i++) await hit(db, "login:a", 5, 900, at(i));
    expect((await hit(db, "login:b", 5, 900, at(7))).allowed).toBe(true);
  });

  it("intentos simultáneos no se saltean el límite", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => hit(db, "signup:ip", 5, 3600, t0)));
    expect(results.filter((result) => result.allowed)).toHaveLength(5);
  });

  it("no guarda la clave en claro", async () => {
    await hit(db, "login:persona@ejemplo.com", 5, 900, t0);
    const [row] = await db.select().from(rateLimits);
    expect(row.key).toMatch(/^[0-9a-f]{64}$/);
    expect(row.key).not.toContain("persona");
  });
});
