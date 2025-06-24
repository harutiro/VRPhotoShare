MINIO_ROOT_USER ?= minioadmin
MINIO_ROOT_PASSWORD ?= minioadmin123
MINIO_BUCKET ?= vrphotoshare

ENV_FILE = .env

.PHONY: gen-minio-keys create-minio-bucket set-minio-public minio-setup dev setup stop clean db-init deploy deploy-stop deploy-clean migrate migrate-status migrate-to migrate-prod migrate-prod-force backup-db restore-db

gen-minio-keys:
	@echo "MINIO_ROOT_USER=$(MINIO_ROOT_USER)" >> $(ENV_FILE)
	@echo "MINIO_ROOT_PASSWORD=$(MINIO_ROOT_PASSWORD)" >> $(ENV_FILE)
	@echo "MINIO_BUCKET=$(MINIO_BUCKET)" >> $(ENV_FILE)
	@echo "MinIOのアクセスキー・シークレットキー・バケット名を$(ENV_FILE)に書き込みました。"

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
minio-setup: gen-minio-keys create-minio-bucket set-minio-public
	@echo ""
	@echo "🎉 MinIOの初期設定が完了しました！"
	@echo "📁 バケット名: $(MINIO_BUCKET)"
	@echo "🔑 アクセスキー: $(MINIO_ROOT_USER)"
	@echo "🌐 MinIOコンソール: http://localhost:9001"
	@echo "📸 画像は署名なしの直接URLでアクセス可能です"

open-minio-console:
	open http://localhost:9001

# 1. 初回セットアップ（MinIO初期化＋docker起動）
setup: 
	docker compose up -d
	make minio-setup

# 2. 開発用サーバー起動（既に初期化済みならこれだけでOK）
dev:
	docker compose up
	open http://localhost:5173

# 3. サービス停止
stop:
	docker compose down

# 4. ボリュームも含めて完全クリーン
clean:
	docker compose down -v

# 5. DB初期化（init.sqlを流し直したい場合など）
db-init:
	docker compose exec db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/init.sql

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
		result=$$(docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
		if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
			echo "⚡ Applying migration: $$filename"; \
			docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
		else \
			echo "✅ Migration already applied: $$filename"; \
		fi; \
	done
	@echo "✨ マイグレーション完了！"

# マイグレーション状況確認
migrate-status:
	@echo "📊 マイグレーション状況を確認中..."
	@echo "=== 適用済みマイグレーション ==="
	@docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -c "SELECT version, applied_at FROM schema_migrations ORDER BY version;" 2>/dev/null || echo "❌ schema_migrationsテーブルが見つかりません"
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
			result=$$(docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
			if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
				echo "⚡ Applying migration: $$filename"; \
				docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
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
			result=$$(docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
			if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
				echo "⚡ Applying migration: $$filename"; \
				docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
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
		result=$$(docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -t -c "SELECT version FROM schema_migrations WHERE version = '$$filename';" 2>/dev/null || echo ""); \
		if [ -z "$$result" ] || [ "$$(echo $$result | xargs)" = "" ]; then \
			echo "⚡ Applying migration: $$filename"; \
			docker compose -f docker-compose.prod.yml exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) -f /docker-entrypoint-initdb.d/migrations/$$(basename $$file); \
		else \
			echo "✅ Migration already applied: $$filename"; \
		fi; \
	done
	@echo "✨ 本番環境マイグレーション完了！"

# データベースバックアップ
backup-db:
	@echo "💾 データベースバックアップを作成中..."
	@mkdir -p backups
	@docker compose exec -T db pg_dump -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
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
		docker compose exec -T db psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) -d $$(grep POSTGRES_DB .env | cut -d '=' -f2) < $(BACKUP_FILE); \
		echo "✅ リストア完了"; \
	else \
		echo "❌ リストアがキャンセルされました。"; \
	fi