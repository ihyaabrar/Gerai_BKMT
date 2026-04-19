"use client";

import { useState, useRef, useId } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  shape?: "square" | "circle";
  previewSize?: "sm" | "md" | "lg";
}

const PREVIEW_SIZES = {
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-40 w-40",
};

export function ImageUpload({
  value,
  onChange,
  folder = "general",
  label = "Upload Gambar",
  shape = "square",
  previewSize = "md",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // useId menghasilkan ID unik per instance komponen — tidak ada konflik
  const uid = useId();
  const inputId = `upload-${uid}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi client-side sebelum kirim ke server
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED.includes(file.type)) {
      toast.error("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        // Tidak set Content-Type — browser otomatis set multipart/form-data dengan boundary
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Gagal mengupload gambar");
        return;
      }

      onChange(data.url);
      toast.success("Gambar berhasil diupload");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Terjadi kesalahan saat upload. Coba lagi.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    // Cegah label trigger submit form
    e.stopPropagation();
  };

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const sizeClass = PREVIEW_SIZES[previewSize];

  return (
    <div className="space-y-2">
      {/* Input file tersembunyi */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        id={inputId}
        disabled={uploading}
      />

      {value ? (
        // Preview gambar yang sudah diupload
        <div className="flex items-start gap-4">
          <div className={`relative ${sizeClass} shrink-0`}>
            <img
              src={value}
              alt="Preview"
              className={`${sizeClass} ${shapeClass} object-cover border-2 border-gray-200`}
            />
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-2 justify-center">
            <label
              htmlFor={inputId}
              onClick={handleLabelClick}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors select-none ${uploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mengupload...</>
              ) : (
                <><Upload className="h-4 w-4" /> Ganti Gambar</>
              )}
            </label>
            <p className="text-xs text-gray-400">JPG, PNG, WebP · Maks 5MB</p>
          </div>
        </div>
      ) : (
        // Area upload kosong
        <label
          htmlFor={inputId}
          onClick={handleLabelClick}
          className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all select-none ${uploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-sm text-gray-500">Mengupload gambar...</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-gray-100 rounded-xl">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP · Maks 5MB</p>
              </div>
            </>
          )}
        </label>
      )}
    </div>
  );
}
