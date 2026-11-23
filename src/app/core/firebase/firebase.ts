import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
