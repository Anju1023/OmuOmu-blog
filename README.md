# 🍳 OmuOmu Life (Blog Project)

オムライスカラーの「美味しくておしゃれな」雑多ブログサイトです。
カフェ巡りからプログラミングまで、好きなことを自由に発信するために作りました！

## ✨ 特徴

- **🎨 オムライスデザイン**: ふわとろ卵（イエロー）とケチャップ（レッド）を基調とした可愛い UI。
- **📱 完全レスポンシブ**: スマホでも PC でも見やすいデザイン。
- **💻 テックブログ対応**: Prism.js によるシンタックスハイライトで、コードブロックも黒板風におしゃれに表示。
- **📝 Markdown 投稿**: 専用の投稿ツール (`create_tool.html`) を使って、Markdown でサクサク記事作成。
- **☁️ Supabase 連携**: 記事データと画像ストレージに Supabase を使用。サーバーレスで運用。
- **🔍 SEO 対策**: 記事ごとにタイトルや meta description を自動で書き換え。
- **✨ アニメーション**: スクロールに合わせて記事がふわっと浮き上がるリッチな体験。

## 🛠 技術スタック

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (CDN)
- **Backend (BaaS)**: [Supabase](https://supabase.com/) (Database, Auth, Storage)
- **Libraries**:
  - [Prism.js](https://prismjs.com/) (Syntax Highlighter)
  - [Marked.js](https://marked.js.org/) (Markdown Parser)
  - [Google Fonts](https://fonts.google.com/) (Kiwi Maru, M PLUS Rounded 1c)

## 🚀 ディレクトリ構成

```
omublog/
├── index.html # トップページ（記事一覧）
├── article.html # 記事詳細ページ（動的生成）
├── about.html # 自己紹介ページ
├── create_tool.html # 記事投稿・管理ツール (※ローカル専用・非公開)
├── css/
│ └── style.css # カスタムスタイル・アニメーション定義
└── js/
└── script.js # Supabase 連携・UI ロジック
```

## ⚙️ セットアップ手順 (自分用メモ)

### 1. Supabase の設定

1.  **プロジェクト作成**: Supabase で新規プロジェクトを作成。
2.  **テーブル作成 (`posts`)**:
    - カラム: `id` (int8), `title`, `date`, `category`, `emoji`, `excerpt`, `color_class`, `emoji_class`, `content` (他は text)
3.  **ストレージ作成 (`images`)**:
    - Public bucket として作成。
4.  **RLS ポリシー (セキュリティ) 設定**:
    - `posts` テーブル & `images` ストレージ:
      - **SELECT (見る)**: 全員許可 (`anon`)
      - **INSERT (書く)**: 認証済みユーザーのみ許可 (`authenticated`)
5.  **ユーザー作成**: Authentication から投稿用のアカウントを作成。

### 2. コードの設定

以下のファイルの `SUPABASE_URL` と `SUPABASE_KEY` を、プロジェクトのものに書き換えます。

- `js/script.js` (公開用: Anon Key を使用)
- `create_tool.html` (投稿用: Anon Key を使用)

## 📝 記事の投稿方法

1.  `create_tool.html` をブラウザで開きます（ローカル環境で OK）。
2.  左上のフォームに、Supabase で登録した**メールアドレス**と**パスワード**を入力してログイン状態にします。
3.  記事の内容を入力します（Markdown 記法対応）。
    - `📷 アップロード` ボタンで画像の挿入も可能です。
4.  **「🚀 投稿する！」** ボタンを押すと、ブログに即時反映されます。

## ⚠️ 注意事項

- **`create_tool.html` は GitHub にアップロードしないでください！**
  - 誰でも投稿できる状態を防ぐため、このファイルはローカル（自分の PC）のみで管理します。
  - `.gitignore` に追加するか、手動で管理してください。

## 👤 Author

**Anju**

- Blog: OmuOmu Life
- Likes: 🍳 Omu-rice, ☕️ Cafe, 🎮 Game, 💻 Programming
