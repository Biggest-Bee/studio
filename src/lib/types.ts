export type FileType = 'file' | 'folder';

export interface FileNode {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  language?: string;
  parentId: string | null;
  children?: string[]; // IDs of children
}

export interface Workspace {
  id: string;
  name: string;
  rootFileIds: string[];
  createdAt: number;
}

export interface UserSession {
  id: string;
  email: string;
  username: string;
}

export const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust',
  'ruby', 'php', 'swift', 'kotlin', 'dart', 'html', 'css', 'sql', 'shell',
  'json', 'yaml', 'markdown', 'c', 'lua'
];

export interface ComplexityLevel {
  id: 'simple' | 'medium' | 'complex';
  label: string;
}

export const COMPLEXITY_LEVELS: ComplexityLevel[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'medium', label: 'Medium' },
  { id: 'complex', label: 'Complex' }
];
