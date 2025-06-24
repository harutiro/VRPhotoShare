--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: albums; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.albums (
    id integer NOT NULL,
    custom_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.albums OWNER TO postgres;

--
-- Name: albums_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.albums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.albums_id_seq OWNER TO postgres;

--
-- Name: albums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.albums_id_seq OWNED BY public.albums.id;


--
-- Name: photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.photos (
    id integer NOT NULL,
    album_id integer,
    filename text NOT NULL,
    stored_filename text NOT NULL,
    image_data text,
    thumbnail_filename text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.photos OWNER TO postgres;

--
-- Name: photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.photos_id_seq OWNER TO postgres;

--
-- Name: photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.photos_id_seq OWNED BY public.photos.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: albums id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.albums ALTER COLUMN id SET DEFAULT nextval('public.albums_id_seq'::regclass);


--
-- Name: photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos ALTER COLUMN id SET DEFAULT nextval('public.photos_id_seq'::regclass);


--
-- Data for Name: albums; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.albums (id, custom_id, name, created_at) FROM stdin;
1	test	test	2025-06-24 11:34:57.427351+00
2	test1	test	2025-06-24 11:54:32.4228+00
\.


--
-- Data for Name: photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.photos (id, album_id, filename, stored_filename, image_data, thumbnail_filename, created_at) FROM stdin;
1	1	test.jpg	c7032fda-456a-4a36-a26f-3d60b5fab788.jpg	\N	thumbnails/80355fbb-7c71-4620-a32d-a48dce78665c.webp	2025-06-24 11:50:03.659393+00
2	1	VRChat_2025-06-14_01-55-09.029_3840x2160.png	4cfb2571-df4b-471b-937d-8f63804569f2.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"The Great Plateau - Zelda: Breath of the Wild","id":"wrld_fd1b10c7-fac1-45fd-adf2-53f9a30e032d","instanceId":"wrld_fd1b10c7-fac1-45fd-adf2-53f9a30e032d:45063~friends(usr_520782fd-384d-4a7b-bab4-6a268183933a)~region(jp)"},"players":[{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_e8dad3d2-9f94-4d1a-9aaf-f9ed44d3a039","displayName":"findmap0"}]}	thumbnails/7bad3aae-79d8-4a52-843d-5cb133e80504.webp	2025-06-24 11:51:00.112123+00
3	1	VRChat_2025-06-21_01-22-57.623_3840x2160.png	3296d3d6-0066-46c9-a6e2-90d5a102fd2a.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"エンジニアの集会場_v3","id":"wrld_585f45ea-c6a6-4ba5-ad6a-188dd822f574","instanceId":"wrld_585f45ea-c6a6-4ba5-ad6a-188dd822f574:27977~group(grp_5a802e77-a436-491a-9edb-39fca4ff7805)~groupAccessType(plus)~region(jp)"},"players":[{"id":"usr_35dd8b42-48c4-4735-b946-19c13ac6dc55","displayName":"ゆにSub"},{"id":"usr_0bcf7862-ecec-45c5-a9a7-f21ef9ab456c","displayName":"WhiteStew"},{"id":"usr_c176edff-deab-42ea-aef2-fcc1d5faa776","displayName":"Dendrite_"},{"id":"usr_90cb7714-3f4f-4c0f-81cd-f83cc181e472","displayName":"kebiso"},{"id":"usr_5a64db9b-e233-4280-804e-0e9c9df6f04e","displayName":"zin3"},{"id":"usr_e69e27ce-886e-4973-b20b-854704eb7c7d","displayName":"冬華_蕐"},{"id":"usr_13848f08-591a-4d32-867f-0644d07a8871","displayName":"noether"},{"id":"usr_4a74b4eb-72b4-443b-bab5-c682661a1f89","displayName":"yuniruyuni"},{"id":"usr_e07ef3d4-0b57-4b56-873e-a11eae6b31a7","displayName":"青っぽい猫"},{"id":"usr_85e6a43e-388f-4f6b-9b36-b3afe6c1a861","displayName":"IgnitionPlug"},{"id":"usr_69c62a05-1288-4daa-ba85-33a5a5273438","displayName":"しらかわ（Shirakawa）"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_34af008b-9122-4b1c-a26c-8f914b60f235","displayName":"鉄道・関西大好き提督"},{"id":"usr_97be8795-313a-4ee7-9b26-632426ab0f56","displayName":"yaito3014"},{"id":"usr_4b749411-dbae-401c-8ed5-9490c02507f2","displayName":"すぱっしゅ"},{"id":"usr_7d24eeca-2652-425f-a866-3331c42c2e53","displayName":"SoraAkatuki"},{"id":"usr_2d99074d-b877-43b3-9a1f-311e85976aa8","displayName":"Ryoukyokutan"}]}	thumbnails/2ce79da9-fd71-4bbc-9911-04b5d5eda1c5.webp	2025-06-24 11:51:00.112123+00
4	1	VRChat_2025-06-22_23-51-31.547_3840x2160.png	cc4f0450-04cd-4fe2-89e0-eb5a23da1ea7.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/ef8a4163-90e2-421e-b4e2-c2d81c757936.webp	2025-06-24 11:51:00.112123+00
5	1	VRChat_2025-06-22_23-51-39.226_3840x2160.png	51e72680-2a0e-475f-89ca-f3ec4b394d99.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/89455a7f-fa24-46c6-8ac9-2c83970fa166.webp	2025-06-24 11:51:00.112123+00
6	1	VRChat_2025-06-22_23-52-03.116_3840x2160.png	1c1bb59b-e96c-4f21-8924-6276f37c8818.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/aab9b196-262f-4b07-8637-a018d1204a5d.webp	2025-06-24 11:51:00.112123+00
7	1	VRChat_2025-06-22_23-52-18.525_3840x2160.png	64f5f152-9208-4a26-b371-5d970342d49a.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/cf121483-554b-49f6-999d-c2907a33f896.webp	2025-06-24 11:51:00.112123+00
8	1	VRChat_2025-06-23_01-52-54.791_3840x2160.png	d3ee9c5a-678f-4d47-ae8a-e5bc50af2d70.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"バーチャル山岡家(非公式)","id":"wrld_60e4d706-0768-43e9-b180-e636bbe70e33","instanceId":"wrld_60e4d706-0768-43e9-b180-e636bbe70e33:31226~hidden(usr_f91f46e6-f436-4b22-a1b9-9859c24a94e2)~region(jp)"},"players":[{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_f91f46e6-f436-4b22-a1b9-9859c24a94e2","displayName":"nemmmzzzzz"}]}	thumbnails/b96762f1-e6b0-46d6-ae27-e9a22e23d9c6.webp	2025-06-24 11:51:00.112123+00
9	2	VRChat_2025-06-14_01-55-09.029_3840x2160.png	4347c38a-c9ee-443b-ba95-c22d3554f0d0.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"The Great Plateau - Zelda: Breath of the Wild","id":"wrld_fd1b10c7-fac1-45fd-adf2-53f9a30e032d","instanceId":"wrld_fd1b10c7-fac1-45fd-adf2-53f9a30e032d:45063~friends(usr_520782fd-384d-4a7b-bab4-6a268183933a)~region(jp)"},"players":[{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_e8dad3d2-9f94-4d1a-9aaf-f9ed44d3a039","displayName":"findmap0"}]}	thumbnails/76c4aed6-0e9b-4d52-af50-c3ee15929189.webp	2025-06-24 11:54:40.982983+00
10	2	VRChat_2025-06-21_01-22-57.623_3840x2160.png	be31a06b-a2ae-42d7-86c8-8f286577d088.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"エンジニアの集会場_v3","id":"wrld_585f45ea-c6a6-4ba5-ad6a-188dd822f574","instanceId":"wrld_585f45ea-c6a6-4ba5-ad6a-188dd822f574:27977~group(grp_5a802e77-a436-491a-9edb-39fca4ff7805)~groupAccessType(plus)~region(jp)"},"players":[{"id":"usr_35dd8b42-48c4-4735-b946-19c13ac6dc55","displayName":"ゆにSub"},{"id":"usr_0bcf7862-ecec-45c5-a9a7-f21ef9ab456c","displayName":"WhiteStew"},{"id":"usr_c176edff-deab-42ea-aef2-fcc1d5faa776","displayName":"Dendrite_"},{"id":"usr_90cb7714-3f4f-4c0f-81cd-f83cc181e472","displayName":"kebiso"},{"id":"usr_5a64db9b-e233-4280-804e-0e9c9df6f04e","displayName":"zin3"},{"id":"usr_e69e27ce-886e-4973-b20b-854704eb7c7d","displayName":"冬華_蕐"},{"id":"usr_13848f08-591a-4d32-867f-0644d07a8871","displayName":"noether"},{"id":"usr_4a74b4eb-72b4-443b-bab5-c682661a1f89","displayName":"yuniruyuni"},{"id":"usr_e07ef3d4-0b57-4b56-873e-a11eae6b31a7","displayName":"青っぽい猫"},{"id":"usr_85e6a43e-388f-4f6b-9b36-b3afe6c1a861","displayName":"IgnitionPlug"},{"id":"usr_69c62a05-1288-4daa-ba85-33a5a5273438","displayName":"しらかわ（Shirakawa）"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_34af008b-9122-4b1c-a26c-8f914b60f235","displayName":"鉄道・関西大好き提督"},{"id":"usr_97be8795-313a-4ee7-9b26-632426ab0f56","displayName":"yaito3014"},{"id":"usr_4b749411-dbae-401c-8ed5-9490c02507f2","displayName":"すぱっしゅ"},{"id":"usr_7d24eeca-2652-425f-a866-3331c42c2e53","displayName":"SoraAkatuki"},{"id":"usr_2d99074d-b877-43b3-9a1f-311e85976aa8","displayName":"Ryoukyokutan"}]}	thumbnails/356f4a16-63a1-4143-84a9-903e4ddf918f.webp	2025-06-24 11:54:40.982983+00
11	2	VRChat_2025-06-22_23-51-31.547_3840x2160.png	45e18b2b-eec2-4aed-bab9-87bb6ff5de61.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/794024bf-47a5-46d3-a9c4-dbe228e95217.webp	2025-06-24 11:54:40.982983+00
12	2	VRChat_2025-06-22_23-51-39.226_3840x2160.png	2efe364c-4d39-4cfb-8a17-416a9edf560e.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/aede6d09-6743-4685-8f1f-0eced617df5c.webp	2025-06-24 11:54:40.982983+00
13	2	VRChat_2025-06-22_23-52-03.116_3840x2160.png	9df40bbc-f899-47d3-819a-afb2286af35d.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/efac1d55-aca8-49c4-8534-09a83713621a.webp	2025-06-24 11:54:40.982983+00
14	2	VRChat_2025-06-22_23-52-18.525_3840x2160.png	f87bfe43-86d9-49d3-a06e-5ef4a9840b1a.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"星と、誕生と。","id":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3","instanceId":"wrld_e7b0876f-a839-46ac-bd23-6b8648b566a3:50923~hidden(usr_fe2752d2-9202-4014-a6db-22db4ccad300)~region(jp)~nonce(20ce7055-c4c5-4f9e-a640-9eab6935ed33)"},"players":[{"id":"usr_99ace72f-cecd-4ad7-a9a4-4160c6e4d9de","displayName":"白沼＿緋"},{"id":"usr_4a9b0399-a5d2-45c6-89da-4ddfab36c096","displayName":"domokuma"},{"id":"usr_520782fd-384d-4a7b-bab4-6a268183933a","displayName":"momoron"},{"id":"usr_5550f2be-3f59-40a0-a30d-91001dc156e6","displayName":"tera 724"},{"id":"usr_fe2752d2-9202-4014-a6db-22db4ccad300","displayName":"K1eD5"},{"id":"usr_cce2386b-f23a-4e4f-8598-d7d21e5cc201","displayName":"よつはる"},{"id":"usr_77adea27-5536-4136-8f8c-86d4ee646d8e","displayName":"Shirayuki9"},{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"}]}	thumbnails/b3f803fa-c02f-4e92-9894-d0037c015d9e.webp	2025-06-24 11:54:40.982983+00
15	2	VRChat_2025-06-23_01-52-54.791_3840x2160.png	4b0f6502-17fc-4b7b-9a4e-4b6724bface0.png	{"application":"VRCX","version":1,"author":{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},"world":{"name":"バーチャル山岡家(非公式)","id":"wrld_60e4d706-0768-43e9-b180-e636bbe70e33","instanceId":"wrld_60e4d706-0768-43e9-b180-e636bbe70e33:31226~hidden(usr_f91f46e6-f436-4b22-a1b9-9859c24a94e2)~region(jp)"},"players":[{"id":"usr_3294214e-e706-4455-93ce-2ba7dd4d8cec","displayName":"harutiro"},{"id":"usr_f91f46e6-f436-4b22-a1b9-9859c24a94e2","displayName":"nemmmzzzzz"}]}	thumbnails/d6ca596b-5bc0-4f08-97b5-a29c6d95c5e3.webp	2025-06-24 11:54:40.982983+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (version, applied_at) FROM stdin;
001_initial_schema	2025-06-24 12:15:48.026035+00
\.


--
-- Name: albums_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.albums_id_seq', 2, true);


--
-- Name: photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.photos_id_seq', 15, true);


--
-- Name: albums albums_custom_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_custom_id_key UNIQUE (custom_id);


--
-- Name: albums albums_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: photos photos_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

