// ==========================================
// 🚀 Supabase 設定エリア
// ==========================================
// ① ここにProject URLを貼り付けてね！
const SUPABASE_URL = 'https://msiaoywvnnudwywmimjf.supabase.co';

// ② ここにAnon Keyを貼り付けてね！
const SUPABASE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaWFveXd2bm51ZHd5d21pbWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTAxOTEsImV4cCI6MjA3OTM2NjE5MX0.1OQF6zmEZBL4mmsmQcwc_3LuP7bHllacwejlb9dsNzg';

// Supabaseのクライアント（接続係）を作成
// ここで window.supabase があるかチェックしてるんやけど、
// article.html にスクリプトがないと null になっちゃうねん💦
const supabase = window.supabase
	? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
	: null;

// モバイルメニューの切り替え
function toggleMenu() {
	const menu = document.getElementById('mobile-menu');
	menu.classList.toggle('translate-x-full');
}

// URLからパラメータ(?id=1 とか)を取得する関数
function getQueryParam(param) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(param);
}

// ==========================================
// 📝 記事データを取得する関数
// ==========================================
async function fetchPosts() {
	if (!supabase) return [];

	const { data, error } = await supabase
		.from('posts')
		.select('*')
		.order('id', { ascending: false });

	if (error) {
		console.error('一覧の取得エラー:', error);
		return [];
	}
	return data;
}

// 単一の記事を取得する関数
async function fetchPostById(id) {
	if (!supabase) {
		alert(
			'大変！！article.html に Supabaseの道具箱（スクリプト）が入ってないみたい！💦\n\narticle.html の <head> の中を確認してな！'
		);
		return null;
	}

	console.log('探しているID:', id);

	const { data, error } = await supabase
		.from('posts')
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		alert(
			'事件発生！記事が見つからない原因はこれや！\n\n' +
				error.message +
				'\n\n(コード: ' +
				error.code +
				')'
		);
		console.error('詳細エラー:', error);
		return null;
	}
	return data;
}

// ==========================================
// 🎨 画面に表示する関数
// ==========================================

async function renderPosts() {
	const container = document.getElementById('blog-posts-container');
	if (!container) return;

	if (!supabase) {
		container.innerHTML =
			'<div class="col-span-full text-center text-red-500 font-bold">⚠️ index.html に Supabaseのスクリプトタグがないかも！確認して！</div>';
		return;
	}

	const posts = await fetchPosts();

	if (posts.length === 0) {
		container.innerHTML =
			'<div class="col-span-full text-center text-gray-400">記事が読み込めないみたい...URLとKEY合ってる？🤔</div>';
		return;
	}

	let html = '';
	// ✨ ここ変更！index (i) を使って、アニメーションの遅延時間を計算するで！
	posts.forEach((post, index) => {
		const colorClass =
			post.color_class || post.colorClass || 'bg-omu-egg-light';
		const emojiClass = post.emoji_class || post.emojiClass || 'text-4xl';

		// 0.1秒ずつ遅らせる (max 0.5秒くらいまで)
		const delay = Math.min(index * 0.1, 0.5);

		html += `
        <article class="blog-card bg-white rounded-[30px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full animate-slide-up" style="animation-delay: ${delay}s">
            <a href="article.html?id=${post.id}" class="block h-full flex flex-col">
                <div class="relative h-56 bg-gray-200 overflow-hidden">
                    <div class="w-full h-full ${colorClass} flex items-center justify-center ${emojiClass}">${post.emoji}</div>
                    <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-omu-demi shadow-sm">
                        ${post.category}
                    </span>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center gap-2 text-xs text-gray-400 mb-3 font-bold">
                        <span>${post.date}</span>
                        <span>•</span>
                        <span>Anju</span>
                    </div>
                    <h4 class="font-title text-xl font-bold mb-3 leading-snug group-hover:text-omu-ketchup transition-colors">
                        ${post.title}
                    </h4>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                        ${post.excerpt}
                    </p>
                    <div class="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-sm font-bold text-omu-ketchup hover:underline">READ MORE →</span>
                    </div>
                </div>
            </a>
        </article>
        `;
	});
	container.innerHTML = html;
}

async function renderArticle() {
	const articleContent = document.getElementById('article-content');
	if (!articleContent) return;

	const id = getQueryParam('id');
	if (!id) {
		document.getElementById('not-found').classList.remove('hidden');
		return;
	}

	const post = await fetchPostById(id);

	if (post) {
		// ✨ ここ変更！記事全体をふわっと表示させるクラスを追加！
		articleContent.classList.remove('hidden');
		articleContent.classList.add('animate-fade-in');

		document.getElementById('post-title').textContent = post.title;
		document.getElementById('post-category').textContent = post.category;
		document.getElementById('post-date').textContent = post.date;
		document.getElementById('post-emoji').textContent = post.emoji;

		const bgElement = document.getElementById('post-bg');
		const colorClass =
			post.color_class || post.colorClass || 'bg-omu-egg-light';
		bgElement.classList.add(colorClass);

		document.getElementById('post-body').innerHTML = post.content;
		document.title = `${post.title} | OmuOmu Life`;
	} else {
		document.getElementById('not-found').classList.remove('hidden');
	}
}

window.onload = function () {
	renderPosts();
	renderArticle();
};
