-- Tampilan struk: logo dan teks tambahan, diatur dari halaman Printer.
ALTER TABLE "Pengaturan" ADD COLUMN "strukLogo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Pengaturan" ADD COLUMN "strukLogoUrl" TEXT;
ALTER TABLE "Pengaturan" ADD COLUMN "strukHeader" TEXT;
ALTER TABLE "Pengaturan" ADD COLUMN "strukFooter" TEXT;
