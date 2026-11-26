import type { NicheDefinition } from "../types";

/**
 * Niche : assainissement non collectif (France).
 * Règle éditoriale : aucun chiffre, prix, délai, obligation réglementaire ou donnée technique
 * n'est affirmé. Les contenus orientent vers le SPANC et les professionnels.
 */
export const assainissement: NicheDefinition = {
  key: "assainissement",
  name: "Assainissement non collectif",
  locale: "fr-FR",
  otherServiceLabel: "Autre / je ne sais pas encore",
  services: [
    { slug: "fosse-toutes-eaux", name: "Installation de fosse toutes eaux", summary: "Vous envisagez l'installation d'une fosse toutes eaux pour votre logement." },
    { slug: "remplacement-fosse-septique", name: "Remplacement d'une ancienne fosse septique", summary: "Votre logement est équipé d'une ancienne fosse septique que vous souhaitez remplacer." },
    { slug: "micro-station", name: "Installation de micro-station d'épuration", summary: "Vous étudiez la possibilité d'installer une micro-station d'épuration." },
    { slug: "filtre-compact", name: "Installation de filtre compact", summary: "Vous vous intéressez à une filière de traitement par filtre compact." },
    { slug: "mise-en-conformite", name: "Mise en conformité d'un assainissement individuel", summary: "Votre installation doit être mise en conformité, par exemple à la suite d'un contrôle." },
    { slug: "rehabilitation", name: "Réhabilitation d'un système existant", summary: "Vous souhaitez faire réhabiliter une installation d'assainissement existante." },
  ],
  questions: [
    {
      id: "housing_type", kind: "choice", required: true, label: "Type de logement",
      choices: [
        { value: "main_home", label: "Maison – résidence principale" },
        { value: "second_home", label: "Maison – résidence secondaire" },
        { value: "new_build", label: "Construction neuve (en projet)" },
        { value: "other", label: "Autre (gîte, local professionnel…)" },
      ],
    },
    {
      id: "main_rooms", kind: "number", required: false, min: 1, max: 30,
      label: "Nombre de pièces principales",
      help: "Si vous le connaissez. Laissez vide sinon.",
      unknownLabel: "Je ne sais pas",
    },
    {
      id: "current_install", kind: "choice", required: true, label: "Installation actuelle",
      choices: [
        { value: "none", label: "Aucune (construction neuve)" },
        { value: "old_septic", label: "Ancienne fosse septique" },
        { value: "all_water_tank", label: "Fosse toutes eaux" },
        { value: "micro_station", label: "Micro-station" },
        { value: "compact_filter", label: "Filtre compact ou filtre à sable" },
        { value: "unknown", label: "Je ne sais pas" },
      ],
    },
    {
      id: "spanc_diagnosis", kind: "choice", required: true, label: "Diagnostic du SPANC",
      help: "Le SPANC est le service public chargé du contrôle de l'assainissement non collectif.",
      choices: [
        { value: "non_compliant", label: "Oui – installation non conforme" },
        { value: "compliant", label: "Oui – installation conforme" },
        { value: "pending", label: "Contrôle prévu ou en attente" },
        { value: "none", label: "Non, pas de diagnostic" },
        { value: "unknown", label: "Je ne sais pas" },
      ],
    },
  ],
  timelines: [
    { value: "asap", label: "Dès que possible", actionable: "high" },
    { value: "3_months", label: "Dans les 3 mois", actionable: "high" },
    { value: "6_months", label: "Dans les 6 mois", actionable: "medium" },
    { value: "12_months", label: "Dans l'année", actionable: "medium" },
    { value: "later", label: "Plus tard / simple renseignement", actionable: "low" },
    { value: "unknown", label: "Je ne sais pas encore", actionable: "low" },
  ],
  content: {
    heroTitle: (zone) => `Votre projet d'assainissement individuel en ${zone}`,
    heroSubtitle: (zone) =>
      `Décrivez votre projet en quelques minutes. Nous transmettons votre demande à une entreprise partenaire intervenant en ${zone}, qui pourra vous recontacter.`,
    howItWorks: [
      { title: "Vous décrivez votre projet", text: "Un formulaire court, sans engagement et gratuit pour vous." },
      { title: "Nous vérifions la demande", text: "Chaque demande est relue avant toute transmission." },
      { title: "Une entreprise vous recontacte", text: "Avec votre accord, une seule entreprise partenaire de votre secteur reçoit vos coordonnées." },
    ],
    serviceBody: (service, zone) => [
      `Vous avez un projet de type « ${service} » en ${zone} ? Ce site vous permet de déposer une demande qui sera transmise, avec votre accord, à une entreprise partenaire intervenant dans votre secteur.`,
      "Le choix de la solution adaptée dépend de nombreux paramètres propres à votre logement et à votre terrain. Il relève des professionnels et des contrôles du SPANC : ce site ne fournit pas de conseil technique ni d'estimation de prix.",
      "Plus votre description est précise (type de logement, installation actuelle, diagnostic éventuel), plus l'entreprise pourra vous répondre utilement.",
    ],
    faq: [
      { q: "Qui êtes-vous ?", a: "Ce site est un service de mise en relation. Nous ne réalisons aucun travaux nous-mêmes : nous transmettons votre demande à une entreprise partenaire indépendante intervenant dans votre secteur." },
      { q: "Le service est-il gratuit ?", a: "Oui, déposer une demande est gratuit et sans engagement pour vous. Le service est rémunéré par les entreprises partenaires qui reçoivent les demandes." },
      { q: "Combien d'entreprises vont me contacter ?", a: "Votre demande est transmise à une seule entreprise partenaire, si une entreprise disponible intervient dans votre secteur. Nous ne pouvons pas garantir qu'une entreprise sera disponible pour chaque demande." },
      { q: "Vais-je obtenir un devis ?", a: "L'entreprise partenaire vous recontacte pour échanger sur votre projet. L'établissement d'un devis, ses conditions, son prix et ses délais relèvent uniquement de l'entreprise." },
      { q: "Qu'est-ce que le SPANC ?", a: "Le Service Public d'Assainissement Non Collectif (SPANC) est le service, rattaché à la commune ou à l'intercommunalité, chargé du contrôle des installations d'assainissement individuel. Renseignez-vous auprès de votre mairie pour connaître le SPANC compétent." },
      { q: "Que faites-vous de mes données ?", a: "Vos données servent uniquement à traiter votre demande et, avec votre accord explicite, à la transmettre à une entreprise partenaire. Vous pouvez demander leur consultation ou leur suppression à tout moment (voir la politique de confidentialité)." },
    ],
  },
};
