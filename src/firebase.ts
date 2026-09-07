import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Guarantee browser local persistence so auth survives page refreshes
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence setup notice:', err);
});

export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with robust connection settings for iframe/Cloud Run environment
let dbInstance;
try {
  const dbId = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined;

  if (dbId) {
    dbInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, dbId);
  } else {
    dbInstance = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  }
} catch (e) {
  console.warn('Named Firestore database initialization fallback:', e);
  dbInstance = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;
export const storage = getStorage(app);

// Helper for bilingual Firebase Auth & Firestore error messages
export function getFirebaseErrorMessage(errorCodeOrMessage: string, lang: 'en' | 'fr' = 'en'): string {
  const code = errorCodeOrMessage.toLowerCase();

  // Auth Error Codes
  if (code.includes('auth/email-already-in-use') || code.includes('email-already-in-use')) {
    return lang === 'fr'
      ? 'Un compte existe déjà avec cette adresse e-mail. Veuillez vous connecter.'
      : 'An account already exists with this email address. Please sign in instead.';
  }
  if (code.includes('auth/invalid-email') || code.includes('invalid-email')) {
    return lang === 'fr'
      ? 'L’adresse e-mail saisie n’est pas valide.'
      : 'The email address entered is not valid.';
  }
  if (code.includes('auth/weak-password') || code.includes('weak-password')) {
    return lang === 'fr'
      ? 'Le mot de passe doit comporter au moins 6 caractères.'
      : 'Password must be at least 6 characters long.';
  }
  if (code.includes('auth/user-not-found') || code.includes('user-not-found')) {
    return lang === 'fr'
      ? 'Aucun compte n’est associé à cette adresse e-mail.'
      : 'No account found with this email address.';
  }
  if (code.includes('auth/wrong-password') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return lang === 'fr'
      ? 'Adresse e-mail ou mot de passe incorrect.'
      : 'Incorrect email or password.';
  }
  if (code.includes('auth/user-disabled') || code.includes('user-disabled')) {
    return lang === 'fr'
      ? 'Ce compte utilisateur a été désactivé. Veuillez contacter le support.'
      : 'This account has been disabled. Please contact support.';
  }
  if (code.includes('auth/network-request-failed') || code.includes('network-request-failed')) {
    return lang === 'fr'
      ? 'Erreur de connexion réseau. Veuillez vérifier votre connexion internet et réessayer.'
      : 'Network error. Please check your internet connection and try again.';
  }
  if (code.includes('auth/too-many-requests') || code.includes('too-many-requests')) {
    return lang === 'fr'
      ? 'Trop de tentatives infructueuses. Veuillez patienter quelques minutes avant de réessayer.'
      : 'Too many attempts. Please wait a few minutes before trying again.';
  }
  if (code.includes('auth/popup-closed-by-user') || code.includes('popup-closed-by-user')) {
    return lang === 'fr'
      ? 'La fenêtre de connexion a été fermée avant la fin de l’authentification.'
      : 'The sign-in window was closed before completion.';
  }
  if (code.includes('auth/popup-blocked') || code.includes('popup-blocked')) {
    return lang === 'fr'
      ? 'La fenêtre pop-up a été bloquée par votre navigateur. Veuillez autoriser les pop-ups.'
      : 'The popup window was blocked by your browser. Please allow popups for this site.';
  }
  if (code.includes('auth/account-exists-with-different-credential') || code.includes('account-exists-with-different-credential')) {
    return lang === 'fr'
      ? 'Un compte existe déjà avec cette adresse via un autre moyen de connexion.'
      : 'An account already exists with this email using a different sign-in method.';
  }
  if (code.includes('auth/operation-not-allowed') || code.includes('operation-not-allowed')) {
    return lang === 'fr'
      ? 'Cette méthode de connexion n’est pas activée actuellement.'
      : 'This sign-in method is currently disabled.';
  }
  if (code.includes('auth/requires-recent-login') || code.includes('requires-recent-login')) {
    return lang === 'fr'
      ? 'Cette opération sensible requiert une reconnexion récente.'
      : 'This action requires recent authentication. Please sign in again.';
  }

  // Firestore & General Errors
  if (code.includes('permission-denied') || code.includes('insufficient permissions')) {
    return lang === 'fr'
      ? 'Accès non autorisé ou droits insuffisants pour cette action.'
      : 'Permission denied. You do not have sufficient access for this action.';
  }
  if (code.includes('unavailable') || code.includes('client is offline') || code.includes('offline')) {
    return lang === 'fr'
      ? 'Le service est temporairement indisponible. Nouvelle tentative de connexion...'
      : 'The service is temporarily unavailable. Retrying connection...';
  }
  if (code.includes('deadline-exceeded')) {
    return lang === 'fr'
      ? 'Le délai de traitement a expiré. Veuillez réessayer.'
      : 'Operation timed out. Please try again.';
  }
  if (code.includes('no document to update') || code.includes('not-found')) {
    return lang === 'fr'
      ? 'Le profil demandé est en cours de création. Veuillez patienter...'
      : 'The profile document is being initialized. Please wait...';
  }

  // General Fallback
  return lang === 'fr'
    ? 'Nous n’avons pas pu terminer l’opération. Veuillez réessayer.'
    : 'We could not complete your request. Please try again.';
}
