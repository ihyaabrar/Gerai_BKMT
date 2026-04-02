"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      setBackups(data);
    } catch {
      toast.error("Gagal memuat daftar backup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup" }),
      });

      if (!res.ok) throw new Error();
      toast.success("Backup berhasil dibuat");
      fetchBackups();
    } catch {
      toast.error("Gagal membuat backup");
    } finally {
      setCreating(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Backup Data</h1>
          <p className="text-gray-500">Backup dan restore database</p>
        </div>
        <Button onClick={handleCreateBackup} disabled={creating} className="bg-blue-600 hover:bg-blue-700">
          <Database className="h-4 w-4 mr-2" />
          {creating ? "Membuat Backup..." : "Buat Backup"}
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <CardHeader>
          <CardTitle className="text-white">Informasi Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-80">Lokasi Database</p>
              <p className="text-lg font-semibold">prisma/dev.db</p>
            </div>
            <div>
              <p className="text-sm opacity-80">Total Backup</p>
              <p className="text-lg font-semibold">{backups.length} file</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Riwayat Backup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Database className="h-14 w-14 mx-auto mb-3 opacity-30" />
              <p>Belum ada backup</p>
              <p className="text-sm mt-1">Klik "Buat Backup" untuk memulai</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div key={backup.filename}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{backup.filename}</p>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(backup.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(backup.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm"
                    onClick={() => toast.info(`File: backups/${backup.filename}`)}>
                    <Download className="h-4 w-4 mr-1" />
                    Info
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800 flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5" />
            Catatan Penting
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 space-y-1">
          <p>• Backup database secara berkala untuk menghindari kehilangan data</p>
          <p>• File backup disimpan di folder: <code className="bg-amber-100 px-1 rounded">backups/</code></p>
          <p>• Simpan file backup di lokasi aman (external drive, cloud storage)</p>
          <p>• Untuk restore: stop aplikasi, replace <code className="bg-amber-100 px-1 rounded">prisma/dev.db</code> dengan file backup, lalu restart</p>
        </CardContent>
      </Card>
    </div>
  );
}
