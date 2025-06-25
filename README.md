# VRPhotoShare 開発用README

## 📦 プロジェクト概要

VRPhotoShareは、VRChatユーザー向けの匿名画像共有Webサービスです。  
アルバム作成・画像アップロード・グループ化・ダウンロード・日本語UIなど多機能。  
バックエンド（Hono/TypeScript）、フロントエンド（React/Vite）、DB（PostgreSQL）、ストレージ（MinIO）をDockerで一括管理。

---

## ⚙️ 環境変数設定

### .envファイルの作成

初回起動前に、プロジェクトルートに `.env` ファイルを作成してください。  
`env.example` を参考に以下のような内容で設定します：

```bash
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=vrphotoshare

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# URL Configuration (開発環境)
BASE_URL=http://localhost:3000
MINIO_PUBLIC_URL=http://localhost:9000
```

### 本番環境での設定

本番環境では、以下のように設定を変更してください：

```bash
# 本番環境用の設定例
BASE_URL=https://your-domain.com
MINIO_PUBLIC_URL=https://your-domain.com:9000

# セキュリティのため、本番では強固なパスワードを使用
POSTGRES_PASSWORD=your-strong-password
MINIO_ROOT_PASSWORD=your-strong-minio-password
```

### 主な環境変数の説明

| 変数名 | 説明 | デフォルト値 |
|--------|------|------------|
| `BASE_URL` | バックエンドAPIのベースURL | 開発:`http://localhost:3000`<br>本番:`https://your-domain.com` |
| `MINIO_PUBLIC_URL` | MinIOの公開URL | 開発:`http://localhost:9000`<br>本番:`https://your-domain.com/minio-api` |
| `VITE_BACKEND_URL` | フロントエンドからバックエンドへのプロキシURL | 開発:`http://backend:3000`<br>本番:`https://your-domain.com` |
| `POSTGRES_USER` | PostgreSQLのユーザー名 | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQLのパスワード | `postgres` |
| `POSTGRES_DB` | PostgreSQLのデータベース名 | `vrphotoshare` |
| `MINIO_ROOT_USER` | MinIOの管理者ユーザー名 | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIOの管理者パスワード | `minioadmin123` |

---

## 🚀 クイックスタート

### 1. 必要なもの

- Docker / Docker Compose v2
- make（Mac/Linuxは標準、WindowsはWSL推奨）

### 2. 初回セットアップ

```sh
# .envファイルを作成（env.exampleを参考に）
cp env.example .env
# 必要に応じて.envの内容を編集

make setup
```
- MinIOの初期化（バケット作成・公開化）
- DB・MinIO・バックエンド・フロントエンドの全サービスを自動起動
- ブラウザで http://localhost:5173 が自動で開きます

### 3. 2回目以降の開発起動

```sh
make dev
```
- サービスを再起動し、フロントエンドも自動で開きます

### 4. サービス停止・クリーンアップ

```sh
make stop   # サービス停止
make clean  # ボリュームも含めて完全削除
```

### 5. DB初期化（スキーマ再投入）

```sh
make db-init
```

---

## 🌏 本番デプロイ方法

### サーバー（VPSやクラウド等）での本番起動

1. 必要なファイルをサーバーに配置（git clone推奨）
2. `.env` を編集し、本番用のDB/MINIO設定にする
3. MinIO初期化（初回のみ）
   ```sh
   make minio-setup
   ```
4. 本番サービス起動
   ```sh
   make deploy
   ```
   - `docker-compose.prod.yml` を使って本番用Dockerイメージで全サービスが起動します
   - フロントエンドはnginxで80番ポートで配信されます（http://<サーバーIP>/）
   - サーバーのファイアウォールで 80, 3000, 9000, 9001 など必要なポートを開放してください

5. サービス停止
   ```sh
   make deploy-stop
   ```

6. 完全削除（ボリューム含む）
   ```sh
   make deploy-clean
   ```

### 開発/本番の切り替えについて
- 開発は `docker-compose.yml`、本番は `docker-compose.prod.yml` を使います
- `make dev` … 開発用ホットリロード環境（Vite/ts-node等）
- `make deploy` … 本番用ビルド＆nginx配信

### 注意事項
- 本番では.envのパスワード・キーを十分に強固なものにしてください
- サーバーのセキュリティ設定（ファイアウォール、SSL等）は各自でご対応ください
- docker-compose.ymlのポートや永続化設定も必要に応じて調整してください

---

## 🔄 プログラムのアップデート手順（本番環境）

1. **最新のソースコードを取得**
   - サーバー上で以下を実行
   ```sh
   git pull origin master
   ```
   ※ブランチ名は運用方針に合わせて適宜変更してください

2. **（必要に応じて）.envの内容を更新**
   - 新しい環境変数や設定が追加された場合は、READMEやリリースノートを参照し .env を編集

3. **本番サービスを再ビルド・再起動**
   - 以下のコマンドでDockerイメージを再ビルドし、全サービスを再起動します
   ```sh
   make deploy
   ```
   - これにより、backend/frontendの最新コード・依存パッケージ・nginx設定などがすべて反映されます

4. **動作確認**
   - ブラウザで http://<サーバーIP>/ にアクセスし、正常に動作するか確認
   - 必要に応じてAPIや管理画面（MinIO, DB）も確認

### 注意事項
- DBやMinIOのデータはdocker volumeで永続化されているため、`make deploy`や`docker compose down`では消えません
- ただし `make deploy-clean` や `docker compose down -v` でボリュームを削除するとデータも消えるので注意
- 依存パッケージやDBスキーマに大きな変更がある場合は、READMEやリリースノートの追加手順も参照してください

---

## 🗂️ ディレクトリ構成

```
VRPhotoShare/
├── backend/    # Hono/TypeScript APIサーバー
├── frontend/   # React+Vite フロントエンド
├── db/         # DB初期化SQL
├── docs/       # 仕様書・設計資料
├── docker-compose.yml
├── Makefile
└── .env        # 環境変数（初回自動生成）
```

---

## 🌐 アクセスURL

- フロントエンド: 
  - 開発時: [http://localhost:5173](http://localhost:5173)
  - **本番時: [http://<サーバーIP>/](http://<サーバーIP>/)（nginxで80番）**
- バックエンドAPI: [http://localhost:3000](http://localhost:3000)
- MinIO管理画面: [http://localhost:9001](http://localhost:9001)  
  （ユーザー/パスワードは .env 参照）

---

## 🛠️ 主なMakefileコマンド

| コマンド         | 内容                                 |
|------------------|--------------------------------------|
| make setup       | MinIO初期化＋全サービス起動（初回）  |
| make dev         | 開発用サーバー起動（2回目以降）      |
| make stop        | サービス停止                         |
| make clean       | ボリューム含め完全クリーン           |
| make db-init     | DBスキーマ再投入                     |
| make minio-setup | MinIOバケット初期化のみ              |

---

## 🔗 APIエンドポイント例

- `GET /api/albums` … アルバム一覧取得
- `POST /api/albums` … アルバム作成
- `GET /api/albums/:custom_id/photos` … アルバム内写真一覧
- `POST /api/albums/:custom_id/photos` … アルバム内写真アップロード
- `GET /api/photos` … アルバム外写真一覧
- `POST /api/photos` … アルバム外写真アップロード
- `DELETE /api/photos/:id` … 写真削除

---

## 💡 開発Tips

- バックエンド/フロントエンドともにホットリロード対応
- MinIOバケットは公開設定済み。画像URLは署名なしで直接アクセス可
- .envはmake setup時に自動生成・追記されます

---

## ❓ よくある質問

- **Q. DBやMinIOの管理画面に入りたい**
  - MinIO: http://localhost:9001
  - PostgreSQL: `docker-compose exec db psql -U <ユーザー名> -d <DB名>`

- **Q. 画像がアップロードできない/表示されない**
  - MinIOバケットの公開設定・.envの内容を再確認し、`make minio-setup`を再実行

---

## 📝 ライセンス・著作権

- 本プロジェクトはMITライセンスです。
- VRChatはVRChat Inc.の登録商標です。

---

ご不明点・コントリビュート歓迎！  
（このREADMEはプロジェクトルートまたはdocs/README.mdに配置してください）

---

必要に応じて、API詳細や設計資料は `docs/README.md` も参照してください。 