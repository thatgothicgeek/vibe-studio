<?php
declare(strict_types=1);

function studioIcon(string $name): string {
    static $icons = [];
    if (!in_array($name, ['house','list','file-text','layers','image','palette','settings','monitor','search','plus','x','sun','moon','panel-left-close','bookmark','save'], true)) return '';
    return $icons[$name] ??= (string)file_get_contents(dirname(__DIR__).'/public/icons/'.$name.'.svg');
}

function studioLinks(string $active): void {
    foreach ([
        'dashboard'=>['Dashboard','house'], 'discover'=>['Discover','list'], 'desk'=>['News Desk','file-text'],
        'sources'=>['Sources','layers'], 'content'=>['Content','file-text'], 'organize'=>['Organize','layers'], 'media'=>['Media','image'],
        'presentation'=>['Presentation','palette'], 'queue'=>['Queue','list'], 'status'=>['Status','monitor'],
        'settings'=>['Settings','settings'],
    ] as $key=>[$label,$icon]) {
        $path = $key === 'discover' ? '/signals.php' : '/'.$key.'.php';
        echo '<a href="'.escape(signalPath($path)).'" aria-label="'.escape($label).'" '.($key===$active?'aria-current="page"':'').'>'.studioIcon($icon).'<span>'.escape($label).'</span></a>';
    }
}

function studioNavigation(string $active): void { ?>
<a class="skip-link" href="#content">Skip to content</a>
<aside class="studio-sidebar" aria-label="Studio sidebar">
    <a class="studio-brand" href="<?= escape(signalPath('/dashboard.php')) ?>">vibe studio</a>
    <nav aria-label="Studio navigation"><?php studioLinks($active); ?></nav>
    <button type="button" class="collapse-control" aria-label="Collapse sidebar" aria-expanded="true" data-collapse><?= studioIcon('panel-left-close') ?><span>Collapse</span></button>
    <a class="studio-logout" href="<?= escape(signalPath('/logout.php')) ?>">Sign out</a>
</aside>
<header class="studio-header">
    <button type="button" class="mobile-menu icon-button" data-dialog="navigation-dialog" aria-label="Open navigation"><?= studioIcon('list') ?></button>
    <a class="studio-brand mobile-brand" href="<?= escape(signalPath('/dashboard.php')) ?>">vibe studio</a>
    <span class="workspace-label">THE GEEK GUIDE <span>/ EDITORIAL WORKSPACE</span></span>
    <div class="studio-tools">
        <button type="button" class="icon-button" data-dialog="search-dialog" aria-label="Search workspace"><?= studioIcon('search') ?></button>
        <button type="button" class="icon-button" data-theme-toggle aria-label="Switch color theme"><?= studioIcon('sun') ?></button>
        <a class="button quick-post" href="<?= escape(signalPath('/content.php?type=quick-post')) ?>">Quick Post</a>
        <button type="button" class="primary new-content" data-dialog="create-dialog"><?= studioIcon('plus') ?><span>New Content</span></button>
    </div>
</header>
<dialog id="navigation-dialog" class="navigation-drawer" aria-labelledby="navigation-title">
    <div class="dialog-heading"><h2 id="navigation-title">vibe studio</h2><button type="button" data-close aria-label="Close navigation"><?= studioIcon('x') ?></button></div>
    <nav aria-label="Mobile Studio navigation"><?php studioLinks($active); ?></nav>
    <a class="button" href="<?= escape(signalPath('/content.php?type=quick-post')) ?>">Quick Post</a>
    <button type="button" data-dialog="create-dialog">New Content</button>
</dialog>
<dialog id="search-dialog" aria-labelledby="search-title">
    <div class="dialog-heading"><h2 id="search-title">Search workspace</h2><button type="button" data-close aria-label="Close search"><?= studioIcon('x') ?></button></div>
    <form method="get" action="<?= escape(signalPath('/signals.php')) ?>"><input type="hidden" name="view" value="all"><label for="workspace-search">Search processed story clusters</label><input id="workspace-search" name="q" type="search" maxlength="200" placeholder="Find a story" required><p class="muted">Search the processed story workspace.</p><button class="primary" type="submit">Search</button></form>
</dialog>
<dialog id="create-dialog" class="create-menu" aria-labelledby="create-title">
    <div class="dialog-heading"><h2 id="create-title">New Content</h2><button type="button" data-close aria-label="Close new content"><?= studioIcon('x') ?></button></div>
    <p class="muted">Choose a format. Creation requires the publishing connection.</p>
    <div class="creation-types"><?php foreach (['news'=>'News','roundup'=>'Roundup','feature'=>'Feature','review'=>'Review','guide'=>'Guide'] as $key=>$label): ?><a href="<?= escape(signalPath('/content.php?type='.$key)) ?>"><?= escape($label) ?></a><?php endforeach; ?></div>
</dialog>
<?php }
