import { CalendarDays, MapPin, Clock, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export interface FotoGaleri {
  id: string;
  judul: string;
  deskripsi: string | null;
  gambarUrl: string;
  kategori: string | null;
}

export interface AgendaPublik {
  id: string;
  judul: string;
  deskripsi: string | null;
  tanggal: string | Date;
  waktuMulai: string | null;
  waktuSelesai: string | null;
  lokasi: string | null;
  kategori: string | null;
}

interface Props {
  galeri: FotoGaleri[];
  agenda: AgendaPublik[];
}

/**
 * Galeri dokumentasi dan jadwal agenda ditempatkan berdampingan: galeri
 * mengisi kolom lebar, agenda jadi kolom samping seperti pada desain.
 * Bagian ini tidak dirender sama sekali bila keduanya masih kosong.
 */
export function GaleriAgendaSection({ galeri, agenda }: Props) {
  if (galeri.length === 0 && agenda.length === 0) return null;

  return (
    <section id="galeri" className="bg-white border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Galeri */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
              Dokumentasi
            </p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Galeri Kegiatan
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed max-w-xl">
              Momen-momen kegiatan majelis taklim di Kabupaten Kubu Raya.
            </p>

            {galeri.length === 0 ? (
              <div className="mt-8 rounded-card border border-border bg-surface-muted text-center py-14">
                <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">
                  Dokumentasi kegiatan sedang dipersiapkan
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galeri.slice(0, 6).map((f) => (
                  <figure
                    key={f.id}
                    className="group rounded-card border border-border overflow-hidden bg-white"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-surface-sunken">
                      <img
                        src={f.gambarUrl}
                        alt={f.judul}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <figcaption className="p-3">
                      <p className="text-[13px] font-medium text-slate-900 line-clamp-1">
                        {f.judul}
                      </p>
                      {f.kategori && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{f.kategori}</p>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          {/* Agenda */}
          <aside>
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                <CalendarDays className="h-[18px] w-[18px]" />
              </span>
              <h3 className="text-[15px] font-semibold text-slate-900">
                Jadwal Agenda
              </h3>
            </div>

            {agenda.length === 0 ? (
              <div className="mt-5 rounded-card border border-border bg-surface-muted px-4 py-8 text-center">
                <p className="text-sm text-slate-500">Belum ada agenda mendatang</p>
              </div>
            ) : (
              <ul className="mt-5 space-y-3">
                {agenda.slice(0, 5).map((a) => {
                  const tgl = new Date(a.tanggal);
                  return (
                    <li
                      key={a.id}
                      className="flex gap-3.5 rounded-card border border-border bg-white p-3.5"
                    >
                      <div className="w-12 shrink-0 rounded-lg bg-brand-50 text-center py-1.5">
                        <p className="text-[10px] uppercase text-brand-600 tracking-wide">
                          {format(tgl, "MMM", { locale: localeId })}
                        </p>
                        <p className="text-lg font-bold text-brand-700 leading-tight">
                          {format(tgl, "d")}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
                          {a.judul}
                        </p>
                        <div className="mt-1.5 space-y-1 text-[11px] text-slate-500">
                          {(a.waktuMulai || a.waktuSelesai) && (
                            <p className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-slate-300 shrink-0" />
                              {a.waktuMulai ?? "—"}
                              {a.waktuSelesai ? ` – ${a.waktuSelesai}` : ""} WIB
                            </p>
                          )}
                          {a.lokasi && (
                            <p className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-3 w-3 text-slate-300 shrink-0" />
                              <span className="truncate">{a.lokasi}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
