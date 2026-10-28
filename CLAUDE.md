# hp_pentech — www.pentech.info

PenTech（iTeen武庫之荘校）の公開サイト。`C:\company` とは別のgitリポジトリ（remote: `github-pentech:pentech225/hp_pentech`）。

## 公開のしくみ（いちばん大事）
- GitHub Pages で `main` ブランチのルートをそのまま公開している（独自ドメインは `CNAME` の `www.pentech.info`）。
- **`main` に push した時点で、全部が誰でも見られる状態になる。** push の1〜数分後に反映される。
- そのため、次のものはコミットしない・置かない。
  - 生徒の実名・顔写真・成績、保護者の連絡先など個人情報（本人や保護者の掲載同意があるものを除く）
  - 売上・契約条件・クライアント名などの機密情報（`C:\company\CLAUDE.md` の機密ルールと同じ）
  - APIキーやパスワード。GASのURLなど半公開の値は、置く前に公開されて困らないか確認する
- `git add -A` は使わず、触ったフォルダだけを指定して add する（作業途中のファイルが一緒に公開されるのを防ぐ）。
- `matomo/` はサーバーへ直接アップロードするもので、git では管理しない（`.gitignore` 済み）。

## フォルダ
| フォルダ | 中身 | 個別のルール |
|---|---|---|
| `school/mukonoso/` | iTeen武庫之荘校の教室サイト（ブログ・予約・イベント） | `school/mukonoso/CLAUDE.md`（デザイン指針） |
| `school/portal/` | 生徒向けポータル（教材・過去問など） | — |
| `school/tsubame/` | つばめ（無料塾） | — |
| `school/cource/` | コース紹介 | — |
| `naraigoto/` | 尼崎の習い事ガイド（条件検索・地図・比較表） | `naraigoto/CLAUDE.md`（公平さのルール・データの書き方） |
| `tubasa/` | 翼プリ関連 | — |
| `basket/` | バスケの記録 | — |
| `tools/` | タイピングランド生徒切替など、教室で使う道具 | — |
| `img/` | ロゴ | — |

## 全ページ共通
- `<head>` の最初で `/ga4-tracking.js` を読み込む（GA4の計測）。
- デザインは `school/mukonoso/CLAUDE.md` の指針（角丸0、色付きの箱・左側だけの縦棒・パステルのグラデーション・絵文字の装飾を使わない）を全セクションの基本にする。
- 新しいページには `title`・`description`・`canonical` を入れ、公開したら `sitemap.xml` に足す。
- 外部の数値や評判を載せるときは、出典のリンクと確認日を書く。

## 動作確認
- 手元で見るときは、このフォルダで `python -m http.server 8765` を実行し、`http://localhost:8765/<フォルダ>/` を開く（`fetch` でJSONを読むページは、ファイルを直接開くと動かない）。
