<?php
declare(strict_types=1);

final class FreshRssClient
{
    private string $baseUrl;
    private string $token;

    public function __construct(array $config)
    {
        $this->baseUrl = rtrim($config['FRESHRSS_API_URL'], '/');

        $login = $this->request('/accounts/ClientLogin', [
            'Email' => $config['FRESHRSS_USERNAME'],
            'Passwd' => $config['FRESHRSS_API_PASSWORD'],
        ]);

        foreach (explode("\n", $login) as $line) {
            if (str_starts_with($line, 'Auth=')) {
                $this->token = trim(substr($line, 5));
                break;
            }
        }

        if (empty($this->token)) {
            throw new RuntimeException('FreshRSS authentication failed.');
        }
    }

    public function latestArticles(int $limit = 5): array
    {
        $limit = max(1, min(100, $limit));
        $response = $this->request(
            '/reader/api/0/stream/contents/reading-list?output=json&n=' . $limit
        );
        $data = json_decode($response, true, 512, JSON_THROW_ON_ERROR);

        if (!isset($data['items']) || !is_array($data['items'])) {
            throw new RuntimeException('FreshRSS returned an unexpected response.');
        }

        return $data['items'];
    }

    private function request(string $path, ?array $form = null): string
    {
        $handle = curl_init($this->baseUrl . $path);
        curl_setopt_array($handle, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_FOLLOWLOCATION => false,
        ]);

        if ($form !== null) {
            curl_setopt($handle, CURLOPT_POSTFIELDS, http_build_query($form));
        }

        if (isset($this->token)) {
            curl_setopt($handle, CURLOPT_HTTPHEADER, [
                'Authorization: GoogleLogin auth=' . $this->token,
            ]);
        }

        $body = curl_exec($handle);
        $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);

        if ($body === false) {
            throw new RuntimeException('Cannot reach FreshRSS. Check the SSH tunnel.');
        }

        if ($status !== 200) {
            throw new RuntimeException('FreshRSS request failed: HTTP ' . $status);
        }

        return $body;
    }
}
