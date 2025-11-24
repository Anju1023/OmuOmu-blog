// ==========================================
// 🚀 Supabase 設定エリア
// ==========================================
// ① ここにProject URLを貼り付けてね！
const SUPABASE_URL = 'https://msiaoywvnnudwywmimjf.supabase.co';

// ② ここにAnon Keyを貼り付けてね！
const SUPABASE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zaWFveXd2bm51ZHd5d21pbWpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTAxOTEsImV4cCI6MjA3OTM2NjE5MX0.1OQF6zmEZBL4mmsmQcwc_3LuP7bHllacwejlb9dsNzg';

// Supabaseのクライアント
const supabase = window.supabase
	? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
	: null;

// 設定
const POSTS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = null;
let currentSearch = null;

// モバイルメニュー
function toggleMenu() {
	const menu = document.getElementById('mobile-menu');
	menu.classList.toggle('translate-x-full');
}

// URLパラメータ取得
function getQueryParam(param) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(param);
}

// ==========================================
// ✨ ローディング表示用のHTML
// ==========================================
const loadingHtml = `
    <div class="col-span-full loading-container">
        <div class="relative">
            <span class="loading-steam">♨️</span>
            <span class="loading-steam">♨️</span>
            <span class="loading-steam">♨️</span>
            <div class="loading-pan">🍳</div>
        </div>
        <p class="loading-text">COOKING...</p>
    </div>
`;

// ==========================================
// 📝 データ取得関数
// ==========================================
async function fetchPosts(page = 1, category = null, search = null) {
	if (!supabase) return { data: [], count: 0 };

	const start = (page - 1) * POSTS_PER_PAGE;
	const end = start + POSTS_PER_PAGE - 1;

	let query = supabase
		.from('posts')
		.select('*', { count: 'exact' })
		.eq('status', 'published')
		.order('id', { ascending: false })
		.range(start, end);

	if (category) query = query.eq('category', category);
	if (search)
		query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);

	const { data, error, count } = await query;

	if (error) {
		console.error('一覧取得エラー:', error);
		return { data: [], count: 0 };
	}
	return { data, count };
}

async function fetchCategories() {
	if (!supabase) return [];
	const { data, error } = await supabase
		.from('posts')
		.select('category')
		.eq('status', 'published');
	if (error) return [];
	return [...new Set(data.map((item) => item.category))];
}

async function fetchPostById(id) {
	if (!supabase) return null;
	const { data, error } = await supabase
		.from('posts')
		.select('*')
		.eq('id', id)
		.single();
	if (error) return null;
	return data;
}

// ==========================================
// 🎨 画面表示 & 機能追加
// ==========================================

function updateMetaTags(title, description) {
	document.title = `${title} | OmuOmu Life`;
	let metaDesc = document.querySelector('meta[name="description"]');
	if (!metaDesc) {
		metaDesc = document.createElement('meta');
		metaDesc.name = 'description';
		document.head.appendChild(metaDesc);
	}
	metaDesc.content = description;
}

// ✨ 自動目次生成関数 (New!)
function generateTOC() {
	const postBody = document.getElementById('post-body');
	const tocContainer = document.getElementById('toc-container');
	if (!postBody || !tocContainer) return;

	// 本文内の h2, h3 を探す
	const headers = postBody.querySelectorAll('h2, h3');

	if (headers.length === 0) {
		tocContainer.classList.add('hidden'); // 見出しがなければ目次エリアを隠す
		return;
	}

	let tocHtml = '<div class="toc-title">🥚 目次</div><ul class="toc-list">';

	headers.forEach((header, index) => {
		// IDがなければ付与する (リンク用)
		if (!header.id) {
			header.id = `section-${index}`;
		}

		const isH3 = header.tagName.toLowerCase() === 'h3';
		const indentClass = isH3 ? 'toc-indent' : '';
		const title = header.textContent;

		tocHtml += `<li class="${indentClass}"><a href="#${header.id}">${title}</a></li>`;
	});

	tocHtml += '</ul>';

	tocContainer.innerHTML = tocHtml;
	tocContainer.classList.remove('hidden'); // 目次を表示
}

// ✨ コードコピーボタン追加関数 (New!)
function addCopyButtons() {
	const preTags = document.querySelectorAll('pre');

	preTags.forEach((pre) => {
		// 既にラッパーがあるか確認 (二重追加防止)
		if (pre.parentNode.classList.contains('code-block-wrapper')) return;

		// ラッパーを作る (ボタンを配置するため)
		const wrapper = document.createElement('div');
		wrapper.className = 'code-block-wrapper';
		pre.parentNode.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);

		// ボタンを作る
		const button = document.createElement('button');
		button.className = 'copy-code-btn';
		button.innerText = 'Copy';

		button.addEventListener('click', () => {
			const code = pre.innerText;
			navigator.clipboard.writeText(code).then(() => {
				button.innerText = 'Copied!';
				setTimeout(() => {
					button.innerText = 'Copy';
				}, 2000);
			});
		});

		wrapper.appendChild(button);
	});
}

async function renderCategories() {
	const container = document.getElementById('category-list');
	if (!container) return;
	const categories = await fetchCategories();

	let html = `
        <button onclick="filterCategory(null)" class="category-btn border-2 border-omu-egg px-5 py-2 rounded-full font-bold text-sm shadow-sm ${
					!currentCategory
						? 'active bg-omu-egg text-white'
						: 'bg-white text-omu-demi hover:bg-omu-egg-light'
				}">All</button>
    `;
	categories.forEach((cat) => {
		const isActive = currentCategory === cat;
		const activeClass = isActive
			? 'active bg-omu-egg text-white'
			: 'bg-white text-omu-demi hover:bg-omu-egg-light';
		html += `<button onclick="filterCategory('${cat}')" class="category-btn border-2 border-omu-egg px-5 py-2 rounded-full font-bold text-sm shadow-sm ${activeClass}">${cat}</button>`;
	});
	container.innerHTML = html;
}

async function renderPosts() {
	const container = document.getElementById('blog-posts-container');
	if (!container) return;

	if (!supabase) {
		container.innerHTML =
			'<div class="col-span-full text-center text-red-500 font-bold">Supabase設定エラー</div>';
		return;
	}

	container.innerHTML = loadingHtml;

	const urlParams = new URLSearchParams(window.location.search);
	currentPage = parseInt(urlParams.get('page')) || 1;
	currentCategory = urlParams.get('category');
	currentSearch = urlParams.get('search');

	updateListHeader();

	await new Promise((resolve) => setTimeout(resolve, 500));

	const { data: posts, count } = await fetchPosts(
		currentPage,
		currentCategory,
		currentSearch
	);

	if (posts.length === 0) {
		container.innerHTML =
			'<div class="col-span-full text-center text-gray-400 py-10">記事が見つからへんかった…🐣<br>別の言葉で探してみて！</div>';
		updatePagination(0);
		return;
	}

	let html = '';
	posts.forEach((post, index) => {
		const colorClass =
			post.color_class || post.colorClass || 'bg-omu-egg-light';
		const emojiClass = post.emoji_class || post.emojiClass || 'text-4xl';

		html += `
        <article class="blog-card bg-white rounded-[30px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full scroll-fade-up">
            <a href="article.html?id=${post.id}" class="block h-full flex flex-col">
                <div class="relative h-56 bg-gray-200 overflow-hidden">
                    <div class="w-full h-full ${colorClass} flex items-center justify-center ${emojiClass}">${post.emoji}</div>
                    <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-omu-demi shadow-sm">${post.category}</span>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center gap-2 text-xs text-gray-400 mb-3 font-bold"><span>${post.date}</span><span>•</span><span>Anju</span></div>
                    <h4 class="font-title text-xl font-bold mb-3 leading-snug group-hover:text-omu-ketchup transition-colors">${post.title}</h4>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">${post.excerpt}</p>
                    <div class="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-sm font-bold text-omu-ketchup hover:underline">READ MORE →</span>
                    </div>
                </div>
            </a>
        </article>
        `;
	});
	container.innerHTML = html;

	setupScrollReveal();
	updatePagination(count);
	renderCategories();
}

function updateListHeader() {
	const titleEl = document.getElementById('list-title');
	const labelEl = document.getElementById('list-label');
	const searchInput = document.getElementById('search-input');
	if (!titleEl) return;

	if (currentSearch) {
		labelEl.textContent = 'Search Result';
		titleEl.textContent = `「${currentSearch}」の検索結果`;
		if (searchInput) searchInput.value = currentSearch;
	} else if (currentCategory) {
		labelEl.textContent = 'Category';
		titleEl.textContent = `${currentCategory} の記事`;
	} else {
		labelEl.textContent = 'Recent Posts';
		titleEl.textContent = '最新の記事';
	}
}

function updatePagination(totalCount) {
	const prevBtn = document.getElementById('prev-btn');
	const nextBtn = document.getElementById('next-btn');
	const currentEl = document.getElementById('current-page');
	const totalEl = document.getElementById('total-pages');
	const area = document.getElementById('pagination-area');
	if (!area) return;

	if (totalCount === 0) {
		area.classList.add('hidden');
		return;
	}
	area.classList.remove('hidden');

	const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
	currentEl.textContent = currentPage;
	totalEl.textContent = totalPages;
	prevBtn.disabled = currentPage <= 1;
	nextBtn.disabled = currentPage >= totalPages;
}

// 操作系
window.filterCategory = function (category) {
	const url = new URL(window.location);
	if (category) url.searchParams.set('category', category);
	else url.searchParams.delete('category');
	url.searchParams.delete('search');
	url.searchParams.set('page', 1);
	window.location.href = url.toString();
};

window.searchArticles = function () {
	const input = document.getElementById('search-input');
	const keyword = input.value.trim();
	const url = new URL(window.location);
	if (keyword) {
		url.searchParams.set('search', keyword);
		url.searchParams.delete('category');
	} else {
		url.searchParams.delete('search');
	}
	url.searchParams.set('page', 1);
	window.location.href = url.toString();
};

document
	.getElementById('search-input')
	?.addEventListener('keypress', function (e) {
		if (e.key === 'Enter') searchArticles();
	});

window.changePage = function (direction) {
	const url = new URL(window.location);
	const newPage = currentPage + direction;
	url.searchParams.set('page', newPage);
	window.location.href = url.toString();
};

function setupScrollReveal() {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry, index) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						entry.target.classList.add('is-show');
					}, index * 100);
					observer.unobserve(entry.target);
				}
			});
		},
		{ rootMargin: '0px', threshold: 0.1 }
	);
	document
		.querySelectorAll('.scroll-fade-up')
		.forEach((target) => observer.observe(target));
}

async function renderArticle() {
	const articleContent = document.getElementById('article-content');
	const postBody = document.getElementById('post-body');
	if (!articleContent) return;

	const id = getQueryParam('id');
	if (!id) {
		document.getElementById('not-found').classList.remove('hidden');
		return;
	}

	articleContent.classList.remove('hidden');
	if (postBody) postBody.innerHTML = loadingHtml;

	await new Promise((resolve) => setTimeout(resolve, 500));

	const post = await fetchPostById(id);

	if (post) {
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

		// ✨ 目次生成とコピーボタン追加を実行！
		generateTOC();
		addCopyButtons();

		updateMetaTags(post.title, post.excerpt);
		setupShareButtons(post.title);
		if (window.Prism) Prism.highlightAll();
	} else {
		articleContent.classList.add('hidden');
		document.getElementById('not-found').classList.remove('hidden');
	}
}

function setupShareButtons(title) {
	const currentUrl = window.location.href;
	const shareText = encodeURIComponent(`${title} | OmuOmu Life`);
	const xBtn = document.getElementById('share-x');
	if (xBtn)
		xBtn.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`;
	const lineBtn = document.getElementById('share-line');
	if (lineBtn)
		lineBtn.href = `https://social-plugins.line.me/lineit/share?url=${currentUrl}`;
}

window.copyLink = function () {
	navigator.clipboard
		.writeText(window.location.href)
		.then(() => {
			alert('リンクをコピーしたえ〜！🍳\n友達に送ってな！');
		})
		.catch((err) => console.error('コピー失敗:', err));
};

window.onload = function () {
	renderPosts();
	renderArticle();
};
