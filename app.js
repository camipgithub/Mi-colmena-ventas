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
const venta = {
  producto: producto.nombre,
  cantidad,
  total: producto.precio * cantidad,
  pago,
  fecha: new Date().toLocaleString(),
  rubro: rubroActivo
};
      
  };
  ventas.add(venta).onsuccess = e => {
  mostrarTicket(venta);
};
  

  tx.oncomplete = () => {
    listarProductos();
    listarVentas();
  };
}
function mostrarTicket(v) {
  const html = `
    <h2>Mi Colmena</h2>
    <p>${v.fecha}</p>
    <hr>
    <p>Producto: ${v.producto}</p>
    <p>Cantidad: ${v.cantidad}</p>
    <p>Total: $${v.total}</p>
    <p>Pago: ${v.pago}</p>
    <hr>
    <p>Gracias por su compra</p>
  `;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
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
function reporteHoy() {
  generarReporte("hoy");
}

function reporteMes() {
  generarReporte("mes");
}

function generarReporte(tipo) {
  const ahora = new Date();
  let total = 0;
  let porPago = { Efectivo: 0, QR: 0, Tarjeta: 0 };

  const tx = db.transaction("ventas", "readonly");
  const store = tx.objectStore("ventas");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      mostrarReporte(total, porPago, tipo);
      return;
    }

    const v = cursor.value;

    if (v.rubro !== rubroActivo) {
      cursor.continue();
      return;
    }

    const fechaVenta = new Date(v.fecha);

    const esHoy =
      fechaVenta.toDateString() === ahora.toDateString();

    const esMes =
      fechaVenta.getMonth() === ahora.getMonth() &&
      fechaVenta.getFullYear() === ahora.getFullYear();

    if (
      (tipo === "hoy" && esHoy) ||
      (tipo === "mes" && esMes)
    ) {
      total += v.total;
      porPago[v.pago] += v.total;
    }

    cursor.continue();
  };
}

function mostrarReporte(total, porPago, tipo) {
  document.getElementById("reporte").innerHTML = `
    <h3>Reporte ${tipo === "hoy" ? "de Hoy" : "del Mes"}</h3>
    <p><b>Total:</b> $${total}</p>
    <ul>
      <li>Efectivo: $${porPago.Efectivo}</li>
      <li>QR: $${porPago.QR}</li>
      <li>Tarjeta: $${porPago.Tarjeta}</li>
    </ul>
  `;
}

  function exportarCSV(tipo) {
  const ahora = new Date();
  let filas = [
    ["Fecha", "Producto", "Cantidad", "Total", "Pago", "Rubro"]
  ];

  const tx = db.transaction("ventas", "readonly");
  const store = tx.objectStore("ventas");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      descargarCSV(filas, tipo);
      return;
    }

    const v = cursor.value;
    if (v.rubro !== rubroActivo) {
      cursor.continue();
      return;
    }

    const f = new Date(v.fecha);

    const esHoy = f.toDateString() === ahora.toDateString();
    const esMes =
      f.getMonth() === ahora.getMonth() &&
      f.getFullYear() === ahora.getFullYear();

    if (
      (tipo === "hoy" && esHoy) ||
      (tipo === "mes" && esMes)
    ) {
      filas.push([
        v.fecha,
        v.producto,
        v.cantidad,
        v.total,
        v.pago,
        v.rubro
      ]);
    }

    cursor.continue();
  };
}

function descargarCSV(filas, tipo) {
  const contenido = filas.map(f => f.join(",")).join("\n");
  const blob = new Blob([contenido], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `mi_colmena_${rubroActivo}_${tipo}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}
function exportarPDF(tipo) {
  const ahora = new Date();
  let contenido = `
    <h2>Mi Colmena</h2>
    <p>Rubro: ${rubroActivo}</p>
    <p>Periodo: ${tipo}</p>
    <table border="1" cellspacing="0" cellpadding="4">
      <tr>
        <th>Fecha</th>
        <th>Producto</th>
        <th>Cant.</th>
        <th>Total</th>
        <th>Pago</th>
      </tr>
  `;

  const tx = db.transaction("ventas", "readonly");
  const store = tx.objectStore("ventas");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      contenido += "</table>";
      imprimirPDF(contenido);
      return;
    }

    const v = cursor.value;
    if (v.rubro !== rubroActivo) {
      cursor.continue();
      return;
    }

    const f = new Date(v.fecha);
    const esHoy = f.toDateString() === ahora.toDateString();
    const esMes =
      f.getMonth() === ahora.getMonth() &&
      f.getFullYear() === ahora.getFullYear();

    if (
      (tipo === "hoy" && esHoy) ||
      (tipo === "mes" && esMes)
    ) {
      contenido += `
        <tr>
          <td>${v.fecha}</td>
          <td>${v.producto}</td>
          <td>${v.cantidad}</td>
          <td>$${v.total}</td>
          <td>${v.pago}</td>
        </tr>
      `;
    }

    cursor.continue();
  };
}

function imprimirPDF(html) {
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.print();
                        }
  
function mostrarGraficoMes() {
  const ahora = new Date();
  let porPago = { Efectivo: 0, QR: 0, Tarjeta: 0 };

  const tx = db.transaction("ventas", "readonly");
  const store = tx.objectStore("ventas");

  store.openCursor().onsuccess = e => {
    const cursor = e.target.result;
    if (!cursor) {
      dibujarGrafico(porPago);
      return;
    }

    const v = cursor.value;
    if (v.rubro !== rubroActivo) {
      cursor.continue();
      return;
    }

    const f = new Date(v.fecha);
    const esMes =
      f.getMonth() === ahora.getMonth() &&
      f.getFullYear() === ahora.getFullYear();

    if (esMes) {
      porPago[v.pago] += v.total;
    }

    cursor.continue();
  };
}

function dibujarGrafico(data) {
  const ctx = document.getElementById("graficoVentas").getContext("2d");

  if (window.grafico) window.grafico.destroy();

  window.grafico = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Efectivo", "QR", "Tarjeta"],
      datasets: [{
        data: [data.Efectivo, data.QR, data.Tarjeta]
      }]
    }
  });
}
function backupAutomatico() {
  let datos = { productos: [], ventas: [] };

  const tx = db.transaction(["productos", "ventas"], "readonly");
  const productos = tx.objectStore("productos");
  const ventas = tx.objectStore("ventas");

  productos.openCursor().onsuccess = e => {
    const c = e.target.result;
    if (c) {
      datos.productos.push(c.value);
      c.continue();
    }
  };

  ventas.openCursor().onsuccess = e => {
    const c = e.target.result;
    if (c) {
      datos.ventas.push(c.value);
      c.continue();
    }
  };

  tx.oncomplete = () => {
    const blob = new Blob([JSON.stringify(datos)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_mi_colmena_${new Date().toISOString()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };
      }
