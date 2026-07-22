/* ═══════════════════════════════════════
   NEXUS INVENTORY - APLICACION PRINCIPAL
   ═══════════════════════════════════════ */

let currentUser = null;

const NexusApp = {

  /* ═══════════════════════════════════════
     INICIALIZACION
     ═══════════════════════════════════════ */
  async init() {
    this.bindLoginTabs();
    this.bindLoginForm();
    this.bindRegisterForm();
    this.bindSidebar();
    this.bindProductForm();
    this.bindMovimientoForm();
    this.bindQuickAddProduct();
    this.bindTodoForm();
    this.bindSearch();

    /* Escuchar estado de autenticacion */
    auth.onAuthStateChanged((user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0],
          email: user.email
        };
        this.showApp();
      } else {
        currentUser = null;
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-screen').classList.add('hidden');
      }
    });
  },

  /* ═══════════════════════════════════════
     AUTENTICACION
     ═══════════════════════════════════════ */
  bindLoginTabs() {
    document.querySelectorAll('.login-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.login-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('form-login').classList.toggle('hidden', target !== 'login');
        document.getElementById('form-register').classList.toggle('hidden', target !== 'register');
        this.hideLoginError();
      });
    });
  },

  showLoginError(msg) {
    const el = document.getElementById('login-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  },

  hideLoginError() {
    document.getElementById('login-error').classList.add('hidden');
  },

  /* ── LOGIN ── */
  bindLoginForm() {
    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      this.hideLoginError();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;

      try {
        await auth.signInWithEmailAndPassword(email, pass);
        document.getElementById('form-login').reset();
      } catch (err) {
        const msgs = {
          'auth/user-not-found': 'No existe una cuenta con este correo',
          'auth/wrong-password': 'Contrasena incorrecta',
          'auth/invalid-email': 'Correo electronico invalido',
          'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
          'auth/invalid-credential': 'Correo o contrasena incorrectos'
        };
        this.showLoginError(msgs[err.code] || 'Error al iniciar sesion');
      }
    });
  },

  /* ── REGISTRO ── */
  bindRegisterForm() {
    document.getElementById('form-register').addEventListener('submit', async (e) => {
      e.preventDefault();
      this.hideLoginError();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const pass = document.getElementById('reg-pass').value;
      const pass2 = document.getElementById('reg-pass2').value;

      if (pass !== pass2) {
        this.showLoginError('Las contrasenas no coinciden');
        return;
      }

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, pass);

        /* Actualizar perfil con el nombre */
        await cred.user.updateProfile({ displayName: name });

        /* Guardar datos del usuario en Firestore */
        await NexusDB.saveUserProfile({
          uid: cred.user.uid,
          displayName: name,
          email: email
        });

        document.getElementById('form-register').reset();
      } catch (err) {
        const msgs = {
          'auth/email-already-in-use': 'Este correo ya esta registrado',
          'auth/invalid-email': 'Correo electronico invalido',
          'auth/weak-password': 'La contrasena debe tener al menos 6 caracteres'
        };
        this.showLoginError(msgs[err.code] || 'Error al crear la cuenta');
      }
    });
  },

  /* ── CERRAR SESION ── */
  logout() {
    auth.signOut();
  },

  /* ═══════════════════════════════════════
     VISTA PRINCIPAL
     ═══════════════════════════════════════ */
  showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    document.getElementById('user-display-name').textContent = currentUser.name;
    document.getElementById('user-display-email').textContent = currentUser.email;
    document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
    this.navigateTo('dashboard');
  },

  /* ═══════════════════════════════════════
     NAVEGACION / SIDEBAR
     ═══════════════════════════════════════ */
  bindSidebar() {
    document.querySelectorAll('.sidebar-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.navigateTo(item.dataset.page);
        document.querySelector('.sidebar').classList.remove('open');
      });
    });
  },

  navigateTo(page) {
    document.querySelectorAll('.sidebar-item').forEach((i) => i.classList.remove('active'));
    document.querySelector(`.sidebar-item[data-page="${page}"]`).classList.add('active');
    document.querySelectorAll('.page').forEach((p) => p.classList.add('hidden'));
    const target = document.getElementById('page-' + page);
    target.classList.remove('hidden');
    target.classList.add('fade-in');

    if (page === 'dashboard') this.renderDashboard();
    if (page === 'inventario') this.renderInventario();
    if (page === 'todo') this.renderTodos();
    if (page === 'productos') this.renderProductos();
  },

  /* ═══════════════════════════════════════
     DASHBOARD
     ═══════════════════════════════════════ */
  async renderDashboard() {
    const products = await NexusDB.getAllProducts();
    const todos = await NexusDB.getAllTodos();

    const total = products.length;
    const stockOk = products.filter((p) => p.stock > 10).length;
    const stockMed = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const stockLow = products.filter((p) => p.stock === 0).length;
    const valor = products.reduce((s, p) => s + (p.stock || 0) * (p.precio || 0), 0);
    const pendientes = todos.filter((t) => !t.done).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-stock-ok').textContent = stockOk;
    document.getElementById('stat-stock-med').textContent = stockMed;
    document.getElementById('stat-stock-low').textContent = stockLow;
    document.getElementById('stat-valor').textContent =
      '$' + valor.toLocaleString('es-ES', { minimumFractionDigits: 2 });
    document.getElementById('stat-tareas').textContent = pendientes;

    const recentDiv = document.getElementById('dash-recent');
    if (products.length === 0) {
      recentDiv.innerHTML =
        '<div class="empty-icon">&#128230;</div><p>Agrega productos para verlos aqui</p>';
      recentDiv.classList.add('empty-state');
    } else {
      recentDiv.classList.remove('empty-state');
      const recent = products.slice(0, 5);
      recentDiv.innerHTML =
        '<table class="data-table"><thead><tr><th>Codigo</th><th>Nombre</th><th>Stock</th><th>Precio</th></tr></thead><tbody>' +
        recent
          .map(
            (p) =>
              '<tr>' +
              '<td style="color:var(--neon-cyan);font-weight:600;">' + this.esc(p.codigo) + '</td>' +
              '<td>' + this.esc(p.nombre) + '</td>' +
              '<td><span class="stock-badge ' + this.stockClass(p.stock) + '">' + p.stock + '</span></td>' +
              '<td>$' + (p.precio || 0).toFixed(2) + '</td>' +
              '</tr>'
          )
          .join('') +
        '</tbody></table>';
    }
  },

  /* ═══════════════════════════════════════
     INVENTARIO / MOVIMIENTOS
     ═══════════════════════════════════════ */
  async renderInventario() {
    const products = await NexusDB.getAllProducts();
    const select = document.getElementById('mov-producto');
    const currentVal = select.value;
    select.innerHTML =
      '<option value="">Seleccionar...</option>' +
      products
        .map((p) => '<option value="' + p.id + '">' + this.esc(p.codigo) + ' - ' + this.esc(p.nombre) + '</option>')
        .join('');
    select.value = currentVal;

    const movimientos = await NexusDB.getAllMovimientos();
    const tbody = document.getElementById('movimientos-body');
    const empty = document.getElementById('mov-empty');

    if (movimientos.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      const productMap = {};
      products.forEach((p) => (productMap[p.id] = p));

      tbody.innerHTML = movimientos
        .map((m) => {
          const prod = productMap[m.productoId];
          const tipoColor = m.tipo === 'entrada' ? 'var(--neon-green)' : '#ff3355';
          const tipoIcon = m.tipo === 'entrada' ? '&#9650;' : '&#9660;';
          const tipoLabel = m.tipo === 'entrada' ? 'ENTRADA' : 'SALIDA';
          const sign = m.tipo === 'entrada' ? '+' : '-';
          const fecha = m.fecha ? new Date(m.fecha).toLocaleString('es-ES') : '-';
          return (
            '<tr>' +
            '<td style="color:var(--text-secondary);">' + fecha + '</td>' +
            '<td style="color:var(--neon-cyan);">' + (prod ? this.esc(prod.nombre) : '[eliminado]') + '</td>' +
            '<td><span style="color:' + tipoColor + '; font-weight:600;">' + tipoIcon + ' ' + tipoLabel + '</span></td>' +
            '<td style="font-weight:600;">' + sign + m.cantidad + '</td>' +
            '<td style="color:var(--text-secondary);">' + this.esc(m.motivo || '-') + '</td>' +
            '</tr>'
          );
        })
        .join('');
    }
  },

  bindMovimientoForm() {
    document.getElementById('form-movimiento').addEventListener('submit', async (e) => {
      e.preventDefault();
      const productoId = document.getElementById('mov-producto').value;
      const tipo = document.getElementById('mov-tipo').value;
      const cantidad = parseInt(document.getElementById('mov-cantidad').value);
      const motivo = document.getElementById('mov-motivo').value.trim();

      if (!productoId) return;

      const product = await NexusDB.getProduct(productoId);
      if (!product) return;

      if (tipo === 'salida' && (product.stock || 0) < cantidad) {
        alert('No hay suficiente stock para esta salida');
        return;
      }

      const newStock = (product.stock || 0) + (tipo === 'entrada' ? cantidad : -cantidad);
      await NexusDB.updateProduct(productoId, { stock: newStock });
      await NexusDB.addMovimiento({ productoId, tipo, cantidad, motivo });

      document.getElementById('form-movimiento').reset();
      this.renderInventario();
    });
  },

  /* ── AGREGADO RAPIDO DE PRODUCTO (EN INVENTARIO) ── */
  bindQuickAddProduct() {
    const toggle = document.getElementById('quick-add-toggle');
    const form = document.getElementById('quick-add-form');

    toggle.addEventListener('click', () => {
      const isOpen = form.classList.contains('hidden');
      form.classList.toggle('hidden');
      toggle.classList.toggle('open');
      toggle.querySelector('.label').textContent = isOpen
        ? 'Cerrar formulario'
        : 'Agregar producto nuevo';
    });

    document.getElementById('form-quick-product').addEventListener('submit', async (e) => {
      e.preventDefault();
      const codigo = document.getElementById('qp-codigo').value.trim();
      const nombre = document.getElementById('qp-nombre').value.trim();
      const categoria = document.getElementById('qp-categoria').value;
      const stock = parseInt(document.getElementById('qp-stock').value);
      const precio = parseFloat(document.getElementById('qp-precio').value);

      const existing = await NexusDB.getAllProducts();
      if (existing.find((p) => p.codigo === codigo)) {
        alert('Ya existe un producto con ese codigo');
        return;
      }

      const newId = await NexusDB.addProduct({ codigo, nombre, categoria, stock, precio });

      e.target.reset();

      await this.renderInventarioSelect();

      const select = document.getElementById('mov-producto');
      select.value = newId;

      toggle.click();
    });
  },

  async renderInventarioSelect() {
    const products = await NexusDB.getAllProducts();
    const select = document.getElementById('mov-producto');
    select.innerHTML =
      '<option value="">Seleccionar...</option>' +
      products
        .map((p) => '<option value="' + p.id + '">' + this.esc(p.codigo) + ' - ' + this.esc(p.nombre) + '</option>')
        .join('');
  },

  /* ═══════════════════════════════════════
     TAREAS (TODO)
     ═══════════════════════════════════════ */
  async renderTodos() {
    const todos = await NexusDB.getAllTodos();
    const list = document.getElementById('todo-list');
    const empty = document.getElementById('todo-empty');

    if (todos.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      const sorted = todos.sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
      list.innerHTML = sorted
        .map(
          (t) => {
            const fecha = t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES') : '-';
            return (
              '<div class="todo-item ' + (t.done ? 'done' : '') + '">' +
              '<div class="todo-check ' + (t.done ? 'checked' : '') + '" onclick="NexusApp.toggleTodo(\'' + t.id + '\')">' + (t.done ? '&#10003;' : '') + '</div>' +
              '<span class="todo-text">' + this.esc(t.text) + '</span>' +
              '<span style="color:var(--text-secondary);font-size:11px;">' + fecha + '</span>' +
              '<button class="todo-delete" onclick="NexusApp.deleteTodo(\'' + t.id + '\')">&#10005;</button>' +
              '</div>'
            );
          }
        )
        .join('');
    }
  },

  bindTodoForm() {
    document.getElementById('form-todo').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = document.getElementById('todo-input').value.trim();
      if (!text) return;
      await NexusDB.addTodo({ text, done: false });
      document.getElementById('todo-input').value = '';
      this.renderTodos();
    });
  },

  async toggleTodo(id) {
    const todos = await NexusDB.getAllTodos();
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      await NexusDB.updateTodo(id, { done: !todo.done });
      this.renderTodos();
    }
  },

  async deleteTodo(id) {
    await NexusDB.deleteTodo(id);
    this.renderTodos();
  },

  /* ═══════════════════════════════════════
     PRODUCTOS
     ═══════════════════════════════════════ */
  async renderProductos(filter = '') {
    let products = await NexusDB.getAllProducts();
    if (filter) {
      const q = filter.toLowerCase();
      products = products.filter(
        (p) =>
          (p.nombre || '').toLowerCase().includes(q) ||
          (p.codigo || '').toLowerCase().includes(q) ||
          (p.categoria || '').toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('productos-body');
    const empty = document.getElementById('productos-empty');

    if (products.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      tbody.innerHTML = products
        .map(
          (p) =>
            '<tr>' +
            '<td style="color:var(--neon-cyan);font-weight:600;">' + this.esc(p.codigo) + '</td>' +
            '<td>' + this.esc(p.nombre) + '</td>' +
            '<td><span class="cat-tag">' + this.esc(p.categoria) + '</span></td>' +
            '<td><span class="stock-badge ' + this.stockClass(p.stock) + '">' + (p.stock || 0) + '</span></td>' +
            '<td>$' + (p.precio || 0).toFixed(2) + '</td>' +
            '<td style="font-weight:600;">$' + ((p.stock || 0) * (p.precio || 0)).toFixed(2) + '</td>' +
            '<td>' +
            '<button class="action-btn" onclick="NexusApp.editProduct(\'' + p.id + '\')" title="Editar">&#9998;</button>' +
            '<button class="action-btn del" onclick="NexusApp.deleteProduct(\'' + p.id + '\')" title="Eliminar">&#128465;</button>' +
            '</td>' +
            '</tr>'
        )
        .join('');
    }
  },

  bindSearch() {
    document.getElementById('search-product').addEventListener('input', (e) => {
      this.renderProductos(e.target.value);
    });
  },

  bindProductForm() {
    document.getElementById('form-product').addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('prod-edit-id').value;
      const data = {
        codigo: document.getElementById('prod-codigo').value.trim(),
        nombre: document.getElementById('prod-nombre').value.trim(),
        categoria: document.getElementById('prod-categoria').value,
        stock: parseInt(document.getElementById('prod-stock').value),
        precio: parseFloat(document.getElementById('prod-precio').value),
      };

      if (editId) {
        await NexusDB.updateProduct(editId, data);
      } else {
        const existing = await NexusDB.getAllProducts();
        if (existing.find((p) => p.codigo === data.codigo)) {
          alert('Ya existe un producto con ese codigo');
          return;
        }
        await NexusDB.addProduct(data);
      }

      this.closeProductModal();
      this.renderProductos(document.getElementById('search-product').value);
    });
  },

  openProductModal(editData) {
    document.getElementById('modal-product').classList.remove('hidden');
    document.getElementById('modal-product-title').textContent = editData
      ? 'Editar Producto'
      : 'Nuevo Producto';
    document.getElementById('prod-edit-id').value = editData ? editData.id : '';
    document.getElementById('prod-codigo').value = editData ? editData.codigo : '';
    document.getElementById('prod-nombre').value = editData ? editData.nombre : '';
    document.getElementById('prod-categoria').value = editData ? editData.categoria : '';
    document.getElementById('prod-stock').value = editData ? (editData.stock || 0) : '';
    document.getElementById('prod-precio').value = editData ? (editData.precio || 0) : '';
  },

  closeProductModal() {
    document.getElementById('modal-product').classList.add('hidden');
    document.getElementById('form-product').reset();
    document.getElementById('prod-edit-id').value = '';
  },

  async editProduct(id) {
    const product = await NexusDB.getProduct(id);
    if (product) this.openProductModal(product);
  },

  async deleteProduct(id) {
    if (!confirm('Eliminar este producto?')) return;
    await NexusDB.deleteProduct(id);
    this.renderProductos(document.getElementById('search-product').value);
  },

  /* ═══════════════════════════════════════
     UTILIDADES
     ═══════════════════════════════════════ */
  esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  },

  stockClass(stock) {
    if (!stock || stock === 0) return 'stock-low';
    if (stock <= 10) return 'stock-medium';
    return 'stock-high';
  },
};

/* ═══════════════════════════════════════
   EVENTOS GLOBALES
   ═══════════════════════════════════════ */
document.getElementById('modal-product').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) NexusApp.closeProductModal();
});

/* ═══════════════════════════════════════
   INICIAR APLICACION
   ═══════════════════════════════════════ */
NexusApp.init();
