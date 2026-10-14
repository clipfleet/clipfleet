import { afterEach, describe, expect, it, vi } from "vitest";
import { BRAND } from "@/lib/brand";
import { fromHeader, sendEmail } from "./index";
import { resetPasswordEmail } from "./templates";

const email = { to: "ana@example.com", subject: "Asunto", text: "Texto", html: "<p>Texto</p>" };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("remitente", () => {
  it("usa el nombre de BRAND con la dirección sola o con nombre", () => {
    expect(fromHeader("no-reply@mail.clipfleet.app")).toBe(`${BRAND.name} <no-reply@mail.clipfleet.app>`);
    expect(fromHeader("Otro Nombre <no-reply@mail.clipfleet.app>")).toBe(`${BRAND.name} <no-reply@mail.clipfleet.app>`);
  });

  it("rechaza lo que no es una dirección", () => {
    expect(fromHeader(undefined)).toBeNull();
    expect(fromHeader("")).toBeNull();
    expect(fromHeader("ClipFleet")).toBeNull();
  });
});

describe("envío", () => {
  it("sin clave en desarrollo imprime el email y no llama a Resend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await sendEmail(email, { NODE_ENV: "development" } as NodeJS.ProcessEnv);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain("ana@example.com");
  });

  it("sin clave en producción falla", async () => {
    await expect(sendEmail(email, { NODE_ENV: "production" } as NodeJS.ProcessEnv)).rejects.toThrow("RESEND_API_KEY");
  });

  it("con clave manda a Resend con remitente y respuesta a contacto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendEmail(email, { NODE_ENV: "production", RESEND_API_KEY: "re_test", EMAIL_FROM: "no-reply@mail.clipfleet.app" } as NodeJS.ProcessEnv);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({
      from: `${BRAND.name} <no-reply@mail.clipfleet.app>`,
      to: ["ana@example.com"],
      reply_to: BRAND.contactEmail,
      subject: "Asunto",
    });
  });

  it("si Resend rechaza el envío, falla con el motivo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("domain not verified", { status: 403 })));
    await expect(
      sendEmail(email, { NODE_ENV: "production", RESEND_API_KEY: "re_test", EMAIL_FROM: "no-reply@mail.clipfleet.app" } as NodeJS.ProcessEnv),
    ).rejects.toThrow("403: domain not verified");
  });
});

describe("email para restablecer la contraseña", () => {
  it("lleva el link en el texto y en el HTML, escapado", () => {
    const url = "https://clipfleet.app/restablecer?token=abc&x=1";
    const message = resetPasswordEmail("ana@example.com", url, 30);
    expect(message.to).toBe("ana@example.com");
    expect(message.text).toContain(url);
    expect(message.text).toContain("30 minutos");
    expect(message.html).toContain('href="https://clipfleet.app/restablecer?token=abc&amp;x=1"');
  });
});
