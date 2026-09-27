export interface SubCategory {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  displayOrder?: number;
}

export interface ProductCategory {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  isFeatured?: boolean;
  subcategories?: SubCategory[];
  featuredBrands?: string[];
}

export const COSMETIC_TAXONOMY: ProductCategory[] = [
  {
    id: "rostro",
    name: "Rostro",
    slug: "rostro",
    description: "Bases, correctores, polvos, primers y rubores para una piel impecable.",
    icon: "Sparkles",
    displayOrder: 1,
    isFeatured: true,
    subcategories: [
      { id: "bases", name: "Bases de Maquillaje", slug: "bases" },
      { id: "correctores", name: "Correctores", slug: "correctores" },
      { id: "polvos", name: "Polvos & Fijadores", slug: "polvos" },
      { id: "rubores-iluminadores", name: "Rubores & Iluminadores", slug: "rubores-iluminadores" },
      { id: "primers", name: "Primers & Preparadores", slug: "primers" },
    ],
    featuredBrands: ["Atenea", "Trendy", "Montoc", "Ruby Rose"],
  },
  {
    id: "ojos",
    name: "Ojos & Cejas",
    slug: "ojos",
    description: "Sombras, delineadores, pestañinas y fijadores de cejas de larga duración.",
    icon: "Eye",
    displayOrder: 2,
    isFeatured: true,
    subcategories: [
      { id: "sombras", name: "Paletas de Sombras", slug: "sombras" },
      { id: "pestanias", name: "Pestañinas / Máscaras", slug: "pestanias" },
      { id: "delineadores", name: "Delineadores", slug: "delineadores" },
      { id: "cejas", name: "Pomadas & Geles de Cejas", slug: "cejas" },
    ],
    featuredBrands: ["Atenea", "Montoc", "Ruby Rose", "Engol"],
  },
  {
    id: "labios",
    name: "Labios",
    slug: "labios",
    description: "Labiales mate, tintas coreanas, brillos voluminizadores y bálsamos hidratantes.",
    icon: "Smile",
    displayOrder: 3,
    isFeatured: true,
    subcategories: [
      { id: "labiales-mate", name: "Labiales Mate & Líquidos", slug: "labiales-mate" },
      { id: "gloss-tintas", name: "Glosses & Tintas", slug: "gloss-tintas" },
      { id: "delineadores-labios", name: "Delineadores de Labios", slug: "delineadores-labios" },
      { id: "balsamos", name: "Bálsamos & Tratamientos", slug: "balsamos" },
    ],
    featuredBrands: ["Trendy", "Atenea", "Ruby Rose", "Miis Cosmetics"],
  },
  {
    id: "skincare",
    name: "Skincare",
    slug: "skincare",
    description: "Sueros hidratantes, limpiadores faciales, protectores solares y mascarillas.",
    icon: "HeartHandshake",
    displayOrder: 4,
    isFeatured: true,
    subcategories: [
      { id: "limpiadores", name: "Limpiadores & Desmaquillantes", slug: "limpiadores" },
      { id: "serums", name: "Sérums & Tratamientos", slug: "serums" },
      { id: "hidratantes", name: "Cremas Hidratantes", slug: "hidratantes" },
      { id: "protector-solar", name: "Protección Solar", slug: "protector-solar" },
      { id: "mascarillas", name: "Mascarillas & Exfoliantes", slug: "mascarillas" },
    ],
    featuredBrands: ["Bioaqua", "Trendy", "Atenea Skincare", "The Ordinary"],
  },
  {
    id: "accesorios",
    name: "Accesorios & Brochas",
    slug: "accesorios",
    description: "Kits de brochas profesionales, esponjas, encrespadores y organizadores.",
    icon: "Wand2",
    displayOrder: 5,
    isFeatured: false,
    subcategories: [
      { id: "brochas", name: "Sets de Brochas", slug: "brochas" },
      { id: "esponjas", name: "Esponjas & Aplicadores", slug: "esponjas" },
      { id: "organizadores", name: "Cosmetiqueras & Organizadores", slug: "organizadores" },
      { id: "herramientas", name: "Herramientas de Belleza", slug: "herramientas" },
    ],
    featuredBrands: ["Montoc", "Atenea", "Trendy", "Cala"],
  },
  {
    id: "sets",
    name: "Kits & Regalos",
    slug: "sets",
    description: "Colecciones completas de belleza, sets de regalo y kits de inicio.",
    icon: "Gift",
    displayOrder: 6,
    isFeatured: true,
    subcategories: [
      { id: "kits-maquillaje", name: "Kits de Maquillaje", slug: "kits-maquillaje" },
      { id: "rutinas-skincare", name: "Rutinas Skincare", slug: "rutinas-skincare" },
      { id: "combos-ahorro", name: "Combos Ahorro", slug: "combos-ahorro" },
      { id: "regalos", name: "Cajas de Regalo", slug: "regalos" },
    ],
    featuredBrands: ["Prana Exclusives", "Trendy", "Atenea"],
  },
];
