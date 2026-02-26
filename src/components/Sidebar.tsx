'use client';

import React, { useState } from 'react';
import { useFiles } from '@/context/FileContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  Folder, 
  MoreVertical, 
  Trash, 
  LogOut, 
  Settings,
  FolderPlus,
  FilePlus,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileNode, LANGUAGES } from '@/lib/types';

export const Sidebar: React.FC = () => {
  const { 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspace, 
    createWorkspace, 
    deleteWorkspace,
    nodes,
    setActiveFile,
    activeFileId,
    createNode,
    deleteNode
  } = useFiles();
  const { user, logout } = useAuth();
  
  const [isCreatingWs, setIsCreatingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const activeWs = workspaces.find(w => w.id === activeWorkspaceId);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateWorkspace = () => {
    if (newWsName.trim()) {
      createWorkspace(newWsName.trim());
      setNewWsName('');
      setIsCreatingWs(false);
    }
  };

  const renderFileNode = (nodeId: string, depth = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isExpanded = expandedFolders[nodeId];
    const isActive = activeFileId === nodeId;

    return (
      <div key={nodeId} className="select-none">
        <div 
          className={cn(
            "group flex items-center py-1 px-2 cursor-pointer hover:bg-secondary/50 rounded-md transition-colors",
            isActive && "bg-secondary text-primary",
            depth > 0 && `ml-${depth * 2}`
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(nodeId);
            } else {
              setActiveFile(nodeId);
            }
          }}
        >
          <span className="mr-1.5 opacity-60">
            {node.type === 'folder' ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <FileCode size={14} className={isActive ? "text-primary" : "text-muted-foreground"} />
            )}
          </span>
          <span className="text-sm truncate flex-1">{node.name}</span>
          
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {node.type === 'folder' && (
              <>
                <FilePlus size={14} className="hover:text-primary" onClick={(e) => { e.stopPropagation(); createNode(nodeId, 'new_file.js', 'file'); }} />
                <FolderPlus size={14} className="hover:text-primary" onClick={(e) => { e.stopPropagation(); createNode(nodeId, 'new_folder', 'folder'); }} />
              </>
            )}
            <Trash size={12} className="text-destructive hover:scale-110" onClick={(e) => { e.stopPropagation(); deleteNode(nodeId); }} />
          </div>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div className="mt-0.5">
            {node.children.map(childId => renderFileNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 border-r bg-sidebar flex flex-col h-full shrink-0">
      {/* Workspace Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <h2 className="font-semibold text-foreground text-sm tracking-tight">SyntaxForge</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Plus size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsCreatingWs(true)}>
                New Workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {workspaces.map(ws => (
                <DropdownMenuItem 
                  key={ws.id} 
                  onClick={() => setActiveWorkspace(ws.id)}
                  className={cn(ws.id === activeWorkspaceId && "text-primary font-medium")}
                >
                  {ws.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isCreatingWs ? (
          <div className="mt-2 space-y-2">
            <Input 
              autoFocus
              size={1}
              value={newWsName} 
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="Workspace name..."
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 px-2 text-xs flex-1" onClick={handleCreateWorkspace}>Create</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs flex-1" onClick={() => setIsCreatingWs(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>{activeWs ? activeWs.name : 'No workspace'}</span>
            {activeWs && (
              <Trash 
                size={12} 
                className="cursor-pointer hover:text-destructive" 
                onClick={() => deleteWorkspace(activeWs.id)}
              />
            )}
          </div>
        )}
      </div>

      {/* File Explorer */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Files</span>
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => createNode(null, 'new_file.js', 'file')}>
               <FilePlus size={12} />
             </Button>
             <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => createNode(null, 'new_folder', 'folder')}>
               <FolderPlus size={12} />
             </Button>
          </div>
        </div>
        
        <div className="space-y-0.5">
          {activeWs && activeWs.rootFileIds.map(rid => renderFileNode(rid))}
          {!activeWs && (
            <div className="text-center py-8 text-muted-foreground text-xs italic px-4">
              Create or select a workspace to start coding
            </div>
          )}
        </div>
      </div>

      {/* User Footer */}
      <div className="mt-auto border-t p-3 flex items-center justify-between bg-sidebar/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium truncate text-foreground">{user?.username}</span>
            <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Settings size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut size={14} className="mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
