// ==========================================
// 🚀 Supabase 設定
// ==========================================
// config.js から変数を読み込む
let supabase = null;
if (
	typeof SUPABASE_URL !== 'undefined' &&
	typeof SUPABASE_KEY !== 'undefined' &&
	SUPABASE_URL.startsWith('http')
) {
	supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
	console.warn('config.js が読み込まれてへんかも？確認してな！');
}

const POSTS_PER_PAGE = 6;
let currentPage = 1;
let currentCategory = null;
let currentSearch = null;

// 以下、機能はそのまま
function toggleMenu() {
	const menu = document.getElementById('mobile-menu');
	menu.classList.toggle('translate-x-full');
}

function getQueryParam(param) {
	const urlParams = new URLSearchParams(window.location.search);
	return urlParams.get(param);
}

// ダークモード
function toggleDarkMode() {
	document.body.classList.toggle('dark');
	localStorage.setItem(
		'omu_theme',
		document.body.classList.contains('dark') ? 'dark' : 'light'
	);
	updateThemeIcon(document.body.classList.contains('dark'));
}

function initTheme() {
	const savedTheme = localStorage.getItem('omu_theme');
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
		document.body.classList.add('dark');
		updateThemeIcon(true);
	} else {
		updateThemeIcon(false);
	}
}

function updateThemeIcon(isDark) {
	const btn = document.getElementById('theme-toggle-btn');
	if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// データ取得
async function fetchPosts(page = 1, category = null, search = null) {
	if (!supabase) return { data: [], count: 0 };

	const start = (page - 1) * POSTS_PER_PAGE;
	const end = start + POSTS_PER_PAGE - 1;

	let query = supabase
		.from('posts')
		.select('*', { count: 'exact' })
		.eq('status', 'published') // 公開済みのみ！
		.order('id', { ascending: false })
		.range(start, end);

	if (category) query = query.eq('category', category);
	if (search)
		query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);

	const { data, error, count } = await query;
	if (error) {
		console.error('Error:', error);
		return { data: [], count: 0 };
	}
	return { data, count };
}

async function fetchCategories() {
	if (!supabase) return [];
	const { data } = await supabase
		.from('posts')
		.select('category')
		.eq('status', 'published');
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

// 画面表示
const loadingHtml = `<div class="col-span-full loading-container"><div class="relative"><span class="loading-steam">♨️</span><div class="loading-pan">🍳</div></div><p class="loading-text">COOKING...</p></div>`;

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

async function renderCategories() {
	const container = document.getElementById('category-list');
	if (!container) return;
	const categories = await fetchCategories();
	let html = `<button onclick="filterCategory(null)" class="category-btn border-2 border-omu-egg px-5 py-2 rounded-full font-bold text-sm shadow-sm ${
		!currentCategory
			? 'active bg-omu-egg text-white'
			: 'bg-white text-omu-demi hover:bg-omu-egg-light'
	}">All</button>`;
	categories.forEach((cat) => {
		const isActive = currentCategory === cat;
		html += `<button onclick="filterCategory('${cat}')" class="category-btn border-2 border-omu-egg px-5 py-2 rounded-full font-bold text-sm shadow-sm ${
			isActive
				? 'active bg-omu-egg text-white'
				: 'bg-white text-omu-demi hover:bg-omu-egg-light'
		}">${cat}</button>`;
	});
	container.innerHTML = html;
}

async function renderPosts() {
	const container = document.getElementById('blog-posts-container');
	if (!container) return;
	if (!supabase) {
		container.innerHTML =
			'<div class="col-span-full text-red-500 text-center">Config Error</div>';
		return;
	}

	container.innerHTML = loadingHtml;

	const urlParams = new URLSearchParams(window.location.search);
	currentPage = parseInt(urlParams.get('page')) || 1;
	currentCategory = urlParams.get('category');
	currentSearch = urlParams.get('search');
	updateListHeader();

	await new Promise((r) => setTimeout(r, 500));

	const { data: posts, count } = await fetchPosts(
		currentPage,
		currentCategory,
		currentSearch
	);

	if (posts.length === 0) {
		container.innerHTML =
			'<div class="col-span-full text-center text-gray-400 py-10">記事がありません🍳</div>';
		updatePagination(0);
		return;
	}

	let html = '';
	posts.forEach((post) => {
		html += `
        <article class="blog-card bg-white rounded-[30px] overflow-hidden shadow-sm border border-gray-100 flex flex-col h-full scroll-fade-up">
            <a href="article.html?id=${
							post.id
						}" class="block h-full flex flex-col">
                <div class="relative h-56 bg-gray-200 overflow-hidden">
                    <div class="w-full h-full ${
											post.color_class || 'bg-omu-egg-light'
										} flex items-center justify-center ${
			post.emoji_class || 'text-4xl'
		}">${post.emoji}</div>
                    <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-omu-demi shadow-sm">${
											post.category
										}</span>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <div class="flex items-center gap-2 text-xs text-gray-400 mb-3 font-bold"><span>${
											post.date
										}</span><span>•</span><span>Anju</span></div>
                    <h4 class="font-title text-xl font-bold mb-3 leading-snug group-hover:text-omu-ketchup transition-colors">${
											post.title
										}</h4>
                    <p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">${
											post.excerpt
										}</p>
                    <div class="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center"><span class="text-sm font-bold text-omu-ketchup hover:underline">READ MORE →</span></div>
                </div>
            </a>
        </article>`;
	});
	container.innerHTML = html;
	setupScrollReveal();
	updatePagination(count);
	renderCategories();
}

// その他の関数（updateListHeader, updatePagination, filterCategory...）は省略せずに全部書くと長すぎるので、
// 既存のままでOKやけど、大事なのは `supabase` クライアントの作り方が変わったところや！
// 以前の `script.js` の関数たちはそのまま使えるで！

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
		titleEl.textContent = `${currentCategory}`;
	} else {
		labelEl.textContent = 'Recent Posts';
		titleEl.textContent = '最新の記事';
	}
}

function updatePagination(totalCount) {
	const area = document.getElementById('pagination-area');
	if (!area) return;
	if (totalCount === 0) {
		area.classList.add('hidden');
		return;
	}
	area.classList.remove('hidden');
	const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
	document.getElementById('current-page').textContent = currentPage;
	document.getElementById('total-pages').textContent = totalPages;
	document.getElementById('prev-btn').disabled = currentPage <= 1;
	document.getElementById('next-btn').disabled = currentPage >= totalPages;
}

window.filterCategory = function (category) {
	const url = new URL(window.location);
	if (category) url.searchParams.set('category', category);
	else url.searchParams.delete('category');
	url.searchParams.delete('search');
	url.searchParams.set('page', 1);
	window.location.href = url.toString();
};

window.searchArticles = function () {
	const val = document.getElementById('search-input').value.trim();
	const url = new URL(window.location);
	if (val) {
		url.searchParams.set('search', val);
		url.searchParams.delete('category');
	} else url.searchParams.delete('search');
	url.searchParams.set('page', 1);
	window.location.href = url.toString();
};

document.getElementById('search-input')?.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') searchArticles();
});
window.changePage = function (d) {
	const url = new URL(window.location);
	url.searchParams.set('page', currentPage + d);
	window.location.href = url.toString();
};

function setupScrollReveal() {
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry, i) => {
				if (entry.isIntersecting) {
					setTimeout(() => {
						entry.target.classList.add('is-show');
					}, i * 100);
					observer.unobserve(entry.target);
				}
			});
		},
		{ rootMargin: '0px', threshold: 0.1 }
	);
	document
		.querySelectorAll('.scroll-fade-up')
		.forEach((t) => observer.observe(t));
}

function generateTOC() {
	const postBody = document.getElementById('post-body');
	const tocContainer = document.getElementById('toc-container');
	if (!postBody || !tocContainer) return;
	const headers = postBody.querySelectorAll('h2, h3');
	if (headers.length === 0) {
		tocContainer.classList.add('hidden');
		return;
	}
	let html = '<div class="toc-title">🥚 目次</div><ul class="toc-list">';
	headers.forEach((h, i) => {
		if (!h.id) h.id = `section-${i}`;
		const cls = h.tagName.toLowerCase() === 'h3' ? 'toc-indent' : '';
		html += `<li class="${cls}"><a href="#${h.id}">${h.textContent}</a></li>`;
	});
	tocContainer.innerHTML = html + '</ul>';
	tocContainer.classList.remove('hidden');
}

function addCopyButtons() {
	document.querySelectorAll('pre').forEach((pre) => {
		if (pre.parentNode.classList.contains('code-block-wrapper')) return;
		const wrapper = document.createElement('div');
		wrapper.className = 'code-block-wrapper';
		pre.parentNode.insertBefore(wrapper, pre);
		wrapper.appendChild(pre);
		const btn = document.createElement('button');
		btn.className = 'copy-code-btn';
		btn.innerText = 'Copy';
		btn.onclick = () => {
			navigator.clipboard.writeText(pre.innerText).then(() => {
				btn.innerText = 'Copied!';
				setTimeout(() => (btn.innerText = 'Copy'), 2000);
			});
		};
		wrapper.appendChild(btn);
	});
}

async function renderArticle() {
	const articleContent = document.getElementById('article-content');
	if (!articleContent) return;
	const id = getQueryParam('id');
	if (!id) {
		document.getElementById('not-found').classList.remove('hidden');
		return;
	}

	articleContent.classList.remove('hidden');
	document.getElementById('post-body').innerHTML = loadingHtml;
	await new Promise((r) => setTimeout(r, 500));

	const post = await fetchPostById(id);
	if (post) {
		articleContent.classList.add('animate-fade-in');
		document.getElementById('post-title').textContent = post.title;
		document.getElementById('post-category').textContent = post.category;
		document.getElementById('post-date').textContent = post.date;
		document.getElementById('post-emoji').textContent = post.emoji;
		document.getElementById(
			'post-bg'
		).className = `relative w-full h-64 md:h-80 rounded-[40px] mb-12 flex items-center justify-center overflow-hidden shadow-sm ${
			post.color_class || 'bg-omu-egg-light'
		}`;
		document.getElementById('post-body').innerHTML = post.content;

		generateTOC();
		addCopyButtons();
		updateMetaTags(post.title, post.excerpt);
		if (window.Prism) Prism.highlightAll();
	} else {
		articleContent.classList.add('hidden');
		document.getElementById('not-found').classList.remove('hidden');
	}
}

window.onload = function () {
	initTheme();
	renderPosts();
	renderArticle();
};
