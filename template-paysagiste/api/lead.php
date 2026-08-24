<?php
/* =====================================================================
   Endpoint de réception des demandes de devis.
   POST /api/lead.php  (JSON)

   - Valide et normalise le lead envoyé par le formulaire.
   - Notifie l'entreprise par email (mail() : disponible sur
     Hostinger / o2switch sans configuration).
   - Transmet le contact à Systeme.io si une clé API est configurée
     dans api/config.php (JAMAIS dans le JavaScript du navigateur).

   Mise en service :
     1. copier config.sample.php -> config.php
     2. renseigner NOTIFY_EMAIL (email du paysagiste)
     3. renseigner SYSTEMEIO_API_KEY quand l'intégration est prête
   config.php est exclu de Git (.gitignore).
   ===================================================================== */

header('Content-Type: application/json; charset=utf-8');

// Même origine uniquement : ce endpoint sert le formulaire du site.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'method']);
  exit;
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
  http_response_code(503);
  echo json_encode(['ok' => false, 'error' => 'not-configured']);
  exit;
}
$config = require $configFile;

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'bad-json']);
  exit;
}

/* ---------- Normalisation ---------- */
function clean($v, $max = 300) {
  $v = trim((string)($v ?? ''));
  $v = preg_replace('/[\r\n\t]+/', ' ', $v);
  return mb_substr($v, 0, $max);
}

$lead = [
  'firstName'   => clean($data['firstName'] ?? ''),
  'lastName'    => clean($data['lastName'] ?? ''),
  'email'       => clean($data['email'] ?? ''),
  'phone'       => clean($data['phone'] ?? '', 40),
  'projectType' => clean($data['projectType'] ?? ''),
  'city'        => clean($data['city'] ?? ''),
  'postalCode'  => clean($data['postalCode'] ?? '', 12),
  'surface'     => clean($data['surface'] ?? ''),
  'budget'      => clean($data['budget'] ?? ''),
  'timeframe'   => clean($data['timeframe'] ?? ''),
  'description' => mb_substr(trim((string)($data['description'] ?? '')), 0, 4000),
  'photoCount'  => (int)($data['photoCount'] ?? 0),
  'source'      => clean($data['source'] ?? 'website'),
  'createdAt'   => date('c'),
];

/* Validation minimale : un moyen de contact + un nom */
$hasContact = ($lead['phone'] !== '' || filter_var($lead['email'], FILTER_VALIDATE_EMAIL));
$hasName = ($lead['firstName'] !== '' || $lead['lastName'] !== '');
if (!$hasContact || !$hasName) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'invalid-lead']);
  exit;
}

/* ---------- 1. Notification email à l'entreprise ---------- */
$to = $config['NOTIFY_EMAIL'] ?? '';
if ($to !== '') {
  $subject = 'Nouvelle demande de devis — ' . trim($lead['firstName'] . ' ' . $lead['lastName']);
  $lines = [
    'Nouvelle demande de devis',
    '',
    'Nom      : ' . trim($lead['firstName'] . ' ' . $lead['lastName']),
    'Lieu     : ' . trim($lead['city'] . ' ' . $lead['postalCode']),
    'Projet   : ' . $lead['projectType'],
    'Surface  : ' . $lead['surface'],
    'Budget   : ' . $lead['budget'],
    'Début    : ' . $lead['timeframe'],
    'Photos   : ' . $lead['photoCount'],
    '',
    'Téléphone : ' . $lead['phone'],
    'Email     : ' . $lead['email'],
    '',
    'Description :',
    $lead['description'],
  ];
  $headers = 'From: ' . ($config['FROM_EMAIL'] ?? ('noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'))) . "\r\n"
           . 'Content-Type: text/plain; charset=utf-8';
  @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', implode("\n", $lines), $headers);
}

/* ---------- 2. Transmission Systeme.io (si configurée) ---------- */
$sioKey = $config['SYSTEMEIO_API_KEY'] ?? '';
if ($sioKey !== '' && $sioKey !== 'TODO_SYSTEMEIO_API_KEY' && $lead['email'] !== '') {
  // Création/mise à jour du contact via l'API Systeme.io.
  // Docs : https://developer.systeme.io — endpoint POST /api/contacts
  // TODO: adapter les champs personnalisés (fields) et les tags aux
  // slugs réellement créés dans le compte Systeme.io du business.
  $payload = json_encode([
    'email' => $lead['email'],
    'fields' => [
      ['slug' => 'first_name', 'value' => $lead['firstName']],
      ['slug' => 'surname', 'value' => $lead['lastName']],
      ['slug' => 'phone_number', 'value' => $lead['phone']],
      ['slug' => 'city', 'value' => $lead['city']],
      // TODO: créer côté Systeme.io les champs projet/surface/budget/délai
    ],
  ]);
  $ch = curl_init('https://api.systeme.io/api/contacts');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
      'Content-Type: application/json',
      'X-API-Key: ' . $sioKey,
    ],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
  ]);
  curl_exec($ch);
  curl_close($ch);
  // Un échec Systeme.io ne bloque pas la réponse : l'email est déjà parti.
}

/* ---------- 3. TODO futurs ----------
   - Upload réel des photos (multipart) vers un dossier protégé + lien
     dans l'email de notification.
   - SMS via Twilio (TODO_TWILIO_SID / TODO_TWILIO_TOKEN) quand décidé.
   - Journalisation des leads (CSV ou SQLite) si utile.
*/

echo json_encode(['ok' => true]);
