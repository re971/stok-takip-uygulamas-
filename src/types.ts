export interface StockComponent {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location: string;
  notes: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectNeededComponent {
  name: string;
  quantity: number;
  category: string;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  status: "Planlandı" | "Yapım Aşamasında" | "Tamamlandı";
  codeSnippet: string;
  circuitInstructions: string;
  neededComponents: ProjectNeededComponent[];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryType = 
  | "Mikrodenetleyici"
  | "Sensör"
  | "Aktüatör"
  | "Ekran"
  | "Pasif Bileşen"
  | "Güç ve Kablo"
  | "Prototipleme (Breadboard vb.)"
  | "Diğer";

export const CATEGORIES: CategoryType[] = [
  "Mikrodenetleyici",
  "Sensör",
  "Aktüatör",
  "Ekran",
  "Pasif Bileşen",
  "Güç ve Kablo",
  "Prototipleme (Breadboard vb.)",
  "Diğer"
];
