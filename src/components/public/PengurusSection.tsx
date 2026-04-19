import { Users } from "lucide-react";
import type { PengurusPublic } from "@/types/public-profile";
import { sortPengurus } from "@/lib/utils";

interface PengurusSectionProps {
  pengurusList: PengurusPublic[];
}

const TINGKATAN_LABEL: Record<string, string> = {
  PD: "Pimpinan Daerah (PD BKMT)",
  PC: "Pimpinan Cabang (PC BKMT)",
  Permata: "Permata BKMT",
};

const TINGKATAN_COLOR: Record<string, string> = {
  PD: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PC: "bg-blue-100 text-blue-800 border-blue-200",
  Permata: "bg-violet-100 text-violet-800 border-violet-200",
};

export function PengurusSection({ pengurusList }: PengurusSectionProps) {
  const sorted = sortPengurus(pengurusList);
  const grouped = sorted.reduce<Record<string, PengurusPublic[]>>((acc, p) => {
    if (!acc[p.tingkatan]) acc[p.tingkatan] = [];
    acc[p.tingkatan].push(p);
    return acc;
  }, {});

  return (
    <section id="pengurus" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Susunan Pengurus</h2>
          <p className="text-gray-500">Struktur kepengurusan PD BKMT Kabupaten Kubu Raya</p>
        </div>

        {pengurusList.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Data pengurus sedang dipersiapkan</p>
          </div>
        ) : (
          <div className="space-y-10">
            {["PD", "PC", "Permata"].map((tingkatan) => {
              const list = grouped[tingkatan];
              if (!list?.length) return null;
              return (
                <div key={tingkatan}>
                  <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm border ${TINGKATAN_COLOR[tingkatan]}`}>
                      {TINGKATAN_LABEL[tingkatan]}
                    </span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {list.map((p) => (
                      <div key={p.id} className="text-center group">
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.nama}
                            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-gray-200 group-hover:border-emerald-400 transition-colors"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-3 border-2 border-gray-200 group-hover:border-emerald-400 transition-colors">
                            <span className="text-2xl font-bold text-emerald-600">
                              {p.nama.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{p.nama}</p>
                        <p className="text-emerald-600 text-xs mt-1">{p.jabatan}</p>
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
