const WEBAPP = 'https://script.google.com/macros/s/AKfycbwRPH3xMR-oJDQUVmGOVG8Q0noD64Ovf8anO-qwzEKdlURCBS2abUySsW4rjxFLZG_X/exec';

const params = new URLSearchParams(window.location.search);
const userId = params.get("uid") || "anonymous";
document.getElementById("username").textContent = userId;

const topicList = document.getElementById("topicList");
const threadEl = document.getElementById("thread");
const createBtn = document.getElementById("createBtn");
const modal = document.getElementById("modal");
const cancelBtn = document.getElementById("cancelBtn");
const form = document.getElementById("createForm");

// 初期化処理
window.addEventListener("DOMContentLoaded", async () => {
  await loadTopics();

  createBtn?.addEventListener("click", () => modal.classList.remove("hidden"));
  cancelBtn?.addEventListener("click", () => modal.classList.add("hidden"));
  form?.addEventListener("submit", onCreateSubmit);
});

async function loadTopics() {
  const res = await fetch(`${WEBAPP}?action=getTopics`);
  const topics = await res.json();

  topicList.innerHTML = "";
  topics.forEach((t, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = t.id;
    card.innerHTML = `
      <h3>${t.title}</h3>
      <p>${t.body}</p>
      <div class="engagement">
        <span class="like">❤ <span class="count">${t.likes || 0}</span></span>
        <span class="comment-count">💬 <span class="count">${t.comments || 0}</span></span>
      </div>
    `;
  card.addEventListener("click", () => {
    loadThread(i, t.title, t.body);  // ← 先に詳細表示
    document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
    card.classList.add("active");    // ← 後に枠線
  });
    topicList.appendChild(card);
  });
}

async function loadThread(id, title, body) {
  const res = await fetch(`${WEBAPP}?action=getThread&id=${id}`);
  const comments = await res.json();

  threadEl.innerHTML = `
    <div class="thread-header">
      <button onclick="closeThread()">←</button>
      <h2>${title}</h2>
    </div>
    <p>${body}</p>
    <div id="comments">
      ${comments.map(c => `
        <div class="comment">
          <strong>${c.user}</strong>
          <time>${new Date(c.ts).toLocaleString()}</time>
          <p>${c.body}</p>
        </div>`).join('')}
    </div>
    <form id="replyForm">
      <textarea name="body" rows="3" required></textarea>
      <button type="submit">返信</button>
    </form>
  `;

  const replyForm = document.getElementById("replyForm");
  replyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = replyForm.body.value.trim();
    if (!body) return;

    await fetch(`${WEBAPP}?action=addComment`, {
      method: "POST",
      body: JSON.stringify({ id, body, user: userId }),
    });

    replyForm.reset();
    loadThread(id, title, body);
  });

  threadEl.classList.remove("hidden");
  threadEl.classList.add("visible");
}

function closeThread() {
  threadEl.classList.add("hidden");
  threadEl.classList.remove("visible");
  document.querySelectorAll(".card").forEach(c => c.classList.remove("active"));
}

async function onCreateSubmit(e) {
  e.preventDefault();
  const title = form.title.value.trim();
  const body = form.body.value.trim();
  if (!title || !body) return;

  await fetch(`${WEBAPP}?action=createTopic`, {
    method: "POST",
    body: JSON.stringify({ title, body, user: userId })
  });

  form.reset();
  modal.classList.add("hidden");
  await loadTopics();
}
