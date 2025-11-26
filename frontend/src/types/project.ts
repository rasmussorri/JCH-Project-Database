export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'In Progress' | 'Testing' | 'Completed';
  team: string[];
  image?: string;
  imageUrl?: string;
  startDate: string;
  technologies: string[];
}
