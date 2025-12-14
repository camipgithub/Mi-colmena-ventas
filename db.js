console.log("db.js cargado correctamente");
document.body.innerHTML += "<p>📦 db.js cargado</p>";

function initDB(){
  const request = indexedDB.open('mi_colmena_db', 1);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;

    if (!db.objectStoreNames.contains('productos')) {
      db.createObjectStore('productos', {
        keyPath: 'id',
        autoIncrement: true
      });
    }

    if (!db.objectStoreNames.contains('ventas')) {
      db.createObjectStore('ventas', {
        keyPath: 'id',
        autoIncrement: true
      });
    }
  };

  request.onsuccess = () => {
    document.body.innerHTML += "<p>✅ Base creada correctamente</p>";
  };

  request.onerror = () => {
    document.body.innerHTML += "<p>❌ Error al crear la base</p>";
  };
}
function guardarProducto(){
  const nombre = document.getElementById('nombre').value;
  const precio = Number(document.getElementById('precio').value);
  const stock = Number(document.getElementById('stock').value);

  const request = indexedDB.open('mi_colmena_db',1);

  request.onsuccess = e => {
    const db = e.target.result;
    const tx = db.transaction('productos','readwrite');
    const store = tx.objectStore('productos');

    store.add({ nombre, precio, stock });

    tx.oncomplete = () => {
      listarProductos();
    };
  };
}

function listarProductos(){
  const request = indexedDB.open('mi_colmena_db',1);

  request.onsuccess = e => {
    const db = e.target.result;
    const tx = db.transaction('productos','readonly');
    const store = tx.objectStore('productos');

    const lista = document.getElementById('lista');
    lista.innerHTML = '';

    store.openCursor().onsuccess = e => {
      const cursor = e.target.result;
      if(cursor){
        const p = cursor.value;
        lista.innerHTML += `<li>${p.nombre} — $${p.precio} — stock: ${p.stock}</li>`;
        cursor.continue();
      }
    };
  };
}
window.onload = () => {
  listarProductos();
};




                
