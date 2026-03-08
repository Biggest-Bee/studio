'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileNode, Workspace, FileType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface FileContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  nodes: Record<string, FileNode>;
  activeFileId: string | null;
  openFileIds: string[];
  
  // Actions
  createWorkspace: (name: string) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  renameWorkspace: (id: string, name: string) => void;
  
  createNode: (parentId: string | null, name: string, type: FileType, language?: string) => string;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FileNode>) => void;
  renameNode: (id: string, newName: string) => void;
  moveNode: (id: string, newParentId: string | null, targetWorkspaceId?: string | null) => void;
  setActiveFile: (id: string | null) => void;
  closeFile: (id: string) => void;

  // Persistence/IO
  downloadWorkspace: (id: string) => void;
  downloadNode: (id: string) => void;
  uploadToFolder: (parentId: string | null, files: FileList) => Promise<void>;
  importWorkspace: (json: string) => void;

  // Helpers
  getNodePath: (id: string) => string;
  getFolderContents: (id: string) => FileNode[];
}

const FileContext = createContext<FileContextType | undefined>(undefined);

const STORAGE_KEY = 'syntaxforge_data';


const sanitizeNodeName = (name: string) => {
  const cleaned = name.replace(/[\/\x00-\x1f\x7f]/g, '').trim();
  if (!cleaned || cleaned === '.' || cleaned === '..') return null;
  return cleaned.slice(0, 100);
};

const sanitizeWorkspaceName = (name: string) => {
  const cleaned = name.replace(/[\x00-\x1f\x7f]/g, '').trim();
  return cleaned.slice(0, 100);
};


export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Record<string, FileNode>>({});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWorkspaces(parsed.workspaces || []);
        setActiveWorkspaceId(parsed.activeWorkspaceId || null);
        setNodes(parsed.nodes || {});
        setOpenFileIds(parsed.openFileIds || []);
        setActiveFileId(parsed.activeFileId || null);
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ workspaces, activeWorkspaceId, nodes, openFileIds, activeFileId }));
    }
  }, [workspaces, activeWorkspaceId, nodes, openFileIds, activeFileId, isLoaded]);

  const createWorkspace = (name: string) => {
    const safeName = sanitizeWorkspaceName(name);
    if (!safeName) return;
    const id = uuidv4();
    const newWorkspace: Workspace = {
      id,
      name: safeName,
      rootFileIds: [],
      createdAt: Date.now()
    };
    setWorkspaces([...workspaces, newWorkspace]);
    if (!activeWorkspaceId) setActiveWorkspaceId(id);
  };

  const deleteWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    
    const newNodes = { ...nodes };
    const deleteRecursive = (nodeId: string) => {
      const node = newNodes[nodeId];
      if (node?.children) {
        node.children.forEach(childId => deleteRecursive(childId));
      }
      delete newNodes[nodeId];
    };
    ws.rootFileIds.forEach(rootId => deleteRecursive(rootId));

    setNodes(newNodes);
    setWorkspaces(workspaces.filter(w => w.id !== id));
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(workspaces.length > 1 ? workspaces[0].id : null);
    }
  };

  const renameWorkspace = (id: string, name: string) => {
    const safeName = sanitizeWorkspaceName(name);
    if (!safeName) return;
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: safeName } : w));
  };

  const createNode = (parentId: string | null, name: string, type: FileType, language = 'javascript') => {
    const safeName = sanitizeNodeName(name);
    if (!safeName) return '';
    const id = uuidv4();
    const newNode: FileNode = {
      id,
      name: safeName,
      type,
      parentId,
      language: type === 'file' ? language : undefined,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined
    };

    const newNodes: Record<string, FileNode> = { ...nodes, [id]: newNode };
    
    if (parentId && newNodes[parentId]) {
      const parentNode = newNodes[parentId];
      newNodes[parentId] = {
        ...parentNode,
        children: [...(parentNode.children || []), id]
      };
    } else if (activeWorkspaceId) {
      setWorkspaces(workspaces.map(w => 
        w.id === activeWorkspaceId 
          ? { ...w, rootFileIds: [...w.rootFileIds, id] } 
          : w
      ));
    }

    setNodes(newNodes);
    return id;
  };

  const deleteNode = (id: string) => {
    const nodeToDelete = nodes[id];
    if (!nodeToDelete) return;

    const newNodes = { ...nodes };
    const deletedIds = new Set<string>();
    const deleteRecursive = (nodeId: string) => {
      const node = newNodes[nodeId];
      if (node?.children) {
        node.children.forEach(childId => deleteRecursive(childId));
      }
      deletedIds.add(nodeId);
      delete newNodes[nodeId];
    };
    deleteRecursive(id);

    if (nodeToDelete.parentId && newNodes[nodeToDelete.parentId]) {
      newNodes[nodeToDelete.parentId] = {
        ...newNodes[nodeToDelete.parentId],
        children: newNodes[nodeToDelete.parentId].children?.filter(cid => cid !== id)
      };
    } else if (activeWorkspaceId) {
      setWorkspaces(workspaces.map(w => 
        w.id === activeWorkspaceId 
          ? { ...w, rootFileIds: w.rootFileIds.filter(rid => rid !== id) } 
          : w
      ));
    }

    setNodes(newNodes);
    setOpenFileIds(prev => prev.filter(fileId => !deletedIds.has(fileId)));
    if (activeFileId && deletedIds.has(activeFileId)) {
      setActiveFileId(null);
    }
  };

  const updateNode = (id: string, updates: Partial<FileNode>) => {
    setNodes(prev => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], ...updates }
      };
    });
  };

  const renameNode = (id: string, newName: string) => {
    const safeName = sanitizeNodeName(newName);
    if (!safeName) return;
    updateNode(id, { name: safeName });
  };

  const findWorkspaceIdForNode = (nodeId: string, currentNodes: Record<string, FileNode>, currentWorkspaces: Workspace[]) => {
    let rootId = nodeId;
    let current = currentNodes[rootId];
    while (current?.parentId) {
      rootId = current.parentId;
      current = currentNodes[rootId];
    }
    return currentWorkspaces.find(w => w.rootFileIds.includes(rootId))?.id ?? null;
  };

  const moveNode = (id: string, newParentId: string | null, targetWorkspaceId: string | null = null) => {
    const node = nodes[id];
    if (!node) return;

    // Cross-workspace moves always land at that workspace root.
    const effectiveParentId = targetWorkspaceId ? null : newParentId;

    if (effectiveParentId) {
      let parent: string | null = effectiveParentId;
      while (parent) {
        if (parent === id) return;
        parent = nodes[parent]?.parentId || null;
      }
    }

    const newNodes: Record<string, FileNode> = { ...nodes };
    const newWorkspaces = workspaces.map(w => ({ ...w, rootFileIds: [...w.rootFileIds] }));
    const sourceWorkspaceId = findWorkspaceIdForNode(id, nodes, workspaces);
    const destinationWorkspaceId = effectiveParentId
      ? findWorkspaceIdForNode(effectiveParentId, newNodes, workspaces)
      : targetWorkspaceId || sourceWorkspaceId || activeWorkspaceId;
    if (!destinationWorkspaceId) return;
    if (node.parentId === effectiveParentId && sourceWorkspaceId === destinationWorkspaceId) return;

    // Remove from old parent
    if (node.parentId && newNodes[node.parentId]) {
      const oldParent = newNodes[node.parentId];
      newNodes[node.parentId] = {
        ...oldParent,
        children: oldParent.children?.filter(cid => cid !== id)
      };
    } else if (!node.parentId && sourceWorkspaceId) {
      const sourceWorkspace = newWorkspaces.find(w => w.id === sourceWorkspaceId);
      if (sourceWorkspace) {
        sourceWorkspace.rootFileIds = sourceWorkspace.rootFileIds.filter(rid => rid !== id);
      }
    }

    // Add to new parent/root
    if (effectiveParentId && newNodes[effectiveParentId]) {
      const newParent = newNodes[effectiveParentId];
      newNodes[effectiveParentId] = {
        ...newParent,
        children: [...(newParent.children || []), id]
      };
      newNodes[id] = { ...newNodes[id], parentId: effectiveParentId };
    } else {
      const destinationWorkspace = newWorkspaces.find(w => w.id === destinationWorkspaceId);
      if (!destinationWorkspace) return;
      if (!destinationWorkspace.rootFileIds.includes(id)) {
        destinationWorkspace.rootFileIds.push(id);
      }
      newNodes[id] = { ...newNodes[id], parentId: null };
    }

    setWorkspaces(newWorkspaces);
    setNodes(newNodes);
  };

  const sanitizeTarName = (value: string) => value.replace(/\\/g, '/').replace(/^\/+/, '').slice(0, 100);

  const base64ToUint8Array = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const uint8ArrayToBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const triggerDownload = (name: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createTarBlob = (entries: Array<{ path: string; data?: Uint8Array; isDirectory?: boolean }>) => {
    const chunks: BlobPart[] = [];
    const encoder = new TextEncoder();

    const writeString = (target: Uint8Array, offset: number, length: number, value: string) => {
      const bytes = encoder.encode(value);
      target.set(bytes.slice(0, length), offset);
    };

    const writeOctal = (target: Uint8Array, offset: number, length: number, value: number) => {
      const oct = value.toString(8).padStart(length - 1, '0');
      writeString(target, offset, length - 1, oct);
      target[offset + length - 1] = 0;
    };

    for (const entry of entries) {
      const header = new Uint8Array(512);
      const isDirectory = !!entry.isDirectory;
      const safePath = sanitizeTarName(isDirectory ? `${entry.path.replace(/\/+$/, '')}/` : entry.path);
      const data = entry.data || new Uint8Array(0);

      writeString(header, 0, 100, safePath);
      writeOctal(header, 100, 8, isDirectory ? 0o755 : 0o644);
      writeOctal(header, 108, 8, 0);
      writeOctal(header, 116, 8, 0);
      writeOctal(header, 124, 12, data.length);
      writeOctal(header, 136, 12, Math.floor(Date.now() / 1000));
      for (let i = 148; i < 156; i++) header[i] = 32;
      header[156] = isDirectory ? '5'.charCodeAt(0) : '0'.charCodeAt(0);
      writeString(header, 257, 6, 'ustar');
      writeString(header, 263, 2, '00');

      let checksum = 0;
      for (const value of header) checksum += value;
      const checksumOctal = checksum.toString(8).padStart(6, '0');
      writeString(header, 148, 6, checksumOctal);
      header[154] = 0;
      header[155] = 32;

      chunks.push(header.buffer.slice(header.byteOffset, header.byteOffset + header.byteLength) as ArrayBuffer);
      if (!isDirectory && data.length > 0) {
        chunks.push(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
        const padding = (512 - (data.length % 512)) % 512;
        if (padding > 0) chunks.push(new Uint8Array(padding).buffer);
      }
    }

    chunks.push(new Uint8Array(1024).buffer);
    return new Blob(chunks, { type: 'application/x-tar' });
  };

  const collectTarEntries = (nodeId: string, basePath: string, entries: Array<{ path: string; data?: Uint8Array; isDirectory?: boolean }>) => {
    const node = nodes[nodeId];
    if (!node) return;

    const currentPath = basePath ? `${basePath}/${node.name}` : node.name;
    if (node.type === 'folder') {
      entries.push({ path: currentPath, isDirectory: true });
      (node.children || []).forEach(childId => collectTarEntries(childId, currentPath, entries));
      return;
    }

    const fileBytes = node.isBinary && node.binaryContent
      ? base64ToUint8Array(node.binaryContent)
      : new TextEncoder().encode(node.content || '');

    entries.push({ path: currentPath, data: fileBytes, isDirectory: false });
  };

  const downloadNode = (id: string) => {
    const node = nodes[id];
    if (!node) return;

    if (node.type === 'file') {
      const blob = node.isBinary && node.binaryContent
        ? new Blob([base64ToUint8Array(node.binaryContent)], { type: node.mimeType || 'application/octet-stream' })
        : new Blob([node.content || ''], { type: node.mimeType || 'text/plain' });
      triggerDownload(node.name, blob);
      return;
    }

    const entries: Array<{ path: string; data?: Uint8Array; isDirectory?: boolean }> = [];
    collectTarEntries(id, '', entries);
    triggerDownload(`${node.name}.tar`, createTarBlob(entries));
  };

  const downloadWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;

    const entries: Array<{ path: string; data?: Uint8Array; isDirectory?: boolean }> = [];
    ws.rootFileIds.forEach(rootId => collectTarEntries(rootId, ws.name, entries));
    triggerDownload(`${ws.name}.tar`, createTarBlob(entries));
  };

  const textExtensions = new Set([
    'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'scss', 'html', 'md', 'txt', 'xml', 'yaml', 'yml',
    'py', 'java', 'go', 'rs', 'c', 'cpp', 'h', 'hpp', 'php', 'rb', 'swift', 'kt', 'sql', 'sh', 'toml'
  ]);

  const uploadToFolder = async (parentId: string | null, files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = (file.name.split('.').pop() || 'txt').toLowerCase();
      const nodeId = createNode(parentId, file.name, 'file', extension);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const likelyText = file.type.startsWith('text/') || textExtensions.has(extension) || file.type.includes('json');
      if (likelyText) {
        try {
          const textContent = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
          updateNode(nodeId, {
            content: textContent,
            isBinary: false,
            binaryContent: undefined,
            mimeType: file.type || 'text/plain'
          });
          continue;
        } catch {
          // Fallback to binary storage for non-UTF8 content.
        }
      }

      updateNode(nodeId, {
        content: '',
        isBinary: true,
        binaryContent: uint8ArrayToBase64(bytes),
        mimeType: file.type || 'application/octet-stream'
      });
    }
  };

  const importWorkspace = (json: string) => {
    try {
      const data = JSON.parse(json);
      const wsId = uuidv4();
      const importedWs: Workspace = {
        ...data.workspace,
        id: wsId,
        createdAt: Date.now(),
        rootFileIds: []
      };

      const newNodes = { ...nodes };
      const importRecursive = (nodeData: any, parentId: string | null): string => {
        const id = uuidv4();
        const newNode: FileNode = {
          ...nodeData,
          id,
          parentId,
          children: nodeData.type === 'folder' ? [] : undefined
        };
        newNodes[id] = newNode;
        if (nodeData.children) {
          newNode.children = nodeData.children.map((c: any) => importRecursive(c, id));
        }
        return id;
      };

      importedWs.rootFileIds = data.nodes.map((n: any) => importRecursive(n, null));
      setNodes(newNodes);
      setWorkspaces([...workspaces, importedWs]);
      setActiveWorkspaceId(wsId);
    } catch (e) {
      console.error('Failed to import workspace', e);
    }
  };

  const getNodePath = (id: string): string => {
    const node = nodes[id];
    if (!node) return '';
    if (!node.parentId) return node.name;
    return `${getNodePath(node.parentId)}/${node.name}`;
  };

  const getFolderContents = (id: string): FileNode[] => {
    const folder = nodes[id];
    if (!folder || !folder.children) return [];
    return folder.children.map(cid => nodes[cid]).filter(Boolean);
  };

  const setActiveFile = (id: string | null) => {
    setActiveFileId(id);
    if (id) {
      setOpenFileIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const closeFile = (id: string) => {
    setOpenFileIds(prev => {
      const nextOpenFileIds = prev.filter(fileId => fileId !== id);
      if (activeFileId === id) {
        setActiveFileId(nextOpenFileIds[nextOpenFileIds.length - 1] ?? null);
      }
      return nextOpenFileIds;
    });
  };

  return (
    <FileContext.Provider value={{
      workspaces,
      activeWorkspaceId,
      nodes,
      activeFileId,
      openFileIds,
      createWorkspace,
      deleteWorkspace,
      setActiveWorkspace: setActiveWorkspaceId,
      renameWorkspace,
      createNode,
      deleteNode,
      updateNode,
      renameNode,
      moveNode,
      setActiveFile,
      closeFile,
      downloadWorkspace,
      downloadNode,
      uploadToFolder,
      importWorkspace,
      getNodePath,
      getFolderContents
    }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) throw new Error('useFiles must be used within FileProvider');
  return context;
};
