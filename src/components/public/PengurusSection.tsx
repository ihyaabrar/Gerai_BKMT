import { Users } from "lucide-react";
import type { PengurusPublic } from "@/types/public-profile";
import { sortPengurus } from "@/lib/utils";

interface PengurusSectionProps {
  pengurusList: PengurusPublic[];
}

const TINGKATAN_LABEL: Record<string, string> = {
  PD: "Pimpinan Daerah",
  PC: "Pimpinan Cabang",
  Permata: "Permata BKMT",
};

const TINGKATAN_GRADIENT: Record<string, string> = {
  PD: "from-emerald-500 to-teal-500",
  PC: "from-blue-500 to-indigo-500",
  Permata: "from-violet-500 to-purple-500",
};

const TINGKATAN_BADGE: Record<string, string> = {
  PD: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PC: "bg-blue-100 text-blue-700 border-blue-200",
  Permata: "bg-violet-100 text-violet-700 border-violet-200",
};

export function PengurusSection({ pengurusList }: PengurusSectionProps) {
  const sorted = sortPengurus(pengurusList);
  const grouped = sorted.reduce<Record<string, PengurusPublic[]>>((acc, p) => {
    if (!acc[p.tingkatan]) acc[p.tingkatan] = [];
    acc[p.tingkatan].push(p);
    return acc;
  }, {});

  return (
    <section id="pengurus" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-emerald-600 text-sm font-semibold uppercase tracking-widest">Struktur</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Susunan Pengurus</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Kepengurusan PD BKMT Kabupaten Kubu Raya yang berkomitmen melayani umat
          </p>
        </div>

        {pengurusList.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-400 text-lg font-medium">Data pengurus sedang dipersiapkan</p>
          </div>
        ) : (
          <div className="space-y-14">
            {["PD", "PC", "Permata"].map((tingkatan) => {
              const list = grouped[tingkatan];
              if (!list?.length) return null;
              return (
                <div key={tingkatan}>
                  {/* Section header */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TINGKATAN_GRADIENT[tingkatan]} flex items-center justify-center shadow-md`}>
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{TINGKATAN_LABEL[tingkatan]}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TINGKATAN_BADGE[tingkatan]}`}>
                        {list.length} orang
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Grid pengurus */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {list.map((p) => (
                      <div key={p.id} className="group text-center">
                        <div className="relative mx-auto mb-3 w-fit">
                          {p.fotoUrl ? (
                            <img
                              src={p.fotoUrl}
                              alt={p.nama}
                              className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-1"
                            />
                          ) : (
                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${TINGKATAN_GRADIENT[tingkatan]} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all group-hover:-translate-y-1`}>
                              <span className="text-2xl font-bold text-white">
                                {p.nama.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">{p.nama}</p>
                        <p className={`text-xs mt-1 font-medium ${
                          tingkatan === "PD" ? "text-emerald-600" :
                          tingkatan === "PC" ? "text-blue-600" : "text-violet-600"
                        }`}>{p.jabatan}</p>
                        {p.periode && (
                          <p className="text-gray-400 text-xs mt-0.5">{p.periode}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
