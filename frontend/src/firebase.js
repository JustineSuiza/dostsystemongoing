import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAL2p6TmbZd0YDBnjSegQLPf63zkwvt9Dw',
  authDomain: 'justinez.firebaseapp.com',
  projectId: 'justinez',
  storageBucket: 'justinez.firebasestorage.app',
  messagingSenderId: '591454178118',
  appId: '1:591454178118:web:20c96de89c0fba1ce2b347',
  measurementId: 'G-WBL910QQQF',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
