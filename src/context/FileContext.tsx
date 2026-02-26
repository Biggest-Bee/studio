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
  renameWorkspace: (id: string, name: string) => void;
  
  createNode: (parentId: string | null, name: string, type: FileType, language?: string) => string;
  deleteNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FileNode>) => void;
  renameNode: (id: string, newName: string) => void;
  moveNode: (id: string, newParentId: string | null) => void;
  setActiveFile: (id: string | null) => void;

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
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
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

  const renameNode = (id: string, newName: string) => {
    updateNode(id, { name: newName });
  };

  const moveNode = (id: string, newParentId: string | null) => {
    const node = nodes[id];
    if (!node || node.parentId === newParentId) return;

    const newNodes = { ...nodes };
    
    if (node.parentId && newNodes[node.parentId]) {
      newNodes[node.parentId] = {
        ...newNodes[node.parentId],
        children: newNodes[node.parentId].children?.filter(cid => cid !== id)
      };
    } else if (activeWorkspaceId) {
       setWorkspaces(workspaces.map(w => 
        w.id === activeWorkspaceId 
          ? { ...w, rootFileIds: w.rootFileIds.filter(rid => rid !== id) } 
          : w
      ));
    }

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

  const downloadFileContent = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadNode = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    if (node.type === 'file') {
      downloadFileContent(node.name, node.content || '');
    } else {
      // For folders, we download a recursive JSON representation
      const exportRecursive = (nid: string): any => {
        const n = nodes[nid];
        return {
          ...n,
          children: n.children ? n.children.map(cid => exportRecursive(cid)) : undefined
        };
      };
      const data = exportRecursive(id);
      downloadFileContent(`${node.name}.json`, JSON.stringify(data, null, 2));
    }
  };

  const downloadWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const exportData = {
      workspace: ws,
      nodes: ws.rootFileIds.map(rid => {
        const exportRecursive = (nid: string): any => {
          const n = nodes[nid];
          return {
            ...n,
            children: n.children ? n.children.map(cid => exportRecursive(cid)) : undefined
          };
        };
        return exportRecursive(rid);
      })
    };
    downloadFileContent(`${ws.name}_workspace.json`, JSON.stringify(exportData, null, 2));
  };

  const uploadToFolder = async (parentId: string | null, files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const extension = file.name.split('.').pop() || 'javascript';
        const nodeId = createNode(parentId, file.name, 'file', extension);
        updateNode(nodeId, { content });
      };
      reader.readAsText(file);
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

  return (
    <FileContext.Provider value={{
      workspaces,
      activeWorkspaceId,
      nodes,
      activeFileId,
      createWorkspace,
      deleteWorkspace,
      setActiveWorkspace: setActiveWorkspaceId,
      renameWorkspace,
      createNode,
      deleteNode,
      updateNode,
      renameNode,
      moveNode,
      setActiveFile: setActiveFileId,
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
