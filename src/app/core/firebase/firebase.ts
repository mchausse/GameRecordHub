import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAQ3zEdd_ZzTx_Y-krGSJ5Ng96Btaba_48',
  authDomain: 'gamerecordhub-ce47c.firebaseapp.com',
  projectId: 'gamerecordhub-ce47c',
  storageBucket: 'gamerecordhub-ce47c.firebasestorage.app',
  messagingSenderId: '49691497669',
  appId: '1:49691497669:web:489de8044e471924460cac',
  measurementId: 'G-1Z37D6M84B',
} as const;

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

export const firebaseAuthApi = { onAuthStateChanged, signInWithPopup, signOut };
export const firebaseFirestoreApi = {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
};
