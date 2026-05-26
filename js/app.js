/* =========================
📄 js/app.js
========================= */

let notes = [];

let folders = ["General"];

let editingId = null;

let currentFolder = "Todas";

let db;

/* =========================
INDEXED DB
========================= */

const request =
indexedDB.open("NotasDB", 1);

request.onupgradeneeded = (e) => {

  db = e.target.result;

  if(!db.objectStoreNames.contains("notes")){

    db.createObjectStore(
      "notes",
      { keyPath:"id" }
    );

  }

  if(!db.objectStoreNames.contains("folders")){

    db.createObjectStore(
      "folders",
      { keyPath:"name" }
    );

  }

};

request.onsuccess = (e) => {

  db = e.target.result;

  loadFolders();
  loadNotes();

};

request.onerror = () => {

  console.log("Error IndexedDB");

};

/* =========================
ELEMENTS
========================= */

const sidebar =
document.getElementById("sidebar");

const menuBtn =
document.getElementById("menuBtn");

const modal =
document.getElementById("noteModal");

const addBtn =
document.getElementById("addNoteBtn");

const saveBtn =
document.getElementById("saveNote");

const cancelBtn =
document.getElementById("cancelNote");

const notesContainer =
document.getElementById("notesContainer");

const folderSelect =
document.getElementById("folderSelect");

const noteFolder =
document.getElementById("noteFolder");

const optionsBtn =
document.getElementById("optionsBtn");

const dropdownMenu =
document.getElementById("dropdownMenu");

const searchBtn =
document.getElementById("searchBtn");

const searchBar =
document.getElementById("searchBar");

const searchInput =
document.getElementById("searchInput");

const folderModal =
document.getElementById("folderModal");

const foldersManagerList =
document.getElementById("foldersManagerList");

const closeFolderModal =
document.getElementById("closeFolderModal");

const createFolderBtn =
document.getElementById("createFolderBtn");

const newFolderInput =
document.getElementById("newFolderInput");

/* =========================
DATABASE FUNCTIONS
========================= */

function saveNotes(){

  const tx =
  db.transaction("notes", "readwrite");

  const store =
  tx.objectStore("notes");

  store.clear();

  notes.forEach(note => {

    store.put(note);

  });

}

function loadNotes(){

  const tx =
  db.transaction("notes", "readonly");

  const store =
  tx.objectStore("notes");

  const request =
  store.getAll();

  request.onsuccess = () => {

    notes = request.result || [];

    renderNotes();

  };

}

function saveFolders(){

  const tx =
  db.transaction("folders", "readwrite");

  const store =
  tx.objectStore("folders");

  store.clear();

  folders.forEach(folder => {

    store.put({
      name:folder
    });

  });

}

function loadFolders(){

  const tx =
  db.transaction("folders", "readonly");

  const store =
  tx.objectStore("folders");

  const request =
  store.getAll();

  request.onsuccess = () => {

    const result =
    request.result;

    if(result.length > 0){

      folders =
      result.map(f => f.name);

    }

    renderFolders();

  };

}

/* =========================
SIDEBAR
========================= */

menuBtn.onclick = () => {

  sidebar.classList.toggle("show");

};

document.addEventListener("click", (e) => {

  const insideSidebar =
  sidebar.contains(e.target);

  const clickedMenu =
  menuBtn.contains(e.target);

  if(!insideSidebar && !clickedMenu){

    sidebar.classList.remove("show");

  }

});

/* =========================
SEARCH
========================= */

searchBtn.onclick = () => {

  searchBar.classList.toggle("hidden");

};

searchInput.addEventListener(
  "input",
  renderNotes
);

/* =========================
FOLDER FILTER
========================= */

folderSelect.addEventListener(
  "change",
  () => {

    currentFolder =
    folderSelect.value;

    renderNotes();

  }
);

/* =========================
DROPDOWN
========================= */

optionsBtn.onclick = () => {

  dropdownMenu.classList.toggle(
    "hidden"
  );

};

/* =========================
OPEN NOTE MODAL
========================= */

addBtn.onclick = () => {

  editingId = null;

  document.getElementById(
    "noteTitle"
  ).value = "";

  document.getElementById(
    "noteContent"
  ).value = "";

  document.getElementById(
    "noteStar"
  ).checked = false;

  modal.classList.remove(
    "hidden"
  );

};

cancelBtn.onclick = () => {

  modal.classList.add(
    "hidden"
  );

};

/* =========================
SAVE NOTE
========================= */

saveBtn.onclick = () => {

  const title =
  document.getElementById(
    "noteTitle"
  ).value;

  const content =
  document.getElementById(
    "noteContent"
  ).value;

  const folder =
  noteFolder.value;

  const star =
  document.getElementById(
    "noteStar"
  ).checked;

  if(title.trim() === "") return;

  if(editingId){

    const note =
    notes.find(
      n => n.id === editingId
    );

    note.title = title;
    note.content = content;
    note.folder = folder;
    note.starred = star;

  }else{

    notes.unshift({

      id:Date.now(),

      title,

      content,

      folder,

      starred:star,

      deleted:false,

      date:new Date()
      .toLocaleString()

    });

  }

  saveNotes();

  modal.classList.add(
    "hidden"
  );

  renderNotes();

};

/* =========================
RENDER NOTES
========================= */

function renderNotes(){

  notesContainer.innerHTML = "";

  const text =
  searchInput.value.toLowerCase();

  const filtered =
  notes.filter(note => {

    const matchesSearch =

      note.title
      .toLowerCase()
      .includes(text)

      ||

      note.content
      .toLowerCase()
      .includes(text);

    const matchesFolder =

      currentFolder.trim() ===
      "Todas"

      ||

      note.folder ===
      currentFolder;

    return(

      !note.deleted &&

      matchesSearch &&

      matchesFolder

    );

  });

  filtered.forEach(note => {

    const div =
    document.createElement("div");

    div.className = "note";

    div.innerHTML = `

      <div class="note-header">

        <div class="note-title">

          ${note.starred ? "⭐" : ""}

          ${note.title}

        </div>

        <div class="note-date">

          ${note.date}

        </div>

      </div>

      <div class="note-content">

        ${note.content}

      </div>

      <div class="note-footer">

        <div class="note-folder">

          📁 ${note.folder}

        </div>

        <div class="note-actions">

          <button
          onclick="editNote(${note.id})">

            ✏️

          </button>

          <button
          onclick="deleteNote(${note.id})">

            🗑️

          </button>

        </div>

      </div>

    `;

    notesContainer.appendChild(div);

  });

  updateCounters();
  renderFolders();

}

/* =========================
EDIT NOTE
========================= */

function editNote(id){

  const note =
  notes.find(n => n.id === id);

  editingId = id;

  document.getElementById(
    "noteTitle"
  ).value = note.title;

  document.getElementById(
    "noteContent"
  ).value = note.content;

  noteFolder.value =
  note.folder;

  document.getElementById(
    "noteStar"
  ).checked =
  note.starred;

  modal.classList.remove(
    "hidden"
  );

}

/* =========================
DELETE NOTE
========================= */

function deleteNote(id){

  const note =
  notes.find(n => n.id === id);

  note.deleted = true;

  saveNotes();

  renderNotes();

}

/* =========================
COUNTERS
========================= */

function updateCounters(){

  document.getElementById(
    "totalNotes"
  ).innerText =

  notes.filter(
    n => !n.deleted
  ).length;

  document.getElementById(
    "starredCount"
  ).innerText =

  notes.filter(
    n => n.starred && !n.deleted
  ).length;

  document.getElementById(
    "deletedCount"
  ).innerText =

  notes.filter(
    n => n.deleted
  ).length;

}

/* =========================
RENDER FOLDERS
========================= */

function renderFolders(){

  const list =
  document.getElementById(
    "foldersList"
  );

  list.innerHTML = "";

  folderSelect.innerHTML = "";

  const allOption =
  document.createElement("option");

  allOption.value = "Todas";

  allOption.textContent =
  "Todas";

  folderSelect.appendChild(
    allOption
  );

  noteFolder.innerHTML = "";

  folders.forEach(folder => {

    const count =
    notes.filter(

      n =>

      n.folder === folder &&

      !n.deleted

    ).length;

    const div =
    document.createElement("div");

    div.className =
    "folder-item";

    div.innerHTML = `

      <span>${folder}</span>

      <span>${count}</span>

    `;

    list.appendChild(div);

    const option =
    document.createElement("option");

    option.value = folder;

    option.textContent =
    folder;

    folderSelect.appendChild(
      option
    );

    const modalOption =
    document.createElement("option");

    modalOption.value = folder;

    modalOption.textContent =
    folder;

    noteFolder.appendChild(
      modalOption
    );

  });

  folderSelect.value =
  currentFolder;

}

/* =========================
FOLDER MODAL
========================= */

document.getElementById(
  "manageFolders"
).onclick = () => {

  folderModal.classList.remove(
    "hidden"
  );

  renderFolderManager();

};

closeFolderModal.onclick = () => {

  folderModal.classList.add(
    "hidden"
  );

};

/* =========================
CREATE FOLDER
========================= */

createFolderBtn.onclick = () => {

  const name =
  newFolderInput.value.trim();

  if(!name) return;

  if(folders.includes(name)){

    alert(
      "La carpeta ya existe"
    );

    return;

  }

  folders.push(name);

  saveFolders();

  newFolderInput.value = "";

  renderFolders();

  renderFolderManager();

};

/* =========================
FOLDER MANAGER
========================= */

function renderFolderManager(){

  foldersManagerList.innerHTML =
  "";

  folders.forEach(folder => {

    const div =
    document.createElement("div");

    div.className =
    "manager-folder-item";

    div.innerHTML = `

      <span>${folder}</span>

      <div class="manager-folder-actions">

        <button
        onclick="editFolder('${folder}')">

          ✏️

        </button>

        <button
        onclick="removeFolder('${folder}')">

          🗑️

        </button>

      </div>

    `;

    foldersManagerList
    .appendChild(div);

  });

}

/* =========================
EDIT FOLDER
========================= */

function editFolder(oldName){

  const newName =
  prompt(
    "Nuevo nombre",
    oldName
  );

  if(!newName) return;

  folders =
  folders.map(folder =>

    folder === oldName
    ? newName
    : folder

  );

  notes.forEach(note => {

    if(note.folder === oldName){

      note.folder = newName;

    }

  });

  saveFolders();
  saveNotes();

  renderFolders();
  renderFolderManager();
  renderNotes();

}

/* =========================
REMOVE FOLDER
========================= */

function removeFolder(folderName){

  if(folderName === "General"){

    alert(
      "No se puede eliminar General"
    );

    return;

  }

  folders =
  folders.filter(

    f => f !== folderName

  );

  notes.forEach(note => {

    if(note.folder === folderName){

      note.folder = "General";

    }

  });

  saveFolders();
  saveNotes();

  renderFolders();
  renderFolderManager();
  renderNotes();

}

/* =========================
TOGGLE FOLDERS
========================= */

function toggleFolders(){

  const content =
  document.getElementById(
    "folderContent"
  );

  const arrow =
  document.getElementById(
    "folderArrow"
  );

  content.classList.toggle(
    "hidden"
  );

  if(content.classList.contains(
    "hidden"
  )){

    arrow.classList.remove(
      "fa-chevron-up"
    );

    arrow.classList.add(
      "fa-chevron-down"
    );

  }else{

    arrow.classList.remove(
      "fa-chevron-down"
    );

    arrow.classList.add(
      "fa-chevron-up"
    );

  }

}

/* =========================
EXPAND
========================= */

function expandAll(){

  document
  .querySelectorAll(
    ".note-content"
  )
  .forEach(note => {

    note.style.display =
    "block";

  });

}

/* =========================
COLLAPSE
========================= */

function collapseAll(){

  document
  .querySelectorAll(
    ".note-content"
  )
  .forEach(note => {

    note.style.display =
    "none";

  });

}

/* =========================
SORT
========================= */

function sortByTitle(){

  notes.sort((a,b)=>

    a.title.localeCompare(
      b.title
    )

  );

  renderNotes();

}

function sortByDate(){

  notes.sort((a,b)=>

    b.id - a.id

  );

  renderNotes();

}

/* =========================
SERVICE WORKER
========================= */

if("serviceWorker" in navigator){

  navigator.serviceWorker
  .register(
    "service-worker.js"
  );

}

/* =========================
BACKUP EXPORT
========================= */

function exportBackup(){

  const backup = {

    notes,
    folders,
    date:new Date().toISOString()

  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type:"application/json"
    }
  );

  const link =
  document.createElement("a");

  link.href =
  URL.createObjectURL(blob);

  const date =
  new Date()
  .toISOString()
  .split("T")[0];

  link.download =
  `respaldo_notas_${date}.json`;

  link.click();

}

/* =========================
BACKUP IMPORT
========================= */

function importBackup(){

  document
  .getElementById("backupInput")
  .click();

}

/* =========================
READ BACKUP FILE
========================= */

document
.getElementB7yId("backupInput")
.addEventListener("change", (e) => {

  const file =
  e.target.files[0];

  if(!file) return;

  const reader =
  new FileReader();

  reader.onload = (event) => {

    try{

      const backup =
      JSON.parse(event.target.result);

      if(!backup.notes || !backup.folders){

        alert(
          "Archivo inválido"
        );

        return;

      }

      const confirmRestore =
      confirm(
        "¿Desea restaurar el respaldo? Esto reemplazará las notas actuales."
      );

      if(!confirmRestore) return;

      notes = backup.notes;

      folders = backup.folders;

      saveNotes();

      saveFolders();

      renderFolders();

      renderNotes();

      alert(
        "Respaldo restaurado correctamente"
      );

    }catch(error){

      alert(
        "Error al restaurar respaldo"
      );

      console.log(error);

    }

  };

  reader.readAsText(file);

});