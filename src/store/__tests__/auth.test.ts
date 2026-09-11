import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAuthStore } from "../auth";

const KASIR = { id: "u1", nama: "Siti", username: "kasir", role: "kasir" };

function pasangFetch(impl: () => Promise<unknown> | never) {
  vi.stubGlobal("fetch", vi.fn(impl as never));
}

function jawab(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("auth store — refresh()", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: KASIR,
      isAuthenticated: true,
      status: "authenticated",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("koneksi putus TIDAK melogout kasir", async () => {
    // Inilah perilaku yang dulu melempar kasir ke halaman login di depan
    // pembeli hanya karena sinyal drop tiga detik.
    pasangFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const hasil = await useAuthStore.getState().refresh();

    expect(hasil).toEqual(KASIR);
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(KASIR);
  });

  it("server error 500 TIDAK melogout kasir", async () => {
    pasangFetch(() => jawab(500, { error: "boom" }) as never);

    await useAuthStore.getState().refresh();

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user).toEqual(KASIR);
  });

  it("401 dari server MEMANG melogout", async () => {
    pasangFetch(() => jawab(401, { user: null }) as never);

    const hasil = await useAuthStore.getState().refresh();

    expect(hasil).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("403 dari server juga melogout", async () => {
    pasangFetch(() => jawab(403, { error: "Akses ditolak" }) as never);

    await useAuthStore.getState().refresh();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("profil yang berubah di server ikut diperbarui", async () => {
    const naikJabatan = { ...KASIR, role: "admin", nama: "Siti Aminah" };
    pasangFetch(() => jawab(200, { user: naikJabatan }) as never);

    const hasil = await useAuthStore.getState().refresh();

    expect(hasil).toEqual(naikJabatan);
    expect(useAuthStore.getState().user?.role).toBe("admin");
  });

  it("tanpa profil tersimpan, koneksi putus tetap berakhir unauthenticated", async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, status: "loading" });
    pasangFetch(() => Promise.reject(new TypeError("Failed to fetch")));

    const hasil = await useAuthStore.getState().refresh();

    expect(hasil).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});

describe("auth store — canAccess()", () => {
  it("kasir tidak bisa membuka halaman keuangan yang tertutup", () => {
    useAuthStore.setState({ user: KASIR, isAuthenticated: true, status: "authenticated" });

    expect(useAuthStore.getState().canAccess("/app/kasir")).toBe(true);
    expect(useAuthStore.getState().canAccess("/app/keuangan/distribusi")).toBe(false);
    expect(useAuthStore.getState().canAccess("/app/keuangan/laporan")).toBe(false);
    expect(useAuthStore.getState().canAccess("/app/master/nasabah")).toBe(false);
    expect(useAuthStore.getState().canAccess("/admin")).toBe(false);
  });

  it("master bisa membuka semuanya", () => {
    useAuthStore.setState({
      user: { ...KASIR, role: "master" },
      isAuthenticated: true,
      status: "authenticated",
    });

    expect(useAuthStore.getState().canAccess("/app/keuangan/distribusi")).toBe(true);
    expect(useAuthStore.getState().canAccess("/admin")).toBe(true);
  });

  it("tanpa login tidak bisa membuka apa pun", () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, status: "unauthenticated" });

    expect(useAuthStore.getState().canAccess("/app")).toBe(false);
  });
});
