//Navigation Toggle
document.querySelectorAll("nav a").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll("main section").forEach(sec => sec.classList.remove("active"));
    const target = e.target.getAttribute("data-section");
    document.getElementById(target).classList.add("active");
  });
});

//Book Management
let books = JSON.parse(localStorage.getItem("books")) || [];
let editBookIndex = -1;
document.getElementById("bookForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const title = document.getElementById("bookTitle").value;
  const author = document.getElementById("bookAuthor").value;
  const genre = document.getElementById("bookGenre").value;

  if (editBookIndex === -1) {
    books.push({ title, author, genre, available: true });
  } else {
    books[editBookIndex] = { ...books[editBookIndex], title, author, genre };
    editBookIndex = -1;
  }

  localStorage.setItem("books", JSON.stringify(books));
  renderBooks();
  this.reset();
  updateReports();
});

function renderBooks(filter = "") {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = "";

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(filter.toLowerCase()) ||
    b.author.toLowerCase().includes(filter.toLowerCase()) ||
    b.genre.toLowerCase().includes(filter.toLowerCase()) ||
    (b.available ? "available" : "issued").includes(filter.toLowerCase())
  );

  filtered.forEach((b, index) => {
    const li = document.createElement("li");
    li.textContent = `${b.title} by ${b.author} [Genre: ${b.genre}] - ${b.available ? "Available" : "Issued"}`;
    const btnContainer = document.createElement("div");
    // Edit
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => {
      document.getElementById("bookTitle").value = b.title;
      document.getElementById("bookAuthor").value = b.author;
      document.getElementById("bookGenre").value = b.genre;
      editBookIndex = index;
    };
    // Delete
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
      books.splice(index, 1);
      localStorage.setItem("books", JSON.stringify(books));
      renderBooks(filter);
      updateReports();
    };
    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(delBtn);
    li.appendChild(btnContainer);
    bookList.appendChild(li);
  });
}

document.getElementById("searchBook").addEventListener("input", function(e) {
  renderBooks(e.target.value);
});
renderBooks();

// Member Management
const memberForm = document.getElementById("memberForm");
const memberList = document.getElementById("memberList");
const memberSearch = document.getElementById("memberSearch");
let members = JSON.parse(localStorage.getItem("members")) || [];
let editIndex = null; 

// Render members 
function renderMembers(filter = "") {
  memberList.innerHTML = "";
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(filter.toLowerCase()) ||
    m.email.toLowerCase().includes(filter.toLowerCase()) ||
    m.id.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach((m, index) => {
    const li = document.createElement("li");
    li.textContent = `${m.name} (ID: ${m.id}, Email: ${m.email}) `;

  // Button container
  const btnContainer = document.createElement("div");
  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.onclick = () => {
    document.getElementById("memberName").value = m.name;
    document.getElementById("memberId").value = m.id;
    document.getElementById("memberEmail").value = m.email;
    editIndex = members.findIndex(mem => mem.id === m.id);
  };
    // Delete button
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => {
    members.splice(index, 1);
    localStorage.setItem("members", JSON.stringify(members));
    renderMembers(filter);
  };

    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(delBtn);

    li.appendChild(btnContainer);
    memberList.appendChild(li);
});
}

// Add / Update member
memberForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("memberName").value.trim();
  const id = document.getElementById("memberId").value.trim();
  const email = document.getElementById("memberEmail").value.trim();

  if (name && id && email) {
    if (editIndex !== null) {
      // Update existing member
      members[editIndex] = { name, id, email };
      editIndex = null;
    } else {
      // Add new member
      members.push({ name, id, email });
    }
    localStorage.setItem("members", JSON.stringify(members));
    renderMembers(memberSearch.value);
    updateReports();
    memberForm.reset();
  }
});
memberSearch.addEventListener("input", (e) => {
  renderMembers(e.target.value);
});
renderMembers();

//Issue & Return
let issuedBooks = JSON.parse(localStorage.getItem("issuedBooks")) || [];
if (!Array.isArray(issuedBooks)) {
  issuedBooks = [];
}
const issueForm = document.getElementById("issueForm");
const issueMember = document.getElementById("issueMember");
const issueBook = document.getElementById("issueBook");
const issuedList = document.getElementById("issuedList");

// dropdowns
function renderDropdowns() {
  issueMember.innerHTML = members
    .map((m, i) => `<option value="${i}">${m.name} (${m.email})</option>`)
    .join("");

  issueBook.innerHTML = books
    .map((b, i) => {
      if (b.available === undefined) b.available = true; // fix missing
        return b.available
        ? `<option value="${i}">${b.title} by ${b.author}</option>`
        : ""
})
    .join("");
}

//Render issued books
function renderIssuedBooks() {
  issuedList.innerHTML = issuedBooks
    .map(
      (entry, i) => `
      <li>
        <strong>${entry.bookTitle}</strong> → ${entry.memberName} 
        (Issued: ${entry.issueDate})
        ${
          entry.returnDate
            ? `✔ Returned: ${entry.returnDate}`
            : `<button onclick="returnBook(${i})">Return</button>`
        }
      </li>
    `
    )
    .join("");
}

//Issue Book
issueForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const memberIndex = issueMember.value;
  const bookIndex = issueBook.value;
  console.log("Issuing book:", books[bookIndex]?.title, "to", members[memberIndex]?.name);
  if (books[bookIndex] && books[bookIndex].available) {
    books[bookIndex].available = false;
    issuedBooks.push({
      bookTitle: books[bookIndex].title,
      memberName: members[memberIndex].name,
      issueDate: new Date().toLocaleDateString(),
      returnDate: null,
      bookIndex,
    });
    saveData();
    renderDropdowns();
    renderIssuedBooks();
    updateReports();
  }
});

//Return Book
function returnBook(i) {
  const entry = issuedBooks[i];
  books[entry.bookIndex].available = true;
  entry.returnDate = new Date().toLocaleDateString();
  saveData();
  renderDropdowns();
  renderIssuedBooks();
  updateReports();
}

//Saving Data 
function saveData() {
  localStorage.setItem("books", JSON.stringify(books));
  localStorage.setItem("members", JSON.stringify(members));
  localStorage.setItem("issuedBooks", JSON.stringify(issuedBooks));
}
renderDropdowns();
renderIssuedBooks();
updateReports();

//Reports
function updateReports() {
  document.getElementById("totalBooks").textContent = books.length;
  document.getElementById("totalMembers").textContent = members.length;
  document.getElementById("issuedBooks").textContent = issuedBooks.length;
}
renderBooks();
renderMembers();
renderDropdowns();
renderIssuedBooks();
updateReports();