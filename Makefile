MINIO_ROOT_USER ?= minioadmin
MINIO_ROOT_PASSWORD ?= minioadmin123
MINIO_BUCKET ?= vrphotoshare

ENV_FILE = .env

.PHONY: gen-minio-keys create-minio-bucket set-minio-public minio-setup

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