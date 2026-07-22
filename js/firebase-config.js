/* ═══════════════════════════════════════
   NEXUS INVENTORY - CONFIGURACION FIREBASE
   ═══════════════════════════════════════

   Reemplaza estos valores con los de tu proyecto Firebase.
   Ve a: Console Firebase > Configuracion del proyecto > General > Tus apps
   ═══════════════════════════════════════ */

const firebaseConfig = {
  apiKey: "AIzaSyDsIUW_zIxvyAgI9j8ozA0gKNnyMOza-G4",
  authDomain: "reporte-inventario-e381d.firebaseapp.com",
  projectId: "reporte-inventario-e381d",
  storageBucket: "reporte-inventario-e381d.firebasestorage.app",
  messagingSenderId: "844382827246",
  appId: "1:844382827246:web:890b97f47edc5904e1b9ff",
  measurementId: "G-5DBRQZ5BRE"
};

/* Inicializar Firebase */
firebase.initializeApp(firebaseConfig);

/* Servicios exportados */
const auth = firebase.auth();
const db = firebase.firestore();
