<?php

declare(strict_types=1);

// Formatting + safe lint fixes. Check: vendor/bin/php-cs-fixer fix --dry-run --diff
// Pairs with REFERENCE.md (MUST 2). Enforces strict_types and strict comparisons.

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/src')
    ->in(__DIR__ . '/tests');

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@PSR12' => true,
        'declare_strict_types' => true,   // MUST: every file declares strict_types=1
        'strict_comparison' => true,      // MUST NOT: == type juggling -> ===
        'strict_param' => true,
        'no_unused_imports' => true,
        'ordered_imports' => true,
        'single_quote' => true,
        'no_superfluous_phpdoc_tags' => true,
        'void_return' => true,
    ])
    ->setFinder($finder);
