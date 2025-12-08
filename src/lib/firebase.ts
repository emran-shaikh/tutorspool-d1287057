import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBk559QWXeyh7uLddSZ-jL9z0Fk57scQ3U",
  authDomain: "tutorspooldb.firebaseapp.com",
  projectId: "tutorspooldb",
  storageBucket: "tutorspooldb.firebasestorage.app",
  messagingSenderId: "1012964928731",
  appId: "1:1012964928731:web:76f2f66d93d39944ccf0fe",
  measurementId: "G-ZKMSQ1TGHT"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
