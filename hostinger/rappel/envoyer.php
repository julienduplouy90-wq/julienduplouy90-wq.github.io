<?php
declare(strict_types=1);

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /rappel/');
    exit;
}

// Champ piège anti-robots : un humain le laisse vide.
if (!empty($_POST['site_web'])) {
    header('Location: /rappel/merci/');
    exit;
}

$nettoie = static function (string $s, int $max): string {
    return trim(mb_substr(str_replace([';', "\r", "\n"], [',', ' ', ' '], $s), 0, $max));
};

$nom     = $nettoie((string)($_POST['nom'] ?? ''), 100);
$tel     = $nettoie((string)($_POST['telephone'] ?? ''), 30);
$moment  = $nettoie((string)($_POST['moment'] ?? ''), 120);
$message = $nettoie((string)($_POST['message'] ?? ''), 1000);

if ($nom === '' || !preg_match('/^[0-9 +().\-]{6,}$/', $tel)) {
    header('Location: /rappel/?erreur=1');
    exit;
}

$quand = date('d/m/Y H:i');

// Trace locale (fichier bloqué en lecture web par le .htaccess),
// pour ne perdre aucune demande même si l'e-mail n'arrive pas.
$ligne = implode(';', [$quand, $nom, $tel, $moment, $message]) . "\n";
@file_put_contents(__DIR__ . '/demandes.csv', $ligne, FILE_APPEND | LOCK_EX);

$corps = "Nouvelle demande de rappel depuis le site Tamboulou\n\n"
       . "Nom : $nom\n"
       . "Téléphone : $tel\n"
       . ($moment !== '' ? "Moment souhaité : $moment\n" : '')
       . ($message !== '' ? "Message : $message\n" : '')
       . "\nReçue le $quand.";

$hote = preg_replace('/[^a-z0-9.\-]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'tamboulou.site'));
$entetes = "From: Tamboulou <rappel@$hote>\r\n"
         . "Content-Type: text/plain; charset=UTF-8\r\n";

@mail(
    'alexandregodgenger@gmail.com',
    '=?UTF-8?B?' . base64_encode("Tamboulou — demande de rappel de $nom") . '?=',
    $corps,
    $entetes
);

header('Location: /rappel/merci/');
exit;
