export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  color?: string | null;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
}
