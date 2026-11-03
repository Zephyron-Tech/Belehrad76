-- Potvrzení věku 18+ se ukládá do cookie s platností 5 minut.
UPDATE "Page"
SET "body" = REPLACE("body", E'## Nezbytné\n\n- obsah košíku', E'## Nezbytné\n\n- potvrzení věku 18+ (platí 5 minut),\n- obsah košíku'),
    "updatedAt" = NOW()
WHERE "slug" = 'cookies' AND "body" NOT LIKE '%potvrzení věku 18+%';
