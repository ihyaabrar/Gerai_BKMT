import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export const dynamic = "force-dynamic";
import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "backup") {
      const backupDir = join(process.cwd(), "backups");
      if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
      }

      const sourceDb = join(process.cwd(), "prisma", "dev.db");
      if (!existsSync(sourceDb)) {
        return NextResponse.json(
          { error: "File database tidak ditemukan. Backup hanya tersedia untuk SQLite." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = join(backupDir, `backup-${timestamp}.db`);
      copyFileSync(sourceDb, backupFile);

      return NextResponse.json({
        success: true,
        filename: `backup-${timestamp}.db`,
        path: backupFile,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Failed to create backup" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const backupDir = join(process.cwd(), "backups");

    if (!existsSync(backupDir)) {
      return NextResponse.json([]);
    }

    const files = readdirSync(backupDir)
      .filter((file) => file.endsWith(".db"))
      .map((file) => {
        const filePath = join(backupDir, file);
        const stats = statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(files);
  } catch (error) {
    console.error("Failed to list backups:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
