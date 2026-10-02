import { describe, expect, it } from "vitest";
import { httpUrl, safeNext } from "./result";

describe("httpUrl", () => {
  it("acepta http y https", () => {
    expect(httpUrl("https://www.tiktok.com/@cuenta/video/1")).toBe("https://www.tiktok.com/@cuenta/video/1");
    expect(httpUrl("http://ejemplo.com")).toBe("http://ejemplo.com/");
  });

  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x", "file:///etc/passwd", " javascript:alert(1)", "//ejemplo.com", "no es una url", "", null, undefined])(
    "rechaza %s",
    (value) => {
      expect(httpUrl(value)).toBeNull();
    },
  );
});

describe("safeNext", () => {
  it("acepta rutas internas", () => {
    expect(safeNext("/app/equipo")).toBe("/app/equipo");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "evil.com", "javascript:alert(1)", ""])("rechaza %s", (value) => {
    expect(safeNext(value)).toBeNull();
  });
});
