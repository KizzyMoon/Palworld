import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserCollection } from "./types";

const STORAGE_KEY = "palworld-companion.collection.v1";

const emptyCollection: UserCollection = {
  ownedPalIds: [],
  favouritePalIds: [],
  recentlyViewedPalIds: [],
  savedBreedingCombinationIds: [],
  completedBreedingCombinationIds: [],
};

interface CollectionContextValue {
  collection: UserCollection;
  isOwned: (id: number) => boolean;
  isFavourite: (id: number) => boolean;
  toggleOwned: (id: number) => void;
  toggleFavourite: (id: number) => void;
  markViewed: (id: number) => void;
  importCollection: (json: string) => boolean;
  exportCollection: () => string;
  clearOwned: () => void;
  clearFavourites: () => void;
  clearAll: () => void;
}

const CollectionContext = createContext<CollectionContextValue | null>(null);

function uniqueNumbers(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is number => Number.isInteger(item) && item > 0)));
}

function normalize(value: unknown): UserCollection {
  if (!value || typeof value !== "object") return emptyCollection;
  const candidate = value as Partial<UserCollection>;
  return {
    ownedPalIds: uniqueNumbers(candidate.ownedPalIds),
    favouritePalIds: uniqueNumbers(candidate.favouritePalIds),
    recentlyViewedPalIds: uniqueNumbers(candidate.recentlyViewedPalIds).slice(0, 12),
    savedBreedingCombinationIds: Array.isArray(candidate.savedBreedingCombinationIds)
      ? Array.from(new Set(candidate.savedBreedingCombinationIds.filter((item): item is string => typeof item === "string")))
      : [],
    completedBreedingCombinationIds: Array.isArray(candidate.completedBreedingCombinationIds)
      ? Array.from(new Set(candidate.completedBreedingCombinationIds.filter((item): item is string => typeof item === "string")))
      : [],
  };
}

function loadCollection(): UserCollection {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : emptyCollection;
  } catch {
    return emptyCollection;
  }
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollectionState] = useState<UserCollection>(loadCollection);

  function setCollection(next: UserCollection) {
    setCollectionState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const value = useMemo<CollectionContextValue>(
    () => ({
      collection,
      isOwned: (id) => collection.ownedPalIds.includes(id),
      isFavourite: (id) => collection.favouritePalIds.includes(id),
      toggleOwned: (id) => {
        const owned = collection.ownedPalIds.includes(id)
          ? collection.ownedPalIds.filter((palId) => palId !== id)
          : [...collection.ownedPalIds, id];
        setCollection({ ...collection, ownedPalIds: Array.from(new Set(owned)) });
      },
      toggleFavourite: (id) => {
        const favourite = collection.favouritePalIds.includes(id)
          ? collection.favouritePalIds.filter((palId) => palId !== id)
          : [...collection.favouritePalIds, id];
        setCollection({ ...collection, favouritePalIds: Array.from(new Set(favourite)) });
      },
      markViewed: (id) => {
        setCollection({
          ...collection,
          recentlyViewedPalIds: [id, ...collection.recentlyViewedPalIds.filter((palId) => palId !== id)].slice(0, 8),
        });
      },
      importCollection: (json) => {
        try {
          const parsed = normalize(JSON.parse(json));
          setCollection(parsed);
          return true;
        } catch {
          return false;
        }
      },
      exportCollection: () => JSON.stringify(collection, null, 2),
      clearOwned: () => setCollection({ ...collection, ownedPalIds: [] }),
      clearFavourites: () => setCollection({ ...collection, favouritePalIds: [] }),
      clearAll: () => setCollection(emptyCollection),
    }),
    [collection],
  );

  return <CollectionContext.Provider value={value}>{children}</CollectionContext.Provider>;
}

export function useCollection() {
  const value = useContext(CollectionContext);
  if (!value) throw new Error("useCollection must be used inside CollectionProvider");
  return value;
}
