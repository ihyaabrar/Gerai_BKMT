import { describe, expect, it } from "vitest";
import { labelTautan, tautanSosial, tautanTelepon } from "@/lib/sosial";

describe("tautanSosial", () => {
  it("menerima nama akun dengan atau tanpa @", () => {
    expect(tautanSosial("instagram", "@bkmtkuburaya")).toBe("https://instagram.com/bkmtkuburaya");
    expect(tautanSosial("instagram", "bkmt.kuburaya")).toBe("https://instagram.com/bkmt.kuburaya");
    expect(tautanSosial("tiktok", "@bkmt")).toBe("https://www.tiktok.com/@bkmt");
    expect(tautanSosial("youtube", "BKMTKubuRaya")).toBe("https://youtube.com/@BKMTKubuRaya");
  });

  it("menerima alamat lengkap atau tanpa https", () => {
    expect(tautanSosial("facebook", "https://facebook.com/bkmt")).toBe("https://facebook.com/bkmt");
    expect(tautanSosial("facebook", "facebook.com/bkmt")).toBe("https://facebook.com/bkmt");
    expect(tautanSosial("website", "bkmtkuburaya.or.id")).toBe("https://bkmtkuburaya.or.id/");
  });

  it("WhatsApp dari nomor HP biasa", () => {
    expect(tautanSosial("whatsapp", "0812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(tautanSosial("whatsapp", "12")).toBeNull();
  });

  it("menolak isian kosong, aneh, atau berbahaya", () => {
    expect(tautanSosial("instagram", "")).toBeNull();
    expect(tautanSosial("instagram", "   ")).toBeNull();
    expect(tautanSosial("instagram", "nama <script>")).toBeNull();
    expect(tautanSosial("website", "javascript:alert(1)")).toBeNull();
    expect(tautanSosial("website", "bukan alamat")).toBeNull();
  });
});

describe("tautanTelepon & labelTautan", () => {
  it("telepon", () => {
    expect(tautanTelepon("(0561) 123-456")).toBe("tel:0561123456");
    expect(tautanTelepon("")).toBeNull();
  });

  it("label", () => {
    expect(labelTautan("https://www.bkmt.or.id/")).toBe("bkmt.or.id");
  });
});
