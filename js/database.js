/* ═══════════════════════════════════════
   NEXUS INVENTORY - BASE DE DATOS FIRESTORE
   ═══════════════════════════════════════ */

const NexusDB = {

  /* ── PRODUCTOS ── */
  async addProduct(data) {
    const docRef = await db.collection('products').add({
      ...data,
      userId: auth.currentUser.uid,
      createdAt: Date.now()
    });
    return docRef.id;
  },

  async updateProduct(id, data) {
    await db.collection('products').doc(id).update(data);
  },

  async getProduct(id) {
    const doc = await db.collection('products').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async getAllProducts() {
    const snapshot = await db.collection('products')
      .where('userId', '==', auth.currentUser.uid)
      .get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  },

  async deleteProduct(id) {
    await db.collection('products').doc(id).delete();
  },

  /* ── MOVIMIENTOS ── */
  async addMovimiento(data) {
    const docRef = await db.collection('movimientos').add({
      ...data,
      userId: auth.currentUser.uid,
      fecha: Date.now()
    });
    return docRef.id;
  },

  async getAllMovimientos() {
    const snapshot = await db.collection('movimientos')
      .where('userId', '==', auth.currentUser.uid)
      .get();
    const movimientos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return movimientos.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
  },

  /* ── TAREAS (TODO) ── */
  async addTodo(data) {
    const docRef = await db.collection('todos').add({
      ...data,
      userId: auth.currentUser.uid,
      fecha: Date.now()
    });
    return docRef.id;
  },

  async updateTodo(id, data) {
    await db.collection('todos').doc(id).update(data);
  },

  async deleteTodo(id) {
    await db.collection('todos').doc(id).delete();
  },

  async getAllTodos() {
    const snapshot = await db.collection('todos')
      .where('userId', '==', auth.currentUser.uid)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  /* ── USUARIOS ── */
  async saveUserProfile(user) {
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || '',
      email: user.email,
      createdAt: Date.now()
    }, { merge: true });
  },

  async getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() : null;
  }
};
