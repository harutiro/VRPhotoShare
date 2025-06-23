MINIO_ROOT_USER ?= minioadmin
MINIO_ROOT_PASSWORD ?= minioadmin123
MINIO_BUCKET ?= vrphotoshare

ENV_FILE = .env

.PHONY: gen-minio-keys create-minio-bucket set-minio-public minio-setup dev setup stop clean db-init deploy deploy-stop deploy-clean

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
setup: minio-setup
	docker compose up -d

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
	docker compose -f docker-compose.prod.yml up -d

# 本番サービス停止
deploy-stop:
	docker compose -f docker-compose.prod.yml down

# 本番サービス完全削除（ボリューム含む）
deploy-clean:
	docker compose -f docker-compose.prod.yml down -v