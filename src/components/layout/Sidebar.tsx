"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BrainCircuit,
  MessageSquare,
  Users,
  Settings,
  Menu,
  X,
  MoreVertical,
  Trash2,
  Edit2,
  Info,
  Plus,
  Search
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { SearchPalette } from "@/components/search/SearchPalette";
import { sessionRepository } from "@/lib/db/repositories/session";
import { getSessionDateGroup, DateGroup } from "@/lib/utils/date-grouping";
import { Session } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const HISTORY_GROUPS: DateGroup[] = ['Today', 'Yesterday', 'Previous 7 Days', 'Older'];

function SidebarItem({ session, activeId }: { session: Session; activeId: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(session.title);
  const [showOptions, setShowOptions] = React.useState(false);

  const isActive = activeId === session.id;
  const href = `/chat/${session.mode}/${session.id}`;
  const Icon = session.mode === '1-on-1' ? MessageSquare : Users;

  const handleSave = async () => {
    if (editTitle.trim() && editTitle !== session.title) {
      await sessionRepository.updateSessionTitle(session.id, editTitle.trim());
    } else {
      setEditTitle(session.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(session.title);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this session permanently?")) {
      await sessionRepository.deleteWithCascading(session.id);
      if (isActive) router.push('/');
    }
    setShowOptions(false);
  };

  return (
    <div className={cn(
      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
      isActive && "bg-accent"
    )}>
      <Link href={href} className="flex flex-1 items-center gap-2 overflow-hidden">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {isEditing ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none ring-1 ring-primary rounded px-1"
          />
        ) : (
          <span className="truncate">{session.title}</span>
        )}
      </Link>
      
      {!isEditing && (
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent-foreground/10 rounded"
            aria-label="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showOptions && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowOptions(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 flex w-32 flex-col rounded-md border bg-popover p-1 shadow-md">
                <button
                  onClick={() => { setIsEditing(true); setShowOptions(false); }}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Edit2 className="h-4 w-4" /> Rename
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const activeSessionId = pathname.split('/').pop() || '';
  
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('framework-engine:ui:sidebar') !== 'closed';
    }
    return true;
  });

  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('framework-engine:ui:sidebar', isOpen ? 'open' : 'closed');
  }, [isOpen]);

  // Cmd/Ctrl+K to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Trap focus & close on escape for mobile drawer
  React.useEffect(() => {
    if (!isMobileOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  const sessions = useLiveQuery(() => sessionRepository.getDurableActiveSessions(), [], []);

  const groupedSessions = React.useMemo(() => {
    const groups: Record<DateGroup, Session[]> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };
    sessions.forEach(session => {
      const group = getSessionDateGroup(session.updatedAt);
      groups[group].push(session);
    });
    return groups;
  }, [sessions]);

  const SidebarContent = (
    <div className="flex h-full flex-col overflow-hidden bg-background border-r">
      {/* Top Section */}
      <div className="flex flex-col gap-4 p-4 border-b">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <span className="tracking-tight">Council of Minds</span>
          </Link>
          <button 
            className="md:hidden p-1 rounded hover:bg-accent"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Link 
              href="/chat/1-on-1"
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> 1-on-1
            </Link>
            <Link 
              href="/chat/council"
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-secondary text-secondary-foreground px-3 py-2 text-sm font-medium hover:bg-secondary/80"
            >
              <Plus className="h-4 w-4" /> Council
            </Link>
          </div>
          <Link
            href="/personas"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            <Users className="h-4 w-4" /> Persona Library
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search</span>
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:block">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* Middle Section: History */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Chat History">
        {HISTORY_GROUPS.map(group => {
          const groupSessions = groupedSessions[group];
          if (groupSessions.length === 0) return null;
          
          return (
            <div key={group} className="px-2">
              <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </h3>
              <ul className="space-y-0.5">
                {groupSessions.map(session => (
                  <li key={session.id}>
                    <SidebarItem session={session} activeId={activeSessionId} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t p-2">
        <div className="flex items-center justify-between px-2 py-2">
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-md text-sm font-medium hover:text-primary transition-colors"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <div className="flex items-center gap-2">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4" />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button 
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-md bg-background border shadow-sm"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80%] h-full bg-background shadow-xl flex flex-col animate-in slide-in-from-left">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:block transition-all duration-300 ease-in-out border-r",
        isOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
      )}>
        <div className="w-64 h-full">
          {SidebarContent}
        </div>
      </div>

      {/* Desktop Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex fixed top-4 left-4 z-40 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        style={{ left: isOpen ? '16rem' : '1rem' }}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        <Menu className="h-4 w-4" />
      </button>
      {/* Search Palette */}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
