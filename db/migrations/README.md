# Database Migrations

このディレクトリには、データベーススキーマのマイグレーションファイルが含まれています。

## ファイル命名規則

```
{バージョン番号}_{説明}.sql
```

例：
- `001_initial_schema.sql` - 初期スキーマ
- `002_add_user_table.sql` - ユーザーテーブル追加
- `003_add_photo_indexes.sql` - 写真テーブルにインデックス追加

## マイグレーション実行方法

### 開発環境
```bash
# 全てのマイグレーションを実行
make migrate

# 特定のマイグレーションまで実行
make migrate-to VERSION=002

# マイグレーション状況を確認
make migrate-status
```

### 本番環境
```bash
# 本番環境でマイグレーション実行（安全確認あり）
make migrate-prod

# 本番環境で強制実行（確認なし）
make migrate-prod-force
```

## 注意事項

1. **ファイル名の番号は連番にしてください**
2. **一度適用されたマイグレーションファイルは変更しないでください**
3. **本番環境でのマイグレーション前は必ずバックアップを取ってください**
4. **破壊的変更（DROP TABLE等）は十分注意してください**

## マイグレーション追跡

- `schema_migrations`テーブルでマイグレーションの適用状況を管理
- 適用済みのマイグレーションは再実行されません 