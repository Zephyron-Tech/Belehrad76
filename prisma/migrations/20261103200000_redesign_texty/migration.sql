-- Redesign úvodu (3. 11. 2026): kratší nadpis nadace (vejde se na dva řádky i na telefonu)
-- a příběh bez závěrečného součtu, který je teď na stránce jako velké číslo pod fotkou lahví.
-- Mění jen texty, které jsou stále ve výchozím znění – ruční úpravy v databázi zůstanou.

UPDATE "Page" SET "title" = 'Výtěžek pro internacionály', "updatedAt" = NOW()
WHERE "slug" = 'nadace' AND "title" = 'Výtěžek pro Nadaci fotbalových internacionálů';

UPDATE "Page" SET "body" = regexp_replace("body", '\s*\*\*152 boxů × 13 lahví = 1.976 lahví\.\*\* Ani to číslo není náhoda\.\s*$', ''), "updatedAt" = NOW()
WHERE "slug" = 'pribeh' AND "body" ~ '\*\*152 boxů × 13 lahví = 1.976 lahví\.\*\* Ani to číslo není náhoda\.\s*$';
