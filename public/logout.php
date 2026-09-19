<?php
declare(strict_types=1);
require dirname(__DIR__).'/app/StudioAccess.php';
studioLogout();
header('Location: /studio/login.php',true,303);exit;
