-- photosテーブルが存在すれば削除
DROP TABLE IF EXISTS photos;

-- photosテーブルの作成
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 