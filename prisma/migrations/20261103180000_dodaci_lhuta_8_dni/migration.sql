-- Dodací lhůta 8 dní; box doručuje kurýr (3. 11. 2026). Mění jen výchozí znění.
UPDATE "Setting"
SET "value" = 'Kusovky vyrábíme až na objednávku, dodací lhůta je 8 dní.', "updatedAt" = NOW()
WHERE "key" = 'bottle.lead_time'
  AND "value" IN (
    'Kusovky vyrábíme až na objednávku: dodací lhůta je běžné doručení Zásilkovnou + 5 dní.',
    'Kusovky vyrábíme až na objednávku, proto počítejte s delší dodací lhůtou.'
  );

INSERT INTO "Setting" ("key", "value", "description", "updatedAt")
VALUES ('box.delivery', 'Box doručujeme kurýrem, dodací lhůta je 8 dní.', 'Text o doručení boxu (kurýr, dodací lhůta)', NOW())
ON CONFLICT ("key") DO NOTHING;
