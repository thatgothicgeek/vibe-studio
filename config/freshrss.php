<?php
declare(strict_types=1);

$path = dirname(__DIR__) . '/.env';

if (!is_readable($path)) {
    throw new RuntimeException('Local .env configuration is missing or unreadable.');
}

$config = [];

foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    $line = trim($line);

    if ($line === '' || str_starts_with($line, '#')) {
        continue;
    }

    $parts = explode('=', $line, 2);

    if (count($parts) !== 2) {
        throw new RuntimeException('Invalid configuration line.');
    }

    [$key, $value] = $parts;
    $config[trim($key)] = json_decode(trim($value), true, 512, JSON_THROW_ON_ERROR);
}

foreach (['FRESHRSS_API_URL', 'FRESHRSS_USERNAME', 'FRESHRSS_API_PASSWORD'] as $key) {
    if (!isset($config[$key]) || !is_string($config[$key]) || $config[$key] === '') {
        throw new RuntimeException('Missing configuration: ' . $key);
    }
}

return $config;
