async function getPosts() {
  const res = await fetch(`http://127.0.0.1:3000/posts`);
  const posts = await res.json();

  const list = document.getElementById("postList");
  list.innerHTML = "";

  posts.forEach((post) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = post.title + " - " + post.content;

    const btnBox = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.textContent = "수정";
    editBtn.onclick = () => patchPost(post.id, post.content);

    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.onclick = () => deletePost(post.id);

    btnBox.appendChild(editBtn);
    btnBox.appendChild(delBtn);

    li.appendChild(text);
    li.appendChild(btnBox);
    list.appendChild(li);
  });
}

async function createPost() {
  const title = document.getElementById("titleInput").value;
  const content = document.getElementById("contentInput").value;

  await fetch(`http://127.0.0.1:3000/posts`, {
    method: "POST",
    body: JSON.stringify({ title: title, content: content }),
    headers: { "Content-Type": "application/json" },
  });

  document.getElementById("titleInput").value = "";
  document.getElementById("contentInput").value = "";

  getPosts();
}

async function patchPost(id, oldTitle, oldContent) {
  const newTitle = prompt("제목을 수정하세요", oldTitle);
  if (newTitle === null) return;

  const newContent = prompt("내용을 수정하세요", oldContent);
  if (newContent === null) return;

  await fetch(`http://127.0.0.1:3000/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title: newTitle, content: newContent }),
    headers: { "Content-Type": "application/json" },
  });

  getPosts();
}

async function deletePost(id) {
  await fetch(`http://127.0.0.1:3000/posts/${id}`, {
    method: "DELETE",
  });

  getPosts();
}

getPosts();