-- CreateTable
CREATE TABLE "Profil" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nomEntreprise" TEXT,
    "ville" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "onboardingTermine" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrestationType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "prixMin" REAL NOT NULL,
    "prixMax" REAL NOT NULL,
    "prixUnitaire" REAL
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nomClient" TEXT NOT NULL,
    "adresseChantier" TEXT NOT NULL,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "totalHT" REAL NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "devisId" INTEGER NOT NULL,
    "prestationTypeId" INTEGER NOT NULL,
    "nomPrestation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" REAL NOT NULL,
    "prixUnitaire" REAL NOT NULL,
    "sousTotal" REAL NOT NULL,
    CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LigneDevis_prestationTypeId_fkey" FOREIGN KEY ("prestationTypeId") REFERENCES "PrestationType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
