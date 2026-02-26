'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileNode, Workspace, FileType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

interface FileContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  nodes: Record<string, FileNode>;
  activeFileId: string | null;
  
  // Actions
  createWorkspace: (name: string) => void;
  deleteWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  
  createNode: (parentId: string | null, name: string, type: FileType, language?: string) => string;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FileNode>) => void;
  moveNode: (id: string, newParentId: string | null) => void;
  setActiveFile: (id: string | null) => void;

  // Helpers
  getNodePath: (id: string) => string;
  getFolderContents: (id: string) => FileNode[];
}

const FileContext = createContext<FileContextType | undefined>(undefined);

const STORAGE_KEY = 'syntaxforge_data';

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Record<string, FileNode>>({});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
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
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ workspaces, activeWorkspaceId, nodes }));
    }
  }, [workspaces, activeWorkspaceId, nodes, isLoaded]);

  const createWorkspace = (name: string) => {
    const id = uuidv4();
    const newWorkspace: Workspace = {
      id,
      name,
      rootFileIds: [],
      createdAt: Date.now()
    };
    setWorkspaces([...workspaces, newWorkspace]);
    if (!activeWorkspaceId) setActiveWorkspaceId(id);
  };

  const deleteWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    
    // Clean up nodes associated with this workspace recursively
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

  const createNode = (parentId: string | null, name: string, type: FileType, language = 'javascript') => {
    const id = uuidv4();
    const newNode: FileNode = {
      id,
      name,
      type,
      parentId,
      language: type === 'file' ? language : undefined,
      content: type === 'file' ? '' : undefined,
      children: type === 'folder' ? [] : undefined
    };

    const newNodes = { ...nodes, [id]: newNode };
    
    if (parentId && newNodes[parentId]) {
      newNodes[parentId] = {
        ...newNodes[parentId],
        children: [...(newNodes[parentId].children || []), id]
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
    const deleteRecursive = (nodeId: string) => {
      const node = newNodes[nodeId];
      if (node?.children) {
        node.children.forEach(childId => deleteRecursive(childId));
      }
      delete newNodes[nodeId];
    };
    deleteRecursive(id);

    // Remove from parent
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
    if (activeFileId === id) setActiveFileId(null);
  };

  const updateNode = (id: string, updates: Partial<FileNode>) => {
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const moveNode = (id: string, newParentId: string | null) => {
    const node = nodes[id];
    if (!node || node.parentId === newParentId) return;

    const newNodes = { ...nodes };
    
    // Remove from old parent
    if (node.parentId && newNodes[node.parentId]) {
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        children: newNodes[node.parentId].children?.filter(cid => cid !== id)
      };
    } else if (activeWorkspaceId) {
       // It was a root node
       setWorkspaces(workspaces.map(w => 
        w.id === activeWorkspaceId 
          ? { ...w, rootFileIds: w.rootFileIds.filter(rid => rid !== id) } 
          : w
      ));
    }

    // Add to new parent
    if (newParentId && newNodes[newParentId]) {
      newNodes[newParentId] = {
        ...newNodes[newParentId],
        children: [...(newNodes[newParentId].children || []), id]
      };
      newNodes[id] = { ...newNodes[id], parentId: newParentId };
    } else if (activeWorkspaceId) {
      setWorkspaces(workspaces.map(w => 
        w.id === activeWorkspaceId 
          ? { ...w, rootFileIds: [...w.rootFileIds, id] } 
          : w
      ));
      newNodes[id] = { ...newNodes[id], parentId: null };
    }

    setNodes(newNodes);
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

  return (
    <FileContext.Provider value={{
      workspaces,
      activeWorkspaceId,
      nodes,
      activeFileId,
      createWorkspace,
      deleteWorkspace,
      setActiveWorkspace: setActiveWorkspaceId,
      createNode,
      deleteNode,
      updateNode,
      moveNode,
      setActiveFile: setActiveFileId,
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
