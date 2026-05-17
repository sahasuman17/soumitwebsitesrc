import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: "AIzaSyDJRGtMPw6eGmbugp6B0h3WT9L9H_rC2ms",
  authDomain: "gen-lang-client-0175524589.firebaseapp.com",
  projectId: "gen-lang-client-0175524589",
  storageBucket: "gen-lang-client-0175524589.firebasestorage.app",
  messagingSenderId: "611623645834",
  appId: "1:611623645834:web:b9b83c3b2fde41f32cb373",
  firestoreDatabaseId: "ai-studio-d7c97ec5-2efd-4afd-907a-ba8fac35880d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
       // This is expected if 'test/connection' doesn't exist or is locked
       console.log('Firebase connection ready (permission denied as expected)');
    } else if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
