import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMobile: () => void;
  openMobile: () => void;
  closeMobile: () => void;

  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;

  toggle: () => void;
  open: () => void;
  close: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = "jagire_sidebar_collapsed";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const [isCollapsed, setIsCollapsedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) return JSON.parse(stored);
      } catch (e) {}
    }
    return false;
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 1024;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const setIsCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => setIsOpen((prev) => !prev), []);
  const openMobile = useCallback(() => setIsOpen(true), []);
  const closeMobile = useCallback(() => setIsOpen(false), []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const toggle = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      toggleMobile();
    } else {
      toggleCollapsed();
    }
  }, [toggleMobile, toggleCollapsed]);

  const open = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      openMobile();
    } else {
      setIsCollapsed(false);
    }
  }, [openMobile, setIsCollapsed]);

  const close = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      closeMobile();
    } else {
      setIsCollapsed(true);
    }
  }, [closeMobile, setIsCollapsed]);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggleMobile,
      openMobile,
      closeMobile,
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed,
      toggle,
      open,
      close,
      isMobile,
    }),
    [
      isOpen,
      toggleMobile,
      openMobile,
      closeMobile,
      isCollapsed,
      setIsCollapsed,
      toggleCollapsed,
      toggle,
      open,
      close,
      isMobile,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      toggleMobile: () => {},
      openMobile: () => {},
      closeMobile: () => {},
      isCollapsed: false,
      setIsCollapsed: () => {},
      toggleCollapsed: () => {},
      toggle: () => {},
      open: () => {},
      close: () => {},
      isMobile: false,
    };
  }
  return context;
}
