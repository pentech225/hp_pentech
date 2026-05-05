# Git 運用ルール（全ワークツリー共通）

- **ブランチ上は何でもOK** — commit・push 自由
- **main/master への直接pushは禁止** — pre-push hookで物理ブロック済み
- mainへのマージは PR を作成してYoshiの承認を得ること
- ブランチ命名推奨: `wt-{プロジェクト名}` または `ai/{機能名}`
- マージ確認: `bash scripts/merge-check.sh` で一覧確認
