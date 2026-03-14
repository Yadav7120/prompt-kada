export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Prompt {
  id: number;
  title: string;
  description: string;
  content: string;
  category_id: number;
  category_name: string;
  tags: string;
  created_at: string;
  updated_at: string;
  views: number;
  copies: number;
  is_public: number;
}

export interface AdminStats {
  totalPrompts: number;
  totalViews: number;
  totalCopies: number;
  recentPrompts: Prompt[];
}
