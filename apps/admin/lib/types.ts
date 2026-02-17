export type ProductListResponse = {
  items: {
    id: string;
    title: string;
    path: string;
    exists: boolean;
  }[];
};

export type ProductDetailResponse = {
  id: string;
  name: string;
  title: string;
  path: string;
  exists: boolean;
  scripts: Record<string, string>;
  dependenciesSummary: {
    count: number;
    names: string[];
  };
  lastModified: string | null;
};

export type EditionsResponse = {
  product: string;
  items: {
    slug: string;
    title: string;
    updatedAt?: string;
  }[];
  sourceNotFound: boolean;
  sourcePath: string | null;
  searchedPaths: string[];
};
