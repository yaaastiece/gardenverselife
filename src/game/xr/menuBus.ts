// Lets the controller buttons (B/Y/A/X) ask the VR menu to show or hide, without the rig knowing about the menu.
const listeners = new Set<() => void>();
export const menuBus = {
  toggle() { listeners.forEach((f) => f()); },
  subscribe(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; },
};
