MINIO_ROOT_USER ?= minioadmin
MINIO_ROOT_PASSWORD ?= minioadmin123
MINIO_BUCKET ?= vrphotoshare

ENV_FILE = .env.dev
PROD_ENV_FILE = .env.prod

.PHONY: create-minio-bucket set-minio-public minio-setup dev setup stop clean db-init deploy deploy-stop deploy-clean migrate migrate-status migrate-to migrate-prod migrate-prod-force backup-db restore-db logs logs-backend logs-frontend logs-db logs-minio help

create-minio-bucket:
	@echo "MinIOバケットを作成中..."
	docker run --rm --network host --entrypoint sh minio/mc -c \
	  "mc alias set myminio http://localhost:9000 $(MINIO_ROOT_USER) $(MINIO_ROOT_PASSWORD) && \
	   mc mb --ignore-existing myminio/$(MINIO_BUCKET)"
	@echo "MinIOにバケット($(MINIO_BUCKET))を作成しました。"

set-minio-public:
	@echo "MinIOバケットに公開権限を設定中..."
	docker run --rm --network host --entrypoint sh minio/mc -c \
	  "mc alias set myminio http://localhost:9000 $(MINIO_ROOT_USER) $(MINIO_ROOT_PASSWORD) && \
	   mc anonymous set public myminio/$(MINIO_BUCKET)"
	@echo "MinIOバケット($(MINIO_BUCKET))に公開権限を設定しました。"

# MinIOの完全な初期設定（キー生成、バケット作成、公開権限設定をまとめて実行）
minio-setup: create-minio-bucket set-minio-public
	@echo ""
	@echo "🎉 MinIOの初期設定が完了しました！"
	@echo "📁 バケット名: $(MINIO_BUCKET)"
	@echo "🔑 アクセスキー: $(MINIO_ROOT_USER)"
	@echo "🌐 MinIOコンソール: http://localhost:9001"
	@echo "📸 画像は署名なしの直接URLでアクセス可能です"

open-minio-console:
	open http://localhost:9001

# 1. 初回セットアップ（MinIO初期化＋docker起動＋hooks）
setup: 
	docker compose up -d
	make minio-setup
	make setup-hooks

# 2. 開発用サーバー起動（既に初期化済みならこれだけでOK）
dev:
	open http://localhost:5173
	docker compose up

# 3. サービス停止
stop:
	docker compose down

# 4. ボリュームも含めて完全クリーン
clean:
	docker compose down -v

# 5. DB初期化（init.sqlを流し直したい場合など）
db-init:
	docker compose exec db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/init.sql

# 本番デプロイ用（docker composeでバックグラウンド起動）
deploy:
	docker compose -f docker-compose.prod.yml build --no-cache 
	docker compose -f docker-compose.prod.yml up -d

# 本番サービス停止
deploy-stop:
	docker compose -f docker-compose.prod.yml down

# 本番サービス完全削除（ボリューム含む）
deploy-clean:
	docker compose -f docker-compose.prod.yml down -v

# ========================================
# Database Migration Commands
# ========================================

# マイグレーション実行（開発環境）
migrate:
	@echo "🔄 マイグレーションを実行中..."
	@for file in $$(ls db/migrations/*.sql | sort); do \
		filename=$$(basename $$file .sql); \
		echo "Checking migration: $$filename"; \
		result=$$(docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
		if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
			echo "⚡ Applying migration: $$filename"; \
			docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
		else \
			echo "✅ Migration already applied: $$filename"; \
		fi; \
	done
	@echo "✨ マイグレーション完了！"

# マイグレーション状況確認
migrate-status:
	@echo "📊 マイグレーション状況を確認中..."
	@echo "=== 適用済みマイグレーション ==="
	@docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -c "SELECT version, applied_at FROM schema_migrations ORDER BY version;" 2>/dev/null || echo "❌ schema_migrationsテーブルが見つかりません"
	@echo ""
	@echo "=== 利用可能なマイグレーション ==="
	@ls db/migrations/*.sql 2>/dev/null || echo "❌ マイグレーションファイルが見つかりません"

# 特定バージョンまでマイグレーション実行
migrate-to:
	@if [ -z "$(VERSION)" ]; then \
		echo "❌ VERSIONパラメータが必要です。例: make migrate-to VERSION=002"; \
		exit 1; \
	fi
	@echo "🔄 バージョン $(VERSION) までマイグレーションを実行中..."
	@for file in $$(ls db/migrations/*.sql | sort); do \
		filename=$$(basename $$file .sql); \
		version=$$(echo $$filename | cut -d'_' -f1); \
		if [ "$$version" -le "$(VERSION)" ]; then \
			result=$$(docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
			if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
				echo "⚡ Applying migration: $$filename"; \
				docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
			else \
				echo "✅ Migration already applied: $$filename"; \
			fi; \
		fi; \
	done
	@echo "✨ バージョン $(VERSION) までのマイグレーション完了！"

# 本番環境マイグレーション（確認あり）
migrate-prod:
	@echo "⚠️  本番環境でマイグレーションを実行しようとしています。"
	@echo "📋 実行前に以下を確認してください："
	@echo "   1. データベースのバックアップは取得済みですか？"
	@echo "   2. マイグレーション内容を確認しましたか？"
	@echo "   3. ダウンタイムの準備は完了していますか？"
	@echo ""
	@read -p "本当に実行しますか？ (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🔄 本番環境でマイグレーション実行中..."; \
		for file in $$(ls db/migrations/*.sql | sort); do \
			filename=$$(basename $$file .sql); \
			echo "Checking migration: $$filename"; \
			result=$$(docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER $(PROD_ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(PROD_ENV_FILE) | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
			if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
				echo "⚡ Applying migration: $$filename"; \
				docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER $(PROD_ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(PROD_ENV_FILE) | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
			else \
				echo "✅ Migration already applied: $$filename"; \
			fi; \
		done; \
		echo "✨ 本番環境マイグレーション完了！"; \
	else \
		echo "❌ マイグレーションがキャンセルされました。"; \
	fi

# 本番環境マイグレーション（強制実行）
migrate-prod-force:
	@echo "🔄 本番環境でマイグレーション強制実行中..."
	@for file in $$(ls db/migrations/*.sql | sort); do \
		filename=$$(basename $$file .sql); \
		echo "Checking migration: $$filename"; \
		result=$$(docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER $(PROD_ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(PROD_ENV_FILE) | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
		if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
			echo "⚡ Applying migration: $$filename"; \
			docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER $(PROD_ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(PROD_ENV_FILE) | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
		else \
			echo "✅ Migration already applied: $$filename"; \
		fi; \
	done
	@echo "✨ 本番環境マイグレーション完了！"

# データベースバックアップ
backup-db:
	@echo "💾 データベースバックアップを作成中..."
	@mkdir -p backups
	@docker compose exec -T db pg_dump -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ バックアップ完了: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

# データベースリストア
restore-db:
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "❌ BACKUP_FILEパラメータが必要です。例: make restore-db BACKUP_FILE=backups/backup_20231201_120000.sql"; \
		exit 1; \
	fi
	@echo "⚠️  データベースをリストアしようとしています。"
	@echo "📋 現在のデータは全て削除されます。"
	@read -p "本当に実行しますか？ (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🔄 データベースリストア中..."; \
		docker compose exec -T db psql -U $$(grep POSTGRES_USER $(ENV_FILE) | cut -d '=' -f2) -d $$(grep POSTGRES_DB $(ENV_FILE) | cut -d '=' -f2) < $(BACKUP_FILE); \
		echo "✅ リストア完了"; \
	else \
		echo "❌ リストアがキャンセルされました。"; \
	fi

# ========================================
# Git Hooks Setup
# ========================================

# Git hookをセットアップ
setup-hooks:
	@echo "🔧 Setting up Git hooks..."
	@chmod +x hooks/pre-push
	@cp hooks/pre-push .git/hooks/pre-push
	@echo "✅ Git hooks setup completed!"
	@echo "💡 Pre-push hook will now automatically check code quality before push"

# Git hookを削除
remove-hooks:
	@echo "🗑️  Removing Git hooks..."
	@rm -f .git/hooks/pre-push
	@echo "✅ Git hooks removed!"

# ========================================
# Lint Commands
# ========================================

# 全プロジェクトでlintを実行
lint:
	@echo "📋 Running lint for all projects..."
	@echo "🔍 Frontend lint..."
	@cd frontend && npm run lint
	@echo "🔍 Backend lint..."
	@cd backend && npm run lint
	@echo "✅ All lint checks completed!"

# 全プロジェクトでlint --fixを実行
lint-fix:
	@echo "🔧 Running lint --fix for all projects..."
	@echo "🔧 Frontend lint --fix..."
	@cd frontend && npm run lint:fix
	@echo "🔧 Backend lint --fix..."
	@cd backend && npm run lint:fix
	@echo "✅ All lint fixes completed!"

# ビルドチェック（push前チェックと同様）
check:
	@echo "🔍 Running pre-push checks..."
	@echo "📋 Frontend lint..."
	@cd frontend && npm run lint
	@echo "🏗️  Frontend build..."
	@cd frontend && npm run build
	@echo "📋 Backend lint..."
	@cd backend && npm run lint
	@echo "🏗️  Backend build..."
	@cd backend && npm run build
	@echo "🎉 All checks passed!"

# ========================================
# Folder Structure Migration
# ========================================

# 既存の写真を新しいディレクトリ構造に移行
folder-reformat:
	@echo "📁 既存写真のフォルダ構造移行を開始します..."
	@echo "⚠️  この操作は以下を実行します："
	@echo "   1. MinIO内のファイルを新しいディレクトリ構造に移動"
	@echo "   2. データベースのパス情報を更新"
	@echo "   3. アルバムあり: albums/{custom_id}/ に移動"
	@echo "   4. アルバムなし: photos/ に移動"
	@echo ""
	@read -p "実行前にバックアップを取得しましたか？ 続行しますか？ (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "🔄 フォルダ構造移行実行中..."; \
		docker compose exec backend npm run folder-reformat; \
		echo "✨ フォルダ構造移行完了！"; \
	else \
		echo "❌ フォルダ構造移行がキャンセルされました。"; \
	fi

# 強制実行（確認なし）
folder-reformat-force:
	@echo "🔄 フォルダ構造移行強制実行中..."
	docker compose exec backend npm run folder-reformat
	@echo "✨ フォルダ構造移行完了！"

# ========================================
# Logging Commands
# ========================================

# 全サービスのログを表示
logs:
	@echo "📋 全サービスのログを表示中..."
	docker compose logs -f --tail=100

# バックエンドサービスのログを表示
logs-backend:
	@echo "🔧 バックエンドサービスのログを表示中..."
	docker compose logs -f --tail=100 backend

# フロントエンドサービスのログを表示
logs-frontend:
	@echo "🎨 フロントエンドサービスのログを表示中..."
	docker compose logs -f --tail=100 frontend

# データベースサービスのログを表示
logs-db:
	@echo "🗄️  データベースサービスのログを表示中..."
	docker compose logs -f --tail=100 db

# MinIOサービスのログを表示
logs-minio:
	@echo "📦 MinIOサービスのログを表示中..."
	docker compose logs -f --tail=100 minio

# ========================================
# Help
# ========================================

# ヘルプ表示
help:
	@echo "🎯 VRPhotoShare - 利用可能なコマンド"
	@echo ""
	@echo "📦 基本操作:"
	@echo "  make setup          - 初回セットアップ（MinIO初期化＋docker起動）"
	@echo "  make dev            - 開発用サーバー起動"
	@echo "  make stop           - サービス停止"
	@echo "  make clean          - ボリューム含む完全クリーン"
	@echo ""
	@echo "🔄 マイグレーション:"
	@echo "  make migrate        - 全マイグレーション実行（開発環境）"
	@echo "  make migrate-status - マイグレーション状況確認"
	@echo "  make migrate-to VERSION=002 - 特定バージョンまで実行"
	@echo "  make migrate-prod   - 本番環境マイグレーション（確認あり）"
	@echo "  make migrate-prod-force - 本番環境マイグレーション（強制実行）"
	@echo ""
	@echo "💾 バックアップ:"
	@echo "  make backup-db      - データベースバックアップ作成"
	@echo "  make restore-db BACKUP_FILE=xxx.sql - データベースリストア"
	@echo ""
	@echo "📁 フォルダ構造移行:"
	@echo "  make folder-reformat - 既存写真を新しいディレクトリ構造に移行（確認あり）"
	@echo "  make folder-reformat-force - 既存写真を新しいディレクトリ構造に移行（強制実行）"
	@echo ""
	@echo "📋 ログ表示:"
	@echo "  make logs           - 全サービスのログ表示"
	@echo "  make logs-backend   - バックエンドログ表示"
	@echo "  make logs-frontend  - フロントエンドログ表示"
	@echo "  make logs-db        - データベースログ表示"
	@echo "  make logs-minio     - MinIOログ表示"
	@echo ""
	@echo "🚀 本番デプロイ:"
	@echo "  make deploy         - 本番デプロイ"
	@echo "  make deploy-stop    - 本番サービス停止"
	@echo "  make deploy-clean   - 本番サービス完全削除"
	@echo ""
	@echo "🔧 Git Hooks:"
	@echo "  make setup-hooks    - Git hookをセットアップ（推奨）"
	@echo "  make remove-hooks   - Git hookを削除"
	@echo ""
	@echo "🔍 コード品質:"
	@echo "  make lint           - 全プロジェクトでlint実行"
	@echo "  make lint-fix       - 全プロジェクトでlint自動修正"
	@echo "  make check          - push前チェック（lint + build）"
	@echo ""
	@echo "📝 その他:"
	@echo "  make db-init        - DB初期化"
	@echo "  make minio-setup    - MinIO初期設定"
	@echo "  make help           - このヘルプを表示"