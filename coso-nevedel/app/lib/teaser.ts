export function applyPoolingA(pack: any, teaserPerCategory: number, isPaid: boolean) {
  // returns a new pack-like object with items locked/unlocked for UI
  const cloned = JSON.parse(JSON.stringify(pack));

  if (!cloned?.categories || !Array.isArray(cloned.categories)) return cloned;

  for (const cat of cloned.categories) {
    if (!Array.isArray(cat.items)) continue;

    cat.items = cat.items.map((it: any, idx: number) => {
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
