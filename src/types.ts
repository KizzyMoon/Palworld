export type HabitatTime = "day" | "night" | "both";

export interface WorkSuitability {
  type: string;
  level: number;
}

export interface PalDrop {
  resourceId: string;
  notes?: string;
}

export interface PalHabitat {
  locationId: string;
  time: HabitatTime;
  notes?: string;
}

export interface Pal {
  id: number;
  key: string;
  name: string;
  variant?: string;
  image: string;
  elements: string[];
  description?: string;
  workSuitability: WorkSuitability[];
  partnerSkill?: {
    name: string;
    description: string;
  };
  possibleDrops: PalDrop[];
  butcherDrops?: PalDrop[];
  habitats: PalHabitat[];
  alphaLocations?: {
    locationId: string;
    level?: number;
    notes?: string;
  }[];
  breedingPower?: number;
  eggType?: string;
  rarity?: number;
  obtainableByBreeding?: boolean;
  obtainableInWild?: boolean;
  legendary?: boolean;
  alpha?: boolean;
  versionIntroduced?: string;
}

export interface Resource {
  id: string;
  name: string;
  image: string;
  category: string;
  description?: string;
  usedFor: {
    name: string;
    type: "item" | "building" | "food" | "technology" | "other";
    quantity?: number;
  }[];
  obtainedFrom: {
    type: "pal-drop" | "mining" | "gathering" | "crafting" | "merchant" | "dungeon" | "location" | "other";
    name: string;
    palId?: number;
    locationId?: string;
    notes?: string;
  }[];
}

export interface Location {
  id: string;
  name: string;
  region?: string;
  island?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  description?: string;
  recommendedLevel?: string;
}

export interface BreedingCombination {
  id: string;
  parentAId: number;
  parentBId: number;
  childId: number;
  specialCombination?: boolean;
  notes?: string;
}

export interface UserCollection {
  ownedPalIds: number[];
  favouritePalIds: number[];
  recentlyViewedPalIds: number[];
  savedBreedingCombinationIds: string[];
  completedBreedingCombinationIds: string[];
}
