import { useEffect, useState } from "react";

const KEY = "gv-care-open";
/** Care/moonflower panels: open on desktop, closed on phones; the player's choice is remembered. */
export function useDockOpen() {
  const [open, setOpenState] = useState(true);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = window.localStorage.getItem(KEY); } catch { /* storage unavailable */ }
    if (saved !== null) setOpenState(saved === "1");
    else if (window.matchMedia("(max-width: 767px)").matches) setOpenState(false);
  }, []);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    try { window.localStorage.setItem(KEY, next ? "1" : "0"); } catch { /* storage unavailable */ }
  };
  return [open, setOpen] as const;
}
