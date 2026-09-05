<?php
/* =====================================================================
   Réception automatique des fiches artisans du simulateur.
   POST /simulateur/fiche.php  (JSON : nom, email, tel, zone, lien)

   - Ajoute la fiche au fichier fiches-q7x2m4.csv (nom volontairement
     non devinable), que le Google Sheet de suivi importe tout seul
     via IMPORTDATA.
   - Notifie Paysage Digital par email (mail(), dispo sur Hostinger).

   Même mécanique que template-paysagiste/api/lead.php.
   ===================================================================== */

header('Content-Type: application/json; charset=utf-8');

const EMAIL_PAYSAGE_DIGITAL = 'julien.duplouy90@gmail.com';
const FICHIER_CSV = __DIR__ . '/fiches-q7x2m4.csv';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'method']);
  exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'bad-json']);
  exit;
}

/* ---------- Normalisation ---------- */
function nettoyer($v, $max = 300) {
  $v = trim((string)($v ?? ''));
  $v = preg_replace('/[\r\n\t]+/', ' ', $v);
  return mb_substr($v, 0, $max);
}

$fiche = [
  'date'       => date('d/m/Y H:i'),
  'entreprise' => nettoyer($data['nom'] ?? ''),
  'email'      => nettoyer($data['email'] ?? ''),
  'telephone'  => nettoyer($data['tel'] ?? '', 40),
  'zone'       => nettoyer($data['zone'] ?? ''),
  'lien'       => nettoyer($data['lien'] ?? '', 3000),
];

if ($fiche['entreprise'] === '' || !filter_var($fiche['email'], FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'invalid']);
  exit;
}

/* ---------- 1. Ajout au CSV (créé avec en-têtes au premier passage) ---------- */
$nouveau = !file_exists(FICHIER_CSV);
$f = fopen(FICHIER_CSV, 'a');
if ($f) {
  flock($f, LOCK_EX);
  if ($nouveau) {
    fputcsv($f, ['date', 'entreprise', 'email', 'telephone', 'zone', 'lien']);
  }
  fputcsv($f, array_values($fiche));
  flock($f, LOCK_UN);
  fclose($f);
}

/* ---------- 2. Notification email à Paysage Digital ---------- */
$sujet = 'Nouvelle fiche artisan — ' . $fiche['entreprise'];
$corps = implode("\n", [
  'Nouvelle fiche artisan via le simulateur',
  '',
  'Entreprise : ' . $fiche['entreprise'],
  'Email      : ' . $fiche['email'],
  'Téléphone  : ' . $fiche['telephone'],
  'Zone       : ' . $fiche['zone'],
  '',
  'Lien du simulateur :',
  $fiche['lien'],
  '',
  '(La fiche est aussi dans le Google Sheet « Artisans — Simulateur Paysage Digital ».)',
]);
$entetes = 'From: noreply@' . ($_SERVER['HTTP_HOST'] ?? 'paysagedigital.fr') . "\r\n"
         . 'Content-Type: text/plain; charset=utf-8';
@mail(EMAIL_PAYSAGE_DIGITAL, '=?UTF-8?B?' . base64_encode($sujet) . '?=', $corps, $entetes);

echo json_encode(['ok' => true]);
