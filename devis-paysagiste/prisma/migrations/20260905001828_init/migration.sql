-- CreateTable
CREATE TABLE "Profil" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomEntreprise" TEXT,
    "ville" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "logicielActuel" TEXT,
    "estimationPublique" TEXT,
    "onboardingTermine" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrestationType" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "categorie" TEXT NOT NULL,
    "prixMin" DOUBLE PRECISION NOT NULL,
    "prixMax" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION,

    CONSTRAINT "PrestationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devis" (
    "id" SERIAL NOT NULL,
    "nomClient" TEXT NOT NULL,
    "adresseChantier" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "totalHT" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneDevis" (
    "id" SERIAL NOT NULL,
    "devisId" INTEGER NOT NULL,
    "prestationTypeId" INTEGER NOT NULL,
    "nomPrestation" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "sousTotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LigneDevis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LigneDevis" ADD CONSTRAINT "LigneDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneDevis" ADD CONSTRAINT "LigneDevis_prestationTypeId_fkey" FOREIGN KEY ("prestationTypeId") REFERENCES "PrestationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
