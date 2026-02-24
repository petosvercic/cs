type TeaserItem = Record<string, unknown> & { locked?: boolean };

type TeaserCategory = Record<string, unknown> & { items?: TeaserItem[] };

type TeaserPack = Record<string, unknown> & { categories?: TeaserCategory[] };

export function applyPoolingA(pack: TeaserPack, teaserPerCategory: number, isPaid: boolean): TeaserPack {
  // returns a new pack-like object with items locked/unlocked for UI
  const cloned: TeaserPack = JSON.parse(JSON.stringify(pack));

  if (!cloned.categories || !Array.isArray(cloned.categories)) return cloned;

  for (const cat of cloned.categories) {
    if (!Array.isArray(cat.items)) continue;

    cat.items = cat.items.map((it, idx) => {
      const unlocked = isPaid || idx < teaserPerCategory;
      return {
        ...it,
        locked: !unlocked,
        // keď je locked, nech text/page nevykresľuje template ako "full"
        // (UI si vie vybrať čo ukáže)
      };
    });
  }

  return cloned;
}
