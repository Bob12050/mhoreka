import { el } from './dom';

// ---- 演出ヘルパ ----
export function flash(node: HTMLElement, cls = "hit"): void {
  node.classList.remove(cls);
  void node.offsetWidth; // reflow
  node.classList.add(cls);
  setTimeout(() => node.classList.remove(cls), 260);
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(msg: string): void {
  el.toast.textContent = msg;
  el.toast.style.whiteSpace = "pre-line";
  el.toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 1800);
}
