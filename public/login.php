<?php
declare(strict_types=1);
require dirname(__DIR__).'/app/StudioAccess.php';
studioStartSession();
$next=studioSafeNext((string)($_GET['next']??$_POST['next']??'/studio/'));
$error=null;
if(($_SERVER['REQUEST_METHOD']??'GET')==='POST'){
    if(!hash_equals(studioCsrf(),(string)($_POST['csrf']??''))||!studioLogin((string)($_POST['password']??'')))$error='That password was not accepted.';
    else{header('Location: '.$next,true,303);exit;}
}
$csrf=studioCsrf();
header('Content-Type: text/html; charset=UTF-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · Vibe Studio</title><link rel="stylesheet" href="/studio.css"></head><body class="studio-login"><main class="login-card"><p class="eyebrow">VIBE STUDIO</p><h1>Welcome back</h1><p class="login-intro">Sign in to your private editorial workspace.</p><?php if($error): ?><p class="login-error" role="alert"><?= htmlspecialchars($error,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8') ?></p><?php endif; ?><form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8') ?>"><input type="hidden" name="next" value="<?= htmlspecialchars($next,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8') ?>"><label for="password">Studio password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button class="primary" type="submit">Enter Studio</button></form><p class="login-note">Private workspace · HTTPS required</p></main></body></html>
