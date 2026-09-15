/**
 * Mengirim struk langsung ke printer thermal Bluetooth (Web Bluetooth).
 *
 * Batasan yang perlu diketahui pengurus:
 * - Hanya Chrome/Edge di Android, Windows, Mac, dan ChromeOS. Safari dan
 *   semua browser di iPhone/iPad tidak mendukung Web Bluetooth — di sana
 *   pakai metode "printer sistem".
 * - Hanya printer Bluetooth Low Energy (BLE). Kebanyakan printer thermal
 *   murah 58 mm mendukungnya; printer Bluetooth Classic lama tidak.
 * - Memilih printer harus lewat klik (aturan browser). Setelah itu koneksi
 *   dipakai ulang selama tab terbuka.
 */

/**
 * Layanan GATT yang dipakai printer thermal umum. Browser hanya mengizinkan
 * akses ke layanan yang disebut di sini.
 */
const LAYANAN_PRINTER = [
  "000018f0-0000-1000-8000-00805f9b34fb", // mayoritas printer 58 mm (MTP-II, RPP02N, dll.)
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // modul ISSC/Microchip
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

/** Byte per tulis. Kecil supaya aman untuk MTU bawaan printer murah. */
const UKURAN_POTONGAN = 100;

let perangkat: BluetoothDevice | null = null;
let karakteristik: BluetoothRemoteGATTCharacteristic | null = null;

export class PrinterBluetoothError extends Error {}

export function bluetoothDidukung(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.bluetooth);
}

export function printerTersambung(): boolean {
  return Boolean(perangkat?.gatt?.connected && karakteristik);
}

async function cariKarakteristik(d: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
  if (!d.gatt) throw new PrinterBluetoothError("Perangkat ini tidak bisa disambungkan.");
  const server = d.gatt.connected ? d.gatt : await d.gatt.connect();
  const layanan = await server.getPrimaryServices();
  for (const l of layanan) {
    const daftar = await l.getCharacteristics();
    const tulis = daftar.find((c) => c.properties.writeWithoutResponse || c.properties.write);
    if (tulis) return tulis;
  }
  throw new PrinterBluetoothError(
    "Perangkat tersambung, tetapi bukan printer yang dikenali. Pastikan yang dipilih adalah printer thermal."
  );
}

/** Buka pemilih perangkat Bluetooth. Harus dipanggil dari klik pengguna. */
export async function pilihPrinter(): Promise<{ id: string; nama: string }> {
  if (!bluetoothDidukung()) {
    throw new PrinterBluetoothError(
      "Browser ini tidak mendukung Bluetooth langsung. Gunakan Chrome di Android atau komputer, atau pilih metode printer sistem."
    );
  }
  let d: BluetoothDevice;
  try {
    d = await navigator.bluetooth!.requestDevice({
      acceptAllDevices: true,
      optionalServices: LAYANAN_PRINTER,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "NotFoundError") {
      throw new PrinterBluetoothError("Tidak ada printer yang dipilih.");
    }
    throw new PrinterBluetoothError("Bluetooth tidak bisa dibuka. Pastikan Bluetooth perangkat ini menyala.");
  }
  karakteristik = await cariKarakteristik(d);
  perangkat = d;
  return { id: d.id, nama: d.name || "Printer Bluetooth" };
}

/**
 * Sambungkan kembali tanpa membuka pemilih: perangkat yang sama di tab ini,
 * atau perangkat yang pernah diizinkan (bila browser mendukung getDevices).
 */
export async function sambungUlang(idTersimpan?: string | null): Promise<boolean> {
  if (!bluetoothDidukung()) return false;
  try {
    if (perangkat) {
      karakteristik = await cariKarakteristik(perangkat);
      return true;
    }
    if (idTersimpan && navigator.bluetooth!.getDevices) {
      const dikenal = await navigator.bluetooth!.getDevices();
      const d = dikenal.find((x) => x.id === idTersimpan);
      if (d) {
        karakteristik = await cariKarakteristik(d);
        perangkat = d;
        return true;
      }
    }
  } catch {
    // Printer mati atau di luar jangkauan.
  }
  return false;
}

export function putuskanPrinter(): void {
  perangkat?.gatt?.disconnect();
  perangkat = null;
  karakteristik = null;
}

/** Kirim byte ESC/POS ke printer yang tersambung. */
export async function kirimKePrinter(byte: Uint8Array): Promise<void> {
  if (!karakteristik) throw new PrinterBluetoothError("Printer Bluetooth belum tersambung.");
  const c = karakteristik;
  const tanpaBalasan = c.properties.writeWithoutResponse && typeof c.writeValueWithoutResponse === "function";
  try {
    for (let i = 0; i < byte.length; i += UKURAN_POTONGAN) {
      const potongan = byte.slice(i, i + UKURAN_POTONGAN);
      if (tanpaBalasan) {
        await c.writeValueWithoutResponse!(potongan);
        // Beri napas pada buffer printer; tanpa jeda sebagian baris hilang.
        await new Promise((r) => setTimeout(r, 25));
      } else {
        await c.writeValue(potongan);
      }
    }
  } catch {
    karakteristik = null;
    throw new PrinterBluetoothError("Pengiriman ke printer terputus. Dekatkan printer dan coba lagi.");
  }
}
