// ==========================================
// 🚀 Supabase 設定
// ==========================================
let supabase = null;
if (
	typeof SUPABASE_URL !== 'undefined' &&
	typeof SUPABASE_KEY !== 'undefined' &&
	SUPABASE_URL.startsWith('http')
) {
	supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
	console.log('Supabaseクライアント作成完了！✨');
} else {
	alert(
		'⚠️ config.js が読み込まれてへんか、中身が空っぽかも！\njs/config.js を確認してな！'
	);
}

// Markdown設定
marked.setOptions({ breaks: true });

// 初期化
const today = new Date();
document.getElementById('in-date').value =
	today.getFullYear() +
	'.' +
	String(today.getMonth() + 1).padStart(2, '0') +
	'.' +
	String(today.getDate()).padStart(2, '0');

const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach((input) => {
	input.addEventListener('input', updatePreview);
});

// ---------------------------------------------------------
// 🔑 ログイン・ログアウト・一覧取得
// ---------------------------------------------------------
async function loginAndFetch() {
	const email = document.getElementById('login-email').value;
	const pass = document.getElementById('login-pass').value;
	if (!supabase) return alert('設定エラー！config.jsを確認して！');
	if (!email || !pass) return alert('メアドとパスワード入れて！');
	try {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password: pass,
		});
		if (error) throw error;
		document.getElementById('login-area').classList.add('hidden');
		document.getElementById('user-info').classList.remove('hidden');
		fetchPostList();
	} catch (e) {
		alert('ログイン失敗💦 ' + e.message);
	}
}

async function logout() {
	await supabase.auth.signOut();
	location.reload();
}

async function fetchPostList() {
	const listArea = document.getElementById('post-list');
	listArea.innerHTML =
		'<div class="text-center text-gray-400 text-xs py-4">読み込み中...</div>';
	const { data: posts, error } = await supabase
		.from('posts')
		.select('id, title, status, date')
		.order('id', { ascending: false });
	if (error) {
		listArea.innerHTML =
			'<div class="text-red-500 text-xs text-center">エラー発生</div>';
		return;
	}
	listArea.innerHTML = '';
	posts.forEach((post) => {
		const isDraft = post.status === 'draft';
		const statusBadge = isDraft
			? '<span class="bg-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-bold">下書き</span>'
			: '<span class="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded font-bold">公開</span>';
		const div = document.createElement('div');
		div.className =
			'admin-list-item p-3 rounded-lg cursor-pointer transition border-b border-gray-50';
		div.innerHTML = `<div class="flex justify-between items-start mb-1"><span class="font-bold text-sm text-gray-700 line-clamp-1 flex-1 mr-2">${
			post.title || '無題'
		}</span>${statusBadge}</div><div class="text-xs text-gray-400 font-mono">${
			post.date
		}</div>`;
		div.onclick = () => loadPostToEdit(post.id);
		listArea.appendChild(div);
	});
}

// ---------------------------------------------------------
// 📝 編集・新規作成
// ---------------------------------------------------------
async function loadPostToEdit(id) {
	const { data: post, error } = await supabase
		.from('posts')
		.select('*')
		.eq('id', id)
		.single();
	if (error) return alert('読み込めなかった💦');
	document.getElementById('in-id').value = post.id;
	document.getElementById('in-title').value = post.title;
	document.getElementById('in-date').value = post.date;
	document.getElementById('in-category').value = post.category;
	document.getElementById('in-emoji').value = post.emoji;
	document.getElementById('in-color').value = post.color_class;
	document.getElementById('in-excerpt').value = post.excerpt;
	document.getElementById('in-content').value = post.content;
	document.getElementById(
		'edit-mode-label'
	).textContent = `📝 ID:${post.id} を編集中`;
	document.getElementById('edit-mode-label').className =
		'text-xs font-bold bg-omu-blue text-white px-3 py-1 rounded-full shadow-sm';
	document.getElementById('btn-delete').classList.remove('hidden');
	updatePreview();
}

function createNewPost() {
	document.getElementById('in-id').value = '';
	document.getElementById('in-title').value = '';
	document.getElementById('in-content').value = '';
	document.getElementById('in-excerpt').value = '';
	document.getElementById('edit-mode-label').textContent = '🌱 新規作成モード';
	document.getElementById('edit-mode-label').className =
		'text-xs font-bold bg-omu-green text-white px-3 py-1 rounded-full shadow-sm';
	document.getElementById('btn-delete').classList.add('hidden');
	updatePreview();
}

function getPostData() {
	const markdownText = document.getElementById('in-content').value || '';
	marked.setOptions({ breaks: true });
	const htmlContent = marked.parse(markdownText);
	return {
		title: document.getElementById('in-title').value,
		date: document.getElementById('in-date').value,
		category: document.getElementById('in-category').value,
		emoji: document.getElementById('in-emoji').value,
		excerpt: document.getElementById('in-excerpt').value,
		color_class: document.getElementById('in-color').value,
		emoji_class: 'text-4xl',
		content: htmlContent,
	};
}

function updatePreview() {
	const data = getPostData();
	document.getElementById('preview-area').innerHTML = `
        <div class="text-center mb-8">
            <div class="inline-block bg-white border border-gray-100 px-3 py-1 rounded-full text-xs font-bold text-omu-ketchup shadow-sm mb-2">${
							data.category || 'Category'
						}</div>
            <h3 class="font-title text-2xl font-bold leading-tight mb-2 text-omu-demi">${
							data.title || 'Title'
						}</h3>
            <div class="text-xs text-gray-400 font-bold">${
							data.date
						} • Anju</div>
        </div>
        <div class="relative w-full h-40 rounded-2xl mb-8 flex items-center justify-center ${
					data.color_class || 'bg-gray-100'
				}">
            <div class="text-6xl">${data.emoji || '🍳'}</div>
        </div>
        <!-- ✨ id="post-body" をつけて本番CSSを適用させる！ -->
        <div id="post-body" class="text-omu-demi text-sm leading-relaxed">
            ${data.content}
        </div>
    `;
	if (window.Prism)
		Prism.highlightAllUnder(document.getElementById('preview-area'));
}

// ---------------------------------------------------------
// 🛠 ツール機能 (挿入・アップロード)
// ---------------------------------------------------------
function insertTag(start, end) {
	const textarea = document.getElementById('in-content');
	const s = textarea.selectionStart;
	const e = textarea.selectionEnd;
	const v = textarea.value;
	textarea.value =
		v.substring(0, s) + start + v.substring(s, e) + end + v.substring(e);
	textarea.focus();
	textarea.setSelectionRange(s + start.length, e + start.length);
	updatePreview();
}

function insertCodeBlock() {
	insertTag('```\n', '\n```');
}

// 商品カード
let currentAffTab = 'code';
function insertAffiliate() {
	document.getElementById('affiliate-modal').classList.remove('hidden');
}
function closeAffiliateModal() {
	document.getElementById('affiliate-modal').classList.add('hidden');
	document.getElementById('aff-code-input').value = '';
	document.getElementById('aff-name').value = '';
	document.getElementById('aff-img').value = '';
	document.getElementById('aff-link').value = '';
	document.getElementById('aff-btn-text').value = '楽天で見る';
}
function switchAffTab(tab) {
	currentAffTab = tab;
	if (tab === 'code') {
		document.getElementById('tab-code').classList.add('active');
		document.getElementById('tab-manual').classList.remove('active');
		document.getElementById('area-code').classList.remove('hidden');
		document.getElementById('area-manual').classList.add('hidden');
	} else {
		document.getElementById('tab-manual').classList.add('active');
		document.getElementById('tab-code').classList.remove('active');
		document.getElementById('area-manual').classList.remove('hidden');
		document.getElementById('area-code').classList.add('hidden');
	}
}

function confirmAffiliate() {
	let title = '',
		imgUrl = '',
		linkUrl = '',
		btnText = '楽天で見る';
	let btnClass = 'rakuten';

	if (currentAffTab === 'code') {
		const code = document.getElementById('aff-code-input').value;
		if (!code) return alert('コード貼ってな！');
		try {
			const parser = new DOMParser();
			const doc = parser.parseFromString(code, 'text/html');
			const anchor = doc.querySelector('a');
			linkUrl = anchor ? anchor.href : '';
			const img = doc.querySelector('img');
			imgUrl = img ? img.src : '';
			if (img && img.alt && !img.alt.includes('商品価格')) {
				title = img.alt;
			} else {
				const textLink = Array.from(doc.querySelectorAll('a')).find(
					(a) =>
						a.textContent.trim().length > 0 && a.querySelector('img') === null
				);
				title = textLink ? textLink.textContent.trim() : '商品名';
			}
		} catch (e) {
			return alert('解析失敗💦 手動入力で！');
		}
	} else {
		title = document.getElementById('aff-name').value;
		imgUrl = document.getElementById('aff-img').value;
		linkUrl = document.getElementById('aff-link').value;
		btnText = document.getElementById('aff-btn-text').value || '楽天で見る';
		if (btnText.includes('Amazon')) btnClass = 'amazon';
		if (btnText.includes('トラベル')) btnClass = 'green';
	}

	if (!linkUrl || !imgUrl) return alert('URLが取得できへんかった💦');

	const cardHtml = `\n<div class="affiliate-card"><div class="aff-img"><img src="${imgUrl}" alt="${title}"></div><div class="aff-content"><div class="aff-title">${title}</div><div class="aff-btns"><a href="${linkUrl}" target="_blank" class="aff-btn ${btnClass}">${btnText}</a></div></div></div>\n`;
	insertTag(cardHtml, '');
	closeAffiliateModal();
}

// リンクカード
function insertLinkCardModal() {
	document.getElementById('linkcard-modal').classList.remove('hidden');
}
function closeLinkCardModal() {
	document.getElementById('linkcard-modal').classList.add('hidden');
	document.getElementById('lc-url').value = '';
	document.getElementById('lc-title').value = '';
	document.getElementById('lc-desc').value = '';
	document.getElementById('lc-img').value = '';
}
function confirmLinkCard() {
	const url = document.getElementById('lc-url').value;
	const title = document.getElementById('lc-title').value;
	const desc = document.getElementById('lc-desc').value;
	const img = document.getElementById('lc-img').value;

	if (!url || !title) return alert('URLとタイトルは必須やで！');

	let domain = '';
	try {
		domain = new URL(url).hostname;
	} catch (e) {}

	let imgHtml = '';
	if (img) {
		// ✨ div じゃなくて span に変更！
		imgHtml = `<span class="lc-img" style="background-image: url('${img}');"></span>`;
	}

	// ✨ div じゃなくて span に変更！Markdown対策！
	const cardHtml = `\n<a href="${url}" target="_blank" class="link-card"><span class="lc-content"><span class="lc-title">${title}</span><span class="lc-desc">${desc}</span><span class="lc-meta"><img src="https://www.google.com/s2/favicons?domain=${domain}" width="14" height="14"> ${domain}</span></span>${imgHtml}</a>\n`;
	insertTag(cardHtml, '');
	closeLinkCardModal();
}

// 画像アップロード
async function uploadImage(input) {
	const file = input.files[0];
	if (!file) return;
	const label = input.previousElementSibling;
	const originalText = label.innerHTML;
	label.innerHTML = '<span>⏳</span>';
	label.disabled = true;
	try {
		const fileExt = file.name.split('.').pop();
		const fileName = `${Date.now()}-${Math.random()
			.toString(36)
			.substring(2)}.${fileExt}`;
		const { error } = await supabase.storage
			.from('images')
			.upload(fileName, file);
		if (error) throw error;
		const {
			data: { publicUrl },
		} = supabase.storage.from('images').getPublicUrl(fileName);
		insertTag(`![${file.name}](${publicUrl})`, '');
	} catch (e) {
		alert('画像アップ失敗💦 ' + e.message);
	} finally {
		label.innerHTML = originalText;
		label.disabled = false;
		input.value = '';
	}
}

// ---------------------------------------------------------
// 💾 保存・削除
// ---------------------------------------------------------
async function submitPost() {
	savePost('published');
}

async function savePost(status) {
	if (!supabase) return alert('設定エラー！');
	const id = document.getElementById('in-id').value;
	const data = getPostData();
	data.status = status;

	try {
		let error;
		if (id) {
			const res = await supabase
				.from('posts')
				.update(data)
				.eq('id', id)
				.select();
			error = res.error;
			if (!error && res.data.length === 0)
				throw new Error('更新できへんかった！Supabaseのポリシーを確認してな！');
		} else {
			const res = await supabase.from('posts').insert([data]).select();
			error = res.error;
			if (!error && res.data.length === 0)
				throw new Error('投稿できへんかった！Supabaseのポリシーを確認してな！');
		}
		if (error) throw error;
		alert(status === 'draft' ? '下書き保存完了！' : '公開完了！');
		fetchPostList();
		if (!id) createNewPost();
	} catch (e) {
		alert('エラー発生💦 ' + e.message);
	}
}

async function deletePost() {
	const id = document.getElementById('in-id').value;
	if (!id || !confirm('本当に削除する？')) return;
	try {
		const res = await supabase.from('posts').delete().eq('id', id).select();
		if (res.error) throw res.error;
		if (res.data.length === 0)
			throw new Error('削除できへんかった！Supabaseのポリシーを確認してな！');
		alert('削除しました');
		createNewPost();
		fetchPostList();
	} catch (e) {
		alert('エラー: ' + e.message);
	}
}

window.insertAffiliateCard = confirmAffiliate;

// 初期プレビュー
updatePreview();
