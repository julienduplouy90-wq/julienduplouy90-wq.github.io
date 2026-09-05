// Template PDF du devis (@react-pdf/renderer).
// Rendu côté serveur uniquement (voir app/api/devis/[id]/pdf/route.ts).
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Données minimales dont le template a besoin (déjà chargées depuis la base).
export type DonneesDevisPdf = {
  id: number;
  nomClient: string;
  adresseChantier: string;
  dateCreation: Date;
  notes: string | null;
  totalHT: number;
  lignes: {
    nomPrestation: string;
    unite: string;
    quantite: number;
    prixUnitaire: number;
    sousTotal: number;
  }[];
  entreprise: {
    nom: string;
    ville: string;
    codePostal: string;
  };
};

// Les espaces insécables du format français (U+202F/U+00A0) n'existent pas
// dans la police Helvetica du PDF : on les remplace par des espaces simples.
const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(n)
    .replace(/[  ]/g, " ");

const VERT = "#2d6a4f";
const GRIS_CLAIR = "#f4f4f2";
const GRIS_TEXTE = "#666666";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // En-tête : nom de l'entreprise à gauche, titre DEVIS à droite
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: VERT,
  },
  nomEntreprise: { fontSize: 18, fontFamily: "Helvetica-Bold", color: VERT },
  coordonnees: { marginTop: 4, color: GRIS_TEXTE },
  titreDevis: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right" },
  numeroDevis: { textAlign: "right", color: GRIS_TEXTE, marginTop: 4 },

  // Bloc client
  blocClient: {
    backgroundColor: GRIS_CLAIR,
    borderRadius: 6,
    padding: 12,
    marginBottom: 25,
    alignSelf: "flex-end",
    minWidth: 220,
  },
  labelClient: { color: GRIS_TEXTE, fontSize: 8, marginBottom: 4, textTransform: "uppercase" },
  nomClient: { fontFamily: "Helvetica-Bold", fontSize: 12, marginBottom: 2 },

  // Tableau des prestations
  ligneTableau: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  enTeteTableau: {
    backgroundColor: VERT,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    borderRadius: 4,
  },
  colPrestation: { flex: 5 },
  colQte: { flex: 2, textAlign: "right" },
  colPu: { flex: 2, textAlign: "right" },
  colSousTotal: { flex: 2, textAlign: "right" },

  // Total
  blocTotal: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  cadreTotal: {
    backgroundColor: VERT,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: "row",
    gap: 20,
  },
  texteTotal: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 13 },

  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: GRIS_CLAIR,
    borderRadius: 6,
    color: GRIS_TEXTE,
  },

  // Pied de page : mentions légales
  piedDePage: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 8,
    fontSize: 7,
    color: GRIS_TEXTE,
    textAlign: "center",
  },
});

export function DevisPdf({ devis }: { devis: DonneesDevisPdf }) {
  const date = devis.dateCreation.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document title={`Devis n°${devis.id} — ${devis.nomClient}`}>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.entete}>
          <View>
            <Text style={styles.nomEntreprise}>{devis.entreprise.nom}</Text>
            <Text style={styles.coordonnees}>
              {devis.entreprise.codePostal} {devis.entreprise.ville}
            </Text>
          </View>
          <View>
            <Text style={styles.titreDevis}>DEVIS</Text>
            <Text style={styles.numeroDevis}>N° {String(devis.id).padStart(4, "0")}</Text>
            <Text style={styles.numeroDevis}>Le {date}</Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.blocClient}>
          <Text style={styles.labelClient}>Client</Text>
          <Text style={styles.nomClient}>{devis.nomClient}</Text>
          <Text>{devis.adresseChantier}</Text>
        </View>

        {/* Tableau des prestations */}
        <View style={[styles.ligneTableau, styles.enTeteTableau]}>
          <Text style={styles.colPrestation}>Prestation</Text>
          <Text style={styles.colQte}>Quantité</Text>
          <Text style={styles.colPu}>P.U. HT</Text>
          <Text style={styles.colSousTotal}>Total HT</Text>
        </View>
        {devis.lignes.map((l, i) => (
          <View key={i} style={styles.ligneTableau} wrap={false}>
            <Text style={styles.colPrestation}>{l.nomPrestation}</Text>
            <Text style={styles.colQte}>
              {l.quantite.toLocaleString("fr-FR")} {l.unite}
            </Text>
            <Text style={styles.colPu}>{euros(l.prixUnitaire)}</Text>
            <Text style={styles.colSousTotal}>{euros(l.sousTotal)}</Text>
          </View>
        ))}

        {/* Total HT */}
        <View style={styles.blocTotal}>
          <View style={styles.cadreTotal}>
            <Text style={styles.texteTotal}>TOTAL HT</Text>
            <Text style={styles.texteTotal}>{euros(devis.totalHT)}</Text>
          </View>
        </View>

        {/* Notes éventuelles */}
        {devis.notes && (
          <View style={styles.notes}>
            <Text>Remarques : {devis.notes}</Text>
          </View>
        )}

        {/* Mentions légales basiques (à personnaliser plus tard) */}
        <View style={styles.piedDePage} fixed>
          <Text>
            Devis valable 30 jours à compter de sa date d&apos;émission. TVA non applicable
            sur ce document (montants exprimés hors taxes).
          </Text>
          <Text>
            Bon pour accord — date et signature du client précédées de la mention
            « Bon pour accord ».
          </Text>
        </View>
      </Page>
    </Document>
  );
}
