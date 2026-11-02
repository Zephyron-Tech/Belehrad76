/**
 * 13 hráčů edice v pořadí lahví na fotce (potvrzeno zadavatelem).
 * Slouží pro výchozí naplnění databáze a pro přípravu obrázků.
 * Po naplnění se hráči upravují přímo v tabulce Product.
 */
export type PlayerSeed = {
  slug: string;
  firstName: string;
  lastName: string;
  number: number;
};

export const PLAYERS: PlayerSeed[] = [
  { slug: "ivo-viktor", firstName: "Ivo", lastName: "Viktor", number: 1 },
  { slug: "karol-dobias", firstName: "Karol", lastName: "Dobiaš", number: 2 },
  { slug: "jozef-capkovic", firstName: "Jozef", lastName: "Čapkovič", number: 3 },
  { slug: "anton-ondrus", firstName: "Anton", lastName: "Ondruš", number: 4 },
  { slug: "jan-pivarnik", firstName: "Ján", lastName: "Pivarník", number: 5 },
  { slug: "ladislav-jurkemik", firstName: "Ladislav", lastName: "Jurkemik", number: 6 },
  { slug: "antonin-panenka", firstName: "Antonín", lastName: "Panenka", number: 7 },
  { slug: "jozef-moder", firstName: "Jozef", lastName: "Móder", number: 8 },
  { slug: "marian-masny", firstName: "Marián", lastName: "Masný", number: 10 },
  { slug: "zdenek-nehoda", firstName: "Zdeněk", lastName: "Nehoda", number: 11 },
  { slug: "koloman-gogh", firstName: "Koloman", lastName: "Gögh", number: 12 },
  { slug: "frantisek-vesely", firstName: "František", lastName: "Veselý", number: 16 },
  { slug: "jan-svehlik", firstName: "Ján", lastName: "Švehlík", number: 17 },
];
