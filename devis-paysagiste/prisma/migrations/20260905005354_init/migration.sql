-- CreateTable
CREATE TABLE "Entreprise" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "ville" TEXT,
    "codePostal" TEXT,
    "zone" TEXT,
    "couleur" TEXT NOT NULL DEFAULT '#166534',
    "logo" TEXT,
    "seuilPetit" INTEGER NOT NULL DEFAULT 2000,
    "seuilFort" INTEGER NOT NULL DEFAULT 10000,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntreprisePrestation" (
    "id" SERIAL NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "typeProjet" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "regles" JSONB NOT NULL,

    CONSTRAINT "EntreprisePrestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" SERIAL NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "typeProjet" TEXT NOT NULL,
    "reponses" JSONB NOT NULL,
    "photos" JSONB NOT NULL,
    "estimationMin" DOUBLE PRECISION,
    "estimationMax" DOUBLE PRECISION,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "simulationId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "commune" TEXT,
    "delai" TEXT NOT NULL,
    "budgetMax" DOUBLE PRECISION,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entreprise_slug_key" ON "Entreprise"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "EntreprisePrestation_entrepriseId_typeProjet_key" ON "EntreprisePrestation"("entrepriseId", "typeProjet");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_simulationId_key" ON "Lead"("simulationId");

-- AddForeignKey
ALTER TABLE "EntreprisePrestation" ADD CONSTRAINT "EntreprisePrestation_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
