-- Lahve hráčů: popis „s portrétem na etiketě“ (bez slova „jeho“).
-- Mění jen texty ve výchozím znění – ruční úpravy v databázi zůstanou.
UPDATE "Product"
SET "shortDescription" = "playerName" || ', číslo ' || "playerNumber" || ' – lahev slivovice 50 % s portrétem na etiketě.',
    "updatedAt" = NOW()
WHERE "type" = 'BOTTLE'
  AND "shortDescription" = "playerName" || ', číslo ' || "playerNumber" || ' – lahev slivovice 50 % s jeho portrétem na etiketě.';
