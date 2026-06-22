# 画像生成プロンプト集（モホレカ用）

各画像は **正方形・背景透過PNG・512×512** が理想。生成後に同名で `public/img/` に置けば反映されます（対応表は README.md）。

## 使い方
1. 下の「共通スタイル」を毎回うしろに付ける（絵柄を統一するため）
2. 各キャラの「説明」＋「共通スタイル」を生成AIに入力
3. 透過にならないツールは、白背景で出して remove.bg などで透過化
4. できるだけ **同じツール・同じスタイル指定・同じシード** で揃えると統一感が出る

> 透過が得意: Adobe Firefly / Ideogram / 一部の SDXL。Midjourney/DALL·E は白背景→透過化が無難。
> ⚠️ 著作権: 既存ゲームの公式デザイン名や画像は使わない。あくまでオリジナル創作として。

## 共通スタイル（毎回うしろに付ける）
```
, stylized fantasy creature, painterly digital art, bold clean silhouette, dramatic rim lighting, vibrant colors, full body, centered composition, three-quarter front view, plain transparent background, square 1:1, high detail, video game monster icon, no text, no watermark, no border
```

## 完成プロンプト例（リオレウス＝rathalos.png）
```
a fierce red fire wyvern dragon with large leathery wings, sharp horns, glowing orange eyes, scaled body, roaring, stylized fantasy creature, painterly digital art, bold clean silhouette, dramatic rim lighting, vibrant colors, full body, centered composition, three-quarter front view, plain transparent background, square 1:1, high detail, video game monster icon, no text, no watermark, no border
```

---

## ハンター
- **hunter.png** — `a heroic monster hunter in layered plated fantasy armor, fur trim, holding a large sword, determined pose, earthy green and bronze colors`

## モンスター（→ monsters/ フォルダ）
- **jaggi.png** (ドスジャギィ) — `a small bipedal raptor dinosaur, pack-leader, cream and tan scales, a red crest on its head, alert dog-like posture`
- **fango.png** (ドスファンゴ) — `a huge wild boar monster with large curved tusks, bristly brown fur, muscular, aggressive charge`
- **rampos.png** (ドスランポス) — `a sleek velociraptor-like reptile, green scales, agile and fast, sharp claws, lean body`
- **kut.png** (イャンクック) — `a large beige bird wyvern with oversized flappy ears, a curved beak, plump body, comical but fierce`
- **geryos.png** (ゲリョス) — `a pink rubbery bird wyvern with a hood-like crest, toxic, glowing eyes, sinister grin`
- **garuga.png** (イャンガルルガ) — `a black wolf-like bird wyvern, spiky feathers, scarred fierce face, sharp fangs, menacing`
- **rathian.png** (リオレイア) — `a green female wyvern dragon, poisonous spiked tail, leathery wings, elegant and deadly`
- **rathalos.png** (リオレウス) — `a fierce red fire wyvern dragon with large leathery wings, sharp horns, glowing orange eyes, roaring`
- **diablos.png** (ディアブロス) — `a massive horned desert wyvern, two huge twisting horns, sandy brown armored hide, furious`
- **kushala.png** (クシャルダオラ) — `a majestic silver steel elder dragon, metallic plated scales, swirling wind aura, regal and powerful`
- **koryu.png** (古龍) — `an ancient ominous elder dragon, dark scales, glowing runes, immense and legendary, mythical aura`
- **teostra.png** (テオ・テスカトル) — `a fiery lion-maned elder dragon with burning flame mane, large wings, embers and sparks, blazing`
- **nergigante.png** (ネルギガンテ) — `a black destructive elder dragon covered in regenerating white bone spikes, savage, glowing eyes, brutal`
