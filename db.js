alert("db.js ejecutándose");
console.log("db.js cargado");

const DB_NAME = 'mi_colmena_db';
const DB_VERSION = 1;

window.initDB = function () {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains('productos')) {
      db.createObjectStore('productos', {
        keyPath: 'id',
        autoIncrement: true
      });
    }
  };

  request.onsuccess = () => {
    console.log("Base lista");
  };

  request.onerror = () => {
    console.error("Error al abrir la base");
  };
};

window.guardarProducto = function () {
  const nombre = document.getElementById('nombre').value;
  const precio = Number(document.getElementById('precio').value);
  const stock = Number(document.getElementById('stock').value);

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('productos', 'readwrite');
    const store = tx.objectStore('productos');

    store.add({ nombre, precio, stock });

    tx.oncomplete = () => {
      window.listarProductos();
    };
  };
};

window.listarProductos = function () {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('productos', 'readonly');
    const store = tx.objectStore('productos');

    const lista = document.getElementById('lista');
    lista.innerHTML = '';

    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const p = cursor.value;
        lista.innerHTML += `<li>${p.nombre} — $${p.precio} — stock: ${p.stock}</li>`;
        cursor.continue();
      }
    };
  };
};

