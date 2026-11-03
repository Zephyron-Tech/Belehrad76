-- Připomínky zadavatele 3. 11. 2026 – úprava výchozích dat v už naplněné databázi.
-- Mění jen hodnoty, které jsou stále ve výchozím znění (ruční úpravy v DB zůstanou).
-- Na prázdné databázi nic nedělá, nové hodnoty doplní seed.

-- Dodací lhůta kusovek: Zásilkovna + 5 dní
UPDATE "Setting"
SET "value" = 'Kusovky vyrábíme až na objednávku: dodací lhůta je běžné doručení Zásilkovnou + 5 dní.',
    "description" = 'Text o dodací lhůtě kusovek',
    "updatedAt" = NOW()
WHERE "key" = 'bottle.lead_time'
  AND "value" = 'Kusovky vyrábíme až na objednávku, proto počítejte s delší dodací lhůtou.';

-- Doprava: s boxem jednou 490 Kč, kusovky se k boxu nepřičítají
UPDATE "Setting"
SET "description" = 'Doprava za objednávku s boxem v Kč (jednou, i při více boxech a kusovkách)', "updatedAt" = NOW()
WHERE "key" = 'shipping.box_czk';
UPDATE "Setting"
SET "description" = 'Doprava za každou kusovku v Kč (jen u objednávky bez boxu)', "updatedAt" = NOW()
WHERE "key" = 'shipping.bottle_czk';

-- Příběh edice: bez věty „Ani o jednu víc.“
UPDATE "Page"
SET "body" = REPLACE("body", ' Ani o jednu víc.', ''), "updatedAt" = NOW()
WHERE "slug" = 'pribeh' AND "body" LIKE '% Ani o jednu víc.%';
