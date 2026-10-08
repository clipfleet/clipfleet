import { describe, expect, it } from "vitest";
import { isValidCbu, parseAccount, parseHolderName } from "./index";

// CBU de ejemplo con dígitos verificadores correctos (banco 285, sucursal 0590).
const CBU = "2850590940090418135201";

describe("isValidCbu", () => {
  it("acepta un CBU con los dos dígitos verificadores correctos", () => {
    expect(isValidCbu(CBU)).toBe(true);
  });

  it("rechaza un dígito cambiado en cualquiera de los dos bloques", () => {
    expect(isValidCbu("2850590840090418135201")).toBe(false);
    expect(isValidCbu("2850590940090418135211")).toBe(false);
  });

  it("rechaza largos distintos de 22 y caracteres que no son dígitos", () => {
    expect(isValidCbu(CBU.slice(0, 21))).toBe(false);
    expect(isValidCbu(`${CBU}0`)).toBe(false);
    expect(isValidCbu("28505909400904181352O1")).toBe(false);
  });
});

describe("parseAccount", () => {
  it("reconoce un alias y lo normaliza a minúsculas", () => {
    expect(parseAccount("  Clips.Tomi-2026 ")).toEqual({ account: "clips.tomi-2026", kind: "alias" });
  });

  it("reconoce un CBU aunque venga con espacios o guiones", () => {
    expect(parseAccount("28505909 40090418135201")).toEqual({ account: CBU, kind: "cbu" });
    expect(parseAccount("2850590-9-4009041813520-1")).toEqual({ account: CBU, kind: "cbu" });
  });

  it("reconoce un CVU por empezar con 000", () => {
    expect(parseAccount("0000003100012345678901")).toEqual({ account: "0000003100012345678901", kind: "cvu" });
  });

  it("explica qué está mal en vez de aceptar cualquier cosa", () => {
    expect(parseAccount("2850590840090418135201")).toEqual({ error: expect.stringContaining("CBU no es válido") });
    expect(parseAccount("12345678")).toEqual({ error: expect.stringContaining("22 dígitos") });
    expect(parseAccount("corto")).toEqual({ error: expect.stringContaining("alias") });
    expect(parseAccount("alias con espacios")).toEqual({ error: expect.stringContaining("alias") });
    expect(parseAccount("<script>alert(1)</script>")).toEqual({ error: expect.stringContaining("alias") });
    expect(parseAccount("")).toEqual({ error: expect.stringContaining("alias") });
  });
});

describe("parseHolderName", () => {
  it("acepta un nombre y le limpia los espacios", () => {
    expect(parseHolderName("  Tomás   Agüero ")).toBe("Tomás Agüero");
  });

  it("rechaza vacío, una sola letra y nombres larguísimos", () => {
    expect(parseHolderName("")).toBeNull();
    expect(parseHolderName("A")).toBeNull();
    expect(parseHolderName("x".repeat(81))).toBeNull();
  });
});
