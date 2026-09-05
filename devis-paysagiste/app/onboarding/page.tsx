import { Wizard } from "./Wizard";

// Onboarding : un wizard en 4 écrans, objectif < 10 minutes.
// (Les étapes « tester » et « installer » arrivent juste après la
// création, sur la page Installer du dashboard.)
export default function PageOnboarding() {
  return <Wizard />;
}
