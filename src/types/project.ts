export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  archived?: boolean;
}
