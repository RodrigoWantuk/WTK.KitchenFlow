import { createBffSessionAdapter } from "./bffSessionAdapter";

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

describe("createBffSessionAdapter", () => {
  it("maps authenticated session projection without storing tokens", async () => {
    const navigations: string[] = [];
    const adapter = createBffSessionAdapter({
      navigate: (url) => navigations.push(url),
      fetchImpl: (async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.includes("/api/v1/session")) {
          return new Response(
            JSON.stringify({
              userId: "11111111-1111-1111-1111-111111111111",
              csrfToken: "csrf-test",
              supportedLocales: ["en", "pt-BR", "es"],
              displayName: "Ada",
              language: "en",
              timeZone: "UTC",
              measurementSystem: "Metric",
              profileExists: true,
              profilePercentComplete: 80,
              adultDeclarationState: "Declared",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(null, { status: 404 });
      }) as typeof fetch,
    });

    const session = await adapter.getSession();
    expect(session.status).toBe("authenticated");
    expect(session.csrfToken).toBe("csrf-test");
    expect(session.internalUserId).toBe("11111111-1111-1111-1111-111111111111");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.length).toBe(0);

    adapter.beginLogin("/app/despensa");
    expect(navigations[0]).toContain("/api/v1/auth/login");
    expect(navigations[0]).toContain(encodeURIComponent("/app/despensa"));
  });

  it("maps 401 to signedOut and network failure to unavailable", async () => {
    const signedOut = createBffSessionAdapter({
      fetchImpl: (async () =>
        new Response(JSON.stringify({ errorCode: "authentication_required" }), {
          status: 401,
          headers: { "content-type": "application/problem+json" },
        })) as typeof fetch,
    });
    expect((await signedOut.getSession()).status).toBe("signedOut");

    const unavailable = createBffSessionAdapter({
      fetchImpl: (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
    });
    expect((await unavailable.getSession()).status).toBe("unavailable");
  });

  it("logout sends CSRF and does not keep tokens in storage", async () => {
    const calls: Array<{
      url: string;
      csrf?: string | null;
      credentials?: RequestCredentials;
    }> = [];
    const adapter = createBffSessionAdapter({
      navigate: () => undefined,
      fetchImpl: (async (input: RequestInfo | URL, init?: RequestInit) => {
        const request = input instanceof Request ? input : null;
        const url = requestUrl(input);
        const headers = request?.headers ?? new Headers(init?.headers);
        calls.push({
          url,
          csrf: headers.get("X-CSRF-TOKEN"),
          credentials: request?.credentials ?? init?.credentials,
        });
        if (url.includes("/session")) {
          return new Response(
            JSON.stringify({
              userId: "11111111-1111-1111-1111-111111111111",
              csrfToken: "csrf-logout",
              supportedLocales: ["en"],
              displayName: null,
              language: null,
              timeZone: null,
              measurementSystem: null,
              profileExists: false,
              profilePercentComplete: 0,
              adultDeclarationState: "Unknown",
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(null, { status: 302, headers: { Location: "/" } });
      }) as typeof fetch,
    });
    await adapter.getSession();
    await adapter.logout();
    const logout = calls.find((c) => c.url.includes("/auth/logout"));
    expect(logout?.csrf).toBe("csrf-logout");
    expect(logout?.credentials).toBe("include");
    expect(localStorage.length).toBe(0);
  });
});
