# 画像の置き場所（絵を用意したらここに入れる）

ここに画像を置くだけでゲームに反映されます。**画像が無いファイルは自動で絵文字のまま**動くので、1枚ずつ差し込めます。

## 仕様（推奨）
- 形式: **PNG（背景透過）**
- サイズ: **512×512px の正方形**（最低 256×256）
- 構図: キャラを中央に、余白すこし。向きは左右どちらでもOK（統一推奨）
- スタイル: 全部そろえると一番きれい（同じ画風・同じ塗り）

## ファイル名（この名前で置く）

### ハンター（プレイヤー）
- `hunter.png` … このフォルダ直下に置く

### モンスター → `monsters/` フォルダに置く
| ファイル名 | モンスター |
|---|---|
| `monsters/jaggi.png` | ドスジャギィ |
| `monsters/fango.png` | ドスファンゴ |
| `monsters/rampos.png` | ドスランポス |
| `monsters/kut.png` | イャンクック |
| `monsters/geryos.png` | ゲリョス |
| `monsters/garuga.png` | イャンガルルガ |
| `monsters/rathian.png` | リオレイア |
| `monsters/rathalos.png` | リオレウス |
| `monsters/diablos.png` | ディアブロス |
| `monsters/kushala.png` | クシャルダオラ |
| `monsters/koryu.png` | 古龍 |
| `monsters/teostra.png` | テオ・テスカトル |
| `monsters/nergigante.png` | ネルギガンテ |

※ 亜種（◯◯亜種）は元モンスターと同じ画像を使い、✨が付きます。

## 反映のしかた
画像をここに入れてコミット＆プッシュ → 自動でビルド配信されます。
（手元で確認するだけなら `npm run dev`）
