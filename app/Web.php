<?php
declare(strict_types=1);
require_once __DIR__ . '/SignalStore.php';
require_once __DIR__ . '/StudioAccess.php';
if (str_starts_with($_SERVER['SCRIPT_NAME'] ?? '', '/studio/')) studioRequireAuth();
function escape(string $value): string { return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function textInput(array $input, string $key, string $default = ''): string { return is_string($input[$key] ?? null) ? $input[$key] : $default; }
function inboxFilters(array $input): array {
    $view = textInput($input, 'view', 'inbox');
    return ['view' => in_array($view, ['inbox','saved','dismissed','all'], true) ? $view : 'inbox',
        'q' => substr(trim(textInput($input, 'q')), 0, 200), 'source' => substr(textInput($input, 'source'), 0, 2048),
        'topic' => array_key_exists(textInput($input, 'topic'), (new TopicClassifier())->labels()) ? textInput($input, 'topic') : '',
        'from' => substr(textInput($input, 'from'), 0, 10), 'to' => substr(textInput($input, 'to'), 0, 10)];
}
function signalPath(string $path = '/'): string {
    // Apache Alias sets SCRIPT_NAME; no client-supplied prefix header is trusted.
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    $prefix = str_starts_with($script, '/studio/') ? '/studio'
        : (str_starts_with($script, '/signal/') ? '/signal' : '');
    return $prefix . $path;
}
function inboxUrl(array $filters, int $page = 1): string {
    return signalPath('/index.php?') . http_build_query(array_filter($filters, static fn($v) => $v !== '') + ['page' => max(1, $page)]);
}
function displayDate(int $timestamp): string {
    return (new DateTimeImmutable('@' . $timestamp))->setTimezone(new DateTimeZone('America/New_York'))->format('M j, Y · g:i a');
}
function inboxAction(SignalStore $store, array $post, string $csrf): array {
    if ($csrf === '' || !hash_equals($csrf, textInput($post, 'csrf'))) throw new InvalidArgumentException('Your form expired. Reload the page and try again.', 403);
    $id = textInput($post, 'id'); $revision = filter_var(textInput($post, 'revision'), FILTER_VALIDATE_INT);
    if ($revision === false || $revision < 0) throw new InvalidArgumentException('Invalid story revision.', 400);
    $article = $store->article($id);
    if ($article === null) throw new InvalidArgumentException('That story is no longer available.', 404);
    $action = textInput($post, 'action');
    if ($action === 'notes') {
        $store->edit($id, $revision, 'notes', textInput($post, 'notes'));
        return ['message' => 'Notes saved.'];
    }
    if ($action === 'topic') {
        $store->edit($id, $revision, 'topic_override', textInput($post, 'topic'));
        return ['message' => textInput($post, 'topic') === 'auto' ? 'Automatic topic restored.' : 'Topic updated. Your choice will be kept on future refreshes.'];
    }
    if ($action === 'status') {
        $store->edit($id, $revision, 'status', textInput($post, 'status'));
        return ['message' => 'Story moved to ' . textInput($post, 'status') . '.',
            'undo' => ['id' => $id, 'status' => $article['status'], 'revision' => $revision + 1]];
    }
    throw new InvalidArgumentException('Invalid action.', 400);
}

require_once __DIR__ . '/StudioLayout.php';
