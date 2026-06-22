# 画像生成プロンプト集（モホレカ用 / 狩猟アクション風）

各画像は **正方形・背景透過PNG・512×512** が理想。生成後に同名で `public/img/` に置けば反映されます（対応表は README.md）。

## 使い方
1. 下の「共通スタイル」を毎回うしろに付ける（絵柄を統一するため）
2. 各キャラの「説明」＋「共通スタイル」を生成AIに入力
3. 透過にならないツールは白背景で出して remove.bg などで透過化
4. 同じツール・同じスタイル指定・できれば同じシードで揃える

> ⚠️ 著作権: 実在モンスター名やブランド名（Monster Hunter 等）は入れない。あくまで“狩猟アクションの世界観”のオリジナル創作として生成する。

## 共通スタイル（毎回うしろに付ける）★モンハン感の肝
```
, semi-realistic painterly creature concept art, AAA monster-hunting action RPG aesthetic, gritty earthy color palette, highly detailed organic anatomy, detailed scales fur membranes and bone, dramatic cinematic rim lighting, fearsome and majestic, dynamic yet centered, full body, three-quarter view, single subject only, no other creatures, no ground, no rock base, isolated on plain transparent background, square 1:1, high detail game asset, no text, no watermark, no logo
```

ポイント:
- `armor/weapon crafted from monster bone, scale, fur, fang`（素材で作った装備）
- `semi-realistic painterly concept art`（半リアルの厚塗り）
- `fearsome`（獰猛・かわいくしない）
- `single subject only / no ground`（前回の“倒した獣＋岩”を防ぐ）

## 完成プロンプト例（火竜＝rathalos.png）
```
a fearsome red fire wyvern, realistic dragon anatomy, large leathery membrane wings, sharp curved horns, armored scales, glowing orange eyes, fire glands, predatory roaring pose, semi-realistic painterly creature concept art, AAA monster-hunting action RPG aesthetic, gritty earthy color palette, highly detailed organic anatomy, detailed scales fur membranes and bone, dramatic cinematic rim lighting, fearsome and majestic, dynamic yet centered, full body, three-quarter view, single subject only, no other creatures, no ground, no rock base, isolated on plain transparent background, square 1:1, high detail game asset, no text, no watermark, no logo
```

---

## ハンター
- **hunter.png** — `a rugged monster hunter clad in layered armor forged from monster bone, carapace, scales and shaggy fur, asymmetric organic plating, fanged pauldrons and clawed gauntlets, wielding a massive ornate greatsword resting on the shoulder, tribal hunter silhouette, weathered and battle-worn, solo standing pose`

## モンスター（→ monsters/ フォルダ）獰猛・半リアル飛竜
- **jaggi.png** (ドスジャギィ) — `a vicious bipedal raptor wyvern, lean reptilian body, cream and tan scales, a bony red head crest, fanged maw, snarling pack-leader`
- **fango.png** (ドスファンゴ) — `a monstrous tusked boar beast, massive curved tusks, bristly matted brown fur, armored hide, furious charging stance`
- **rampos.png** (ドスランポス) — `a savage raptor wyvern, sleek green scales, powerful hind legs, sharp claws and fangs, fast predatory crouch`
- **kut.png** (イャンクック) — `a large bird wyvern with huge fan-like ears, a heavy curved beak, beige feathered scaly hide, spreading wings, fierce screech`
- **geryos.png** (ゲリョス) — `a sinister bird wyvern with a fleshy hood crest, sickly pink rubbery hide, toxic glands, glowing eyes, menacing lunge`
- **garuga.png** (イャンガルルガ) — `a fierce black wolf-like bird wyvern, spiked plumage, scarred armored face, jagged fangs, aggressive predatory pose`
- **rathian.png** (リオレイア) — `a deadly green female wyvern, venomous spiked tail, leathery membrane wings, armored scales, agile predatory stance`
- **rathalos.png** (リオレウス) — `a fearsome red fire wyvern, large leathery wings, curved horns, armored scales, glowing orange eyes, roaring predatory pose`
- **diablos.png** (ディアブロス) — `a massive horned desert wyvern, two enormous twisting black horns, sandy armored hide, brutal charging stance, sand bursts`
- **kushala.png** (クシャルダオラ) — `a majestic silver steel elder dragon, metallic plated scales, tattered membrane wings, swirling wind aura, regal and fearsome`
- **koryu.png** (古龍) — `an ancient ominous elder dragon, dark battle-scarred scales, glowing ember cracks, towering legendary presence, mythical menace`
- **teostra.png** (テオ・テスカトル) — `a blazing lion-maned elder dragon, fiery flame mane, large membrane wings, embers and sparks, molten cracks, regal and burning`
- **nergigante.png** (ネルギガンテ) — `a brutal black elder dragon bristling with regenerating white bone spikes, muscular armored body, savage glowing eyes, destructive pose`
