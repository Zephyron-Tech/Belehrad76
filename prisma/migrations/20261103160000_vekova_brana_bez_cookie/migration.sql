-- Věková brána 18+ se už neukládá do cookie (zobrazí se po každém novém načtení webu).
UPDATE "Page"
SET "body" = REPLACE("body", E'- potvrzení věku 18+,\n', ''), "updatedAt" = NOW()
WHERE "slug" = 'cookies' AND "body" LIKE E'%- potvrzení věku 18+,\n%';
