-- Texty webu po revizi (3. 11. 2026): úvod, příběh, večer, obchodní podmínky, lahve hráčů.
-- Mění jen texty, které jsou stále ve výchozím znění – ruční úpravy v databázi zůstanou.

UPDATE "Setting" SET "value" = $t$Speciální slivovice 50 % na počest mistrů Evropy z Bělehradu. Jen 152 sběratelských boxů, v každém 13 lahví – jedna za každého hráče. Celkem 1 976 lahví – jako rok, kdy Československo slavilo titul mistrů Evropy.$t$, "updatedAt" = NOW()
WHERE "key" = 'home.hero_lead' AND "value" = $t$Speciální slivovice 50 % na počest mistrů Evropy z Bělehradu. 152 sběratelských boxů po 13 lahvích – jedna za každého hráče. Celkem 1 976 lahví.$t$;

UPDATE "Setting" SET "value" = 'Jednotlivé lahve připravujeme až na objednávku, dodací lhůta je 8 dní.', "updatedAt" = NOW()
WHERE "key" = 'bottle.lead_time' AND "value" = 'Kusovky vyrábíme až na objednávku, dodací lhůta je 8 dní.';

UPDATE "Page" SET "body" = $t$20\. června 1976 se na stadionu Crvene zvezdy v Bělehradě psala historie. Českoslovenští fotbalisté ve finále mistrovství Evropy porazili po prodloužení a penaltovém rozstřelu tým Západního Německa. Rozhodující penaltu proměnil Antonín Panenka – a jeho jemný „dloubák“ zná dodnes celý fotbalový svět.

K 50. výročí tohoto vítězství vzniká limitovaná edice **Mistři Evropy – Bělehrad 1976**: speciální slivovice 50 % ve 152 sběratelských boxech. Každý box ukrývá 13 lahví – jednu za každého hráče. Etiketa nese jeho portrét, jméno a číslo dresu.

**152 boxů × 13 lahví = 1 976 lahví.** Ani to číslo není náhoda.$t$, "updatedAt" = NOW()
WHERE "slug" = 'pribeh' AND "body" = $t$20\. června 1976 se na stadionu Crvene zvezdy v Bělehradě psala historie. Českoslovenští fotbalisté ve finále mistrovství Evropy porazili po prodloužení a penaltovém rozstřelu tým Západního Německa. Rozhodující penaltu proměnil Antonín Panenka – a jeho jemný „dloubák“ zná dodnes celý fotbalový svět.

K 50. výročí tohoto vítězství vzniká limitovaná edice **Mistři Evropy – Bělehrad 1976**. Speciální slivovice 50 % ve 152 sběratelských boxech. Každý box obsahuje 13 lahví – jednu za každého z hráčů, jejichž portrét, jméno a číslo nese etiketa.

**152 boxů × 13 lahví = 1 976 lahví.**$t$;

UPDATE "Page" SET "body" = REPLACE("body", $t$Kdo si v předprodeji objedná box, bude zařazen do **losování o vstup na večer** (vstup pouze pro 1 osobu na 1 zakoupený box). Zájem o účast stačí potvrdit při objednávce. Podrobnosti losování zveřejníme.$t$, $t$Kdo si v předprodeji objedná box, může se zapojit do **losování o vstup na večer** – stačí při objednávce zaškrtnout zájem o účast. Vstup pouze pro 1 osobu na 1 zakoupený box. Podrobnosti losování včas zveřejníme.$t$), "updatedAt" = NOW()
WHERE "slug" = 'vecer' AND POSITION($t$Kdo si v předprodeji objedná box, bude zařazen do **losování o vstup na večer** (vstup pouze pro 1 osobu na 1 zakoupený box). Zájem o účast stačí potvrdit při objednávce. Podrobnosti losování zveřejníme.$t$ IN "body") > 0;

UPDATE "Page" SET "body" = REPLACE("body", $t$Zboží doručujeme na adresu v České republice prostřednictvím dopravce, nebo je možné jej převzít osobně na adrese: {{pickup.address}}.$t$, $t$Zboží doručujeme na adresu v České republice, nebo je možné jej převzít osobně na adrese: {{pickup.address}}.

{{box.delivery}} {{bottle.lead_time}}$t$), "updatedAt" = NOW()
WHERE "slug" = 'obchodni-podminky' AND POSITION($t$Zboží doručujeme na adresu v České republice prostřednictvím dopravce, nebo je možné jej převzít osobně na adrese: {{pickup.address}}.$t$ IN "body") > 0;

-- Lahve hráčů: popis bez chybného skloňování („s portrétem hráče Antonín Panenka“)
UPDATE "Product"
SET "shortDescription" = "playerName" || ', číslo ' || "playerNumber" || ' – lahev slivovice 50 % s jeho portrétem na etiketě.',
    "updatedAt" = NOW()
WHERE "type" = 'BOTTLE'
  AND "shortDescription" = 'Lahev slivovice 50 % s portrétem hráče ' || "playerName" || ' (č. ' || "playerNumber" || ').';

UPDATE "Product"
SET "description" = 'Samostatná lahev z edice **Mistři Evropy – Bělehrad 1976**. Etiketu zdobí portrét, jméno a číslo dresu – **'
      || "playerName" || ', ' || "playerNumber" || E'**.\n\nSpeciální slivovice 50 %. Skvělý dárek pro každého fanouška československého fotbalu.\n\nVýtěžek edice jde na podporu Nadace fotbalových internacionálů.',
    "updatedAt" = NOW()
WHERE "type" = 'BOTTLE'
  AND "description" = 'Samostatná lahev z edice **Mistři Evropy – Bělehrad 1976** s portrétem, jménem a číslem hráče '
      || "playerName" || E'.\n\nSpeciální slivovice 50 %. Výtěžek edice jde na podporu Nadace fotbalových internacionálů.';
