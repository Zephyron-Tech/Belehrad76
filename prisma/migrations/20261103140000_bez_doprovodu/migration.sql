-- Slavnostní večer: vstup pouze pro 1 osobu na 1 zakoupený box, doprovod se nesbírá (3. 11. 2026).
ALTER TABLE "Order" DROP COLUMN "companionName";

-- Texty v už naplněné databázi (jen pokud jsou ve výchozím znění)
UPDATE "Page"
SET "body" = REPLACE("body", '**losování o vstup na večer včetně doprovodu**.', '**losování o vstup na večer** (vstup pouze pro 1 osobu na 1 zakoupený box).'),
    "updatedAt" = NOW()
WHERE "slug" = 'vecer' AND "body" LIKE '%losování o vstup na večer včetně doprovodu%';

UPDATE "Page"
SET "body" = REPLACE("body", 'evidujeme váš zájem o zařazení do losování o vstup a jméno doprovodu.', 'evidujeme váš zájem o zařazení do losování o vstup.'),
    "updatedAt" = NOW()
WHERE "slug" = 'ochrana-osobnich-udaju' AND "body" LIKE '%losování o vstup a jméno doprovodu.%';
