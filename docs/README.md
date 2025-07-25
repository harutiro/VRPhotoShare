# 📘 VRPhotoShare：VRChat向け画像共有Webサービス仕様書

## 🧾 概要

**VRPhotoShare** は、VRChatユーザー同士が匿名で画像を共有できるWebサービスです。  
Googleフォトのようにアルバムを作成し、URLで画像を共有可能です。ログインは不要で、誰でも簡単に使えることを目指しています。

このアプリケーションを使用すると、ユーザーは写真をアップロードし、ギャラリーで一覧表示することができます。バックエンドはHono、フロントエンドはReact (Vite) とMantine UIコンポーネントライブラリで構築されています。すべてのサービスはDockerコンテナとして実行されます。

---

## 🌐 主な機能一覧

| 機能 | 概要 |
| :--- | :--- |
| ✅ アルバム作成 | 任意の名前でアルバムを作成し、URLを発行。 |
| ✅ 画像アップロード | JPG/PNG/GIFに対応し、匿名でアップロード可能。 |
| ✅ アルバム閲覧 | 誰でもURLでアクセスして画像を閲覧可能。 |
| ✅ コメント（任意） | ログインなしでコメント投稿。 |
| ✅ 削除用トークン | アルバム作成時に発行され、削除操作に利用可能。 |
| ✅ パスワード制限（任意） | アルバムにパスワードを設定可能。 |
| 🔁 VRChat連携API（オプション） | アルバム画像をVRChat側から取得するAPI。 |

---

## 🏗 技術スタック・Docker構成

### フロントエンド

- React + Vite
- Chakra UI
- 画像のグリッド表示 / スライドショー対応
- Nginxで配信

### バックエンド

- Node.js + Hono（TypeScript）
- Cloudflare R2 に画像保存
- PostgreSQL（Docker管理）

### Docker構成（ディレクトリ構成）

```
📦 vrc-photo-share/
├── docker-compose.yml
├── frontend/
│ └── Dockerfile
├── backend/
│ └── Dockerfile
└── db/
└── init.js or init.sql
```

### docker-compose.yml（例）

```yaml
version: '3'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    depends_on:
      - mongo
    env_file:
      - .env

  frontend:
    build: ./frontend
    ports:
      - "3000:80"

  mongo:
    image: mongo
    ports:
      - "27017:27017"
    volumes:
      - ./data:/data/db
```

---

## 🔐 セキュリティと制限機能

| 機能 | 内容 |
| :--- | :--- |
| 削除トークン | アルバム作成時に発行。削除時に必要。 |
| パスワード保護 | アルバムごとに任意でパスワード設定可能。 |
| 保存期限（任意） | アクセスが30日間ない場合に自動削除。 |
| 容量制限 | 1画像あたり5MB、1アルバム最大50枚まで（設定変更可能）。 |

---

## 🔌 バックエンドAPI設計（ログイン不要）

| メソッド | パス | 説明 |
| :--- | :--- | :--- |
| POST | `/api/albums` | 新規アルバム作成（トークン付き） |
| GET | `/api/albums/:id` | アルバム情報取得 |
| POST | `/api/albums/:id/images` | 画像アップロード |
| GET | `/api/albums/:id/images` | 画像一覧取得 |
| DELETE | `/api/images/:id?token=xxx` | 画像削除（トークン要） |

---

## 🧩 VRChat連携API（オプション）

※UdonやOSCを通じての画像表示にも対応予定。

| API | 概要 |
| :--- | :--- |
| GET `/api/albums/:id/latest` | 最新画像のURLを取得（VRChat向け） |
| GET `/api/albums/:id/images` | JSON形式の画像一覧を取得 |

---

## 🚀 今後の拡張計画

- Discord通知連携
- スライドショーGIF生成機能
- ブラウザ上での画像コラージュ作成
- 管理画面（モデレーター用）追加
- CDN最適化（Cloudflare推奨）

---

## ✅ この構成でできること

| ユーザー | 行動内容 |
| :--- | :--- |
| アルバム作成者 | 画像をアップロードしてURLを共有 |
| 閲覧者 | URLを開いて画像を閲覧・投稿（許可時） |
| 管理者 | トークンを用いて不要画像の削除 |

---

## 📎 注意事項

- ユーザー登録・ログインは現在不要です。
- 削除・保護はトークンおよびパスワードで制御されます。
- VRChatとの直接連携は将来のオプション機能です。

## 🔧 セットアップと実行方法

### 前提条件

- Docker
- Docker Compose v2

### 手順

1.  **リポジトリをクローンします**
    ```bash
    git clone <repository-url>
    cd VRPhotoShare
    ```

2.  **環境変数を設定します**
    プロジェクトのルートディレクトリに`.env`ファイルを作成し、以下の内容を記述します。
    ```env
    POSTGRES_USER=user
    POSTGRES_PASSWORD=password
    POSTGRES_DB=vrphotoshare
    ```

3.  **アプリケーションをビルドして起動します**
    以下のコマンドをプロジェクトのルートディレクトリで実行します。
    ```bash
    docker compose up --build -d
    ```
    これにより、必要なコンテナがすべてビルドされ、バックグラウンドで起動します。

4.  **アプリケーションにアクセスします**
    - フロントエンド: [http://localhost:5173](http://localhost:5173)
    - バックエンドAPI: [http://localhost:3000](http://localhost:3000)

5.  **アプリケーションを停止します**
    ```bash
    docker compose down
    ```

## APIエンドポイント

- `GET /api/photos`: すべての写真のリストをJSON形式で返します。
- `POST /api/photos`: 新しい写真をアップロードします。
  - **Body (JSON)**:
    ```json
    {
      "title": "string",
      "description": "string",
      "imageData": "string (Base64 encoded)"
    }
    ```

以上で、ご依頼いただいたすべての作業が完了となります。ご確認ください。


# 画面の内容

### ホーム画面
ホーム画面では新しくアルバムを作成するか、アルバムを閲覧するためのアルバムIDを入力できる様にします。
また、このサービスの使い方を教えるページが下についているといいです。
他人のアルバムは決して表示されない様にしてください。

### アルバムの作成画面

アルバムの名前を決めれる様にしてください
また、IDに関しては、自由記述できる様にしてあげてください。

### 写真をアップロードできる画面
写真をアップロードするのは一括でファイルをドラッグアンドドロップでできる様にして下さい。
ファイルの名前などは変えなくてもいいです。

### アルバムを見る画面
アルバムは写真を格子状にたくさん見れる様にしてください。
また、アルバムをクリックしたら、詳細がポップアップとして表示され、写真の消去と、写真のダウンロードができる様になってください。

また、写真のダウンロードは一番最初の格子状にみれている時に、一括で選択できる様になっていて、選択した画像を一括でzipにしてダウンロードできる様にもして欲しいです。

---

## 🛠 運用ノウハウ・トラブルシューティング

### 1. MinIO・presigned URLの扱い
- 画像ファイルはMinIO（S3互換）に保存し、DBにはファイル名のみを記録します。
- 画像取得時はバックエンドでpresigned URL（署名付きURL）を発行し、フロントエンドはimgタグのsrc属性にそのままURLを指定してください（base64デコード等は不要）。
- presigned URLのホスト部分は、バックエンドからMinIOへは `minio`（dockerネットワーク名）で接続し、外部公開用には `localhost` などに置換する必要があります。  
  例: `http://minio:9000/...` → `http://localhost:9000/...`
- presigned URLで403 Forbiddenが出る場合は、バケットの匿名ダウンロード権限・時刻ズレ・バケット名の大文字小文字を確認してください。

### 2. .env・docker compose・MinIO初期化
- `.env`ファイルがないとDBやMinIOの接続情報が渡らず、500エラー等が発生します。必ず作成してください。
- MinIOバケットが消えている場合は `make minio-setup` で自動作成できます。
- MinIOのエンドポイントは、バックエンドからは `minio`、外部公開用URLには `localhost` などを使い分けてください。

### 3. よくあるエラーと対策
- `minio`パッケージ未インストール → `npm install minio` & `docker compose build`
- presigned URLが `minio` のまま外部公開されている → バックエンドで `localhost` などに置換
- 画像が表示されない・403 → バケット権限、時刻、URL置換、バケット名を確認

### 4. Makefile活用
- `make minio-setup` でバケット作成・初期化が自動化されています。
- docker compose up/downやbackend再起動もMakefile経由で実行できます。

### 5. その他
- フロントエンドでpresigned URLはimgタグのsrcにそのまま指定してください。
- APIエラーの多くはバックエンドやMinIOの設定不備が主因です。エラーメッセージを確認し、上記のポイントを見直してください。