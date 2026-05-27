"use client";

import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  // Start with false to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState(false);
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Return false until mounted to prevent SSR mismatch
  if (!mounted) return false;
  return isMobile;
}