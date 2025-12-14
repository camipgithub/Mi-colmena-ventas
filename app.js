let rubroActivo = "almacen";
function cambiarRubro() {
  rubroActivo = document.getElementById("rubro").value;
  document.body.className = rubroActivo;
  listarProductos();
  listarVentas();
}

let db;

function initDB() {
  const request = indexedDB.open("mi_colmena_db", 1);

  request.onupgradeneeded = e => {
    db = e.target.result;

    if (!db.objectStoreNames.contains("productos")) {
      db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
    }

    if (!db.objectStoreNames.contains("ventas")) {
      db.createObjectStore("ventas", { keyPath: "id", autoIncrement: true });
    }
  };

  request.onsuccess = e => {
    db = e.target.result;
    alert("Base lista");
    listarProductos();
    listarVentas();
  };

  request.onerror = () => alert("Error al crear la base");
}
document.body.className = rubroActivo;

// -------- INVENTARIO --------

function guardarProducto() {
  const codigo = document.getElementById("codigo").value;
const nombre = document.getElementById("nombre").value;
  const precio = Number(document.getElementById("precio").value);
  const stock = Number(document.getElementById("stock").value);

  const tx = db.transaction("productos", "readwrite");
  const store = tx.objectStore("productos");
      
store.add({ codigo, nombre, precio, stock, rubro: rubroActivo });
      
  tx.oncomplete = () => {
    listarProductos();
    document.getElementById("nombre").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("stock").value = "";
  };
}

function listarProductos() {
  const lista = document.getElementById("listaProductos");
  const select = document.getElementById("productoVenta");

  lista.innerHTML = "";
  select.innerHTML = "";

  const tx = db.transaction("productos", "readonly");
  const store = tx.objectStore("productos");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const p = cursor.value;
if (p.rubro !== rubroActivo) {
  cursor.continue();
  return;
}
          

      const li = document.createElement("li");
      li.textContent = `${p.nombre} — $${p.precio} — stock: ${p.stock}`;
      lista.appendChild(li);

      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.nombre;
      select.appendChild(option);

      cursor.continue();
    }
  };
}

// -------- VENTAS --------

function registrarVenta() {
  const productoId = Number(document.getElementById("productoVenta").value);
  const cantidad = Number(document.getElementById("cantidadVenta").value);
  const pago = document.getElementById("pagoVenta").value;

  const tx = db.transaction(["productos", "ventas"], "readwrite");
  const productos = tx.objectStore("productos");
  const ventas = tx.objectStore("ventas");

  productos.get(productoId).onsuccess = e => {
    const producto = e.target.result;

    if (producto.stock < cantidad) {
      alert("Stock insuficiente");
      return;
    }

    producto.stock -= cantidad;
    productos.put(producto);
ventas.add({
  producto: producto.nombre,
  cantidad,
  total: producto.precio * cantidad,
  pago,
  fecha: new Date().toLocaleString(),
  rubro: rubroActivo
});
      
  };

  tx.oncomplete = () => {
    listarProductos();
    listarVentas();
  };
}

function listarVentas() {
  const lista = document.getElementById("listaVentas");
  lista.innerHTML = "";

  const tx = db.transaction("ventas", "readonly");
  const store = tx.objectStore("ventas");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      const v = cursor.value;
const v = cursor.value;
if (v.rubro !== rubroActivo) {
  cursor.continue();
  return;
}
          
      const li = document.createElement("li");
      li.textContent =
        `${v.fecha} — ${v.producto} x${v.cantidad} — $${v.total} — ${v.pago}`;

      lista.appendChild(li);
      cursor.continue();
    }
  };
      }
let lector;
let stream;

function abrirCamara() {
  document.getElementById("camara").style.display = "block";
  lector = new ZXing.BrowserBarcodeReader();

  lector.decodeFromVideoDevice(null, "video", (result, err) => {
    if (result) {
      document.getElementById("codigo").value = result.text;
      cerrarCamara();
    }
  });
}

function cerrarCamara() {
  document.getElementById("camara").style.display = "none";
  if (lector) lector.reset();
}

                               
