// ============================================================
//  画像アセット機構
//  public/img/ に置いた画像を読み込み、無ければ絵文字にフォールバック。
//  - キャンバス（マップ）用: getImage()
//  - DOM（戦闘）用: applyArt()
// ============================================================

// 画像URLを組み立てる（Pages のサブパス /mhoreka/ を考慮）
export function artUrl(rel: string): string {
  return `${import.meta.env.BASE_URL}img/${rel}`;
}
export function monsterArtUrl(art?: string): string | null {
  return art ? artUrl(`monsters/${art}.png`) : null;
}
export const HUNTER_ART = artUrl("hunter.png");

// ---- キャンバス用の画像キャッシュ ----
const cache = new Map<string, HTMLImageElement>();
const failed = new Set<string>();

/** 読み込み済みなら画像を返す。未読込なら裏で読み込み開始して null（＝絵文字で代替）。 */
export function getImage(url: string | null): HTMLImageElement | null {
  if (!url || failed.has(url)) return null;
  let img = cache.get(url);
  if (!img) {
    img = new Image();
    img.onerror = () => failed.add(url);
    img.src = url;
    cache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// ---- DOM要素に画像を適用（無ければ絵文字のまま）----
export function applyArt(elem: HTMLElement, url: string | null, emoji: string): void {
  elem.classList.remove("has-art");
  elem.style.backgroundImage = "";
  elem.textContent = emoji;
  if (!url || failed.has(url)) return;
  const img = new Image();
  img.onload = () => {
    elem.textContent = "";
    elem.classList.add("has-art");
    elem.style.backgroundImage = `url("${url}")`;
  };
  img.onerror = () => failed.add(url);
  img.src = url;
}
