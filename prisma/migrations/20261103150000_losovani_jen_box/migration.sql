-- Losování o vstup na večer jen pro kupující boxu (3. 11. 2026). Mění jen výchozí znění textu.
UPDATE "Page"
SET "body" = REPLACE("body", 'Kdo si objedná v předprodeji, bude zařazen do **losování o vstup na večer**', 'Kdo si v předprodeji objedná box, bude zařazen do **losování o vstup na večer**'),
    "updatedAt" = NOW()
WHERE "slug" = 'vecer' AND "body" LIKE '%Kdo si objedná v předprodeji, bude zařazen do **losování o vstup na večer**%';
