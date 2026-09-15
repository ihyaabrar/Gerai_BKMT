/**
 * Deklarasi minimal Web Bluetooth yang dipakai printer thermal.
 * TypeScript bawaan belum menyertakan API ini; hanya bagian yang benar-benar
 * dipakai yang dideklarasikan, supaya tidak perlu dependensi tambahan.
 */

interface BluetoothCharacteristicProperties {
  readonly write: boolean;
  readonly writeWithoutResponse: boolean;
}

interface BluetoothRemoteGATTCharacteristic {
  readonly uuid: string;
  readonly properties: BluetoothCharacteristicProperties;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTService {
  readonly uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
}

interface RequestDeviceOptions {
  acceptAllDevices?: boolean;
  filters?: { services?: string[]; namePrefix?: string }[];
  optionalServices?: string[];
}

interface Bluetooth {
  getAvailability?(): Promise<boolean>;
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  getDevices?(): Promise<BluetoothDevice[]>;
}

interface Navigator {
  readonly bluetooth?: Bluetooth;
}
