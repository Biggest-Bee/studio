const LANGUAGE_EXTENSION_MAP: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  ruby: 'rb',
  php: 'php',
  swift: 'swift',
  kotlin: 'kt',
  dart: 'dart',
  html: 'html',
  css: 'css',
  sql: 'sql',
  shell: 'sh',
  json: 'json',
  yaml: 'yaml',
  markdown: 'md',
  c: 'c',
  lua: 'lua',
};

export const getExtensionForLanguage = (language: string): string => {
  return LANGUAGE_EXTENSION_MAP[language] || 'txt';
};

export const updateFileNameExtension = (fileName: string, language: string): string => {
  const extension = getExtensionForLanguage(language);
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex <= 0) {
    return `${fileName}.${extension}`;
  }

  return `${fileName.slice(0, dotIndex)}.${extension}`;
};
