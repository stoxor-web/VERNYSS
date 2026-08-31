import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { FirebaseError } from 'firebase/app';

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  auth,
  db,
} from '../firebase/config';

import { logger } from '../security/logger';

export type AuthorizationState =
  | 'loading'
  | 'signedOut'
  | 'authorized'
  | 'unauthorized'
  | 'locked'
  | 'error';

interface AuthContextValue {
  user: User | null;
  state: AuthorizationState;
  errorMessage: string | null;
  signIn: () => Promise<void>;
  signOutNow: () => Promise<void>;
  lock: () => void;
  unlock: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

async function checkAllowlist(user: User): Promise<boolean> {
  const reference = doc(
    db,
    'authorizedUsers',
    user.uid,
  );

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return false;
  }

  const data = snapshot.data();

  return data.active === true;
}

function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Une erreur inattendue est survenue.';
  }

  switch (error.code) {
    case 'auth/user-disabled':
      return 'Ce compte Google a été désactivé.';

    case 'auth/network-request-failed':
      return 'Impossible de joindre le service de connexion. Vérifiez votre réseau.';

    case 'auth/popup-blocked':
      return 'La fenêtre de connexion Google a été bloquée par le navigateur.';

    case 'auth/unauthorized-domain':
      return 'Ce domaine n’est pas autorisé dans Firebase Authentication.';

    case 'auth/operation-not-allowed':
      return 'La connexion Google n’est pas activée dans Firebase.';

    case 'auth/popup-closed-by-user':
      return '';

    default:
      return 'Connexion impossible. Réessayez.';
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [state, setState] =
    useState<AuthorizationState>('loading');

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (nextUser) => {
        if (cancelled) {
          return;
        }

        setUser(nextUser);
        setErrorMessage(null);

        if (nextUser === null) {
          setState('signedOut');
          return;
        }

        setState('loading');

        try {
          const allowed =
            await checkAllowlist(nextUser);

          if (cancelled) {
            return;
          }

          setState(
            allowed
              ? 'authorized'
              : 'unauthorized',
          );
        } catch (error: unknown) {
          if (cancelled) {
            return;
          }

          logger.error(
            'Authorization check failed',
            {
              kind:
                error instanceof Error
                  ? error.name
                  : 'unknown',
            },
          );

          setErrorMessage(
            'Impossible de vérifier votre autorisation. Vérifiez votre connexion puis réessayez.',
          );

          setState('error');
        }
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async () => {
    setErrorMessage(null);

    try {
      await signInWithPopup(
        auth,
        googleProvider,
      );
    } catch (error: unknown) {
      const message =
        getAuthErrorMessage(error);

      if (message !== '') {
        setErrorMessage(message);
      }

      if (
        !(
          error instanceof FirebaseError &&
          error.code ===
            'auth/popup-closed-by-user'
        )
      ) {
        logger.error(
          'Google sign-in failed',
          {
            kind:
              error instanceof Error
                ? error.name
                : 'unknown',
          },
        );
      }
    }
  }, []);

  const signOutNow =
    useCallback(async () => {
      setErrorMessage(null);

      try {
        await signOut(auth);
      } catch (error: unknown) {
        logger.error(
          'Sign-out failed',
          {
            kind:
              error instanceof Error
                ? error.name
                : 'unknown',
          },
        );

        setErrorMessage(
          'La déconnexion a échoué. Réessayez.',
        );
      }
    }, []);

  const lock = useCallback(() => {
    if (user !== null) {
      setState('locked');
    }
  }, [user]);

  const unlock =
    useCallback(async () => {
      if (user === null) {
        setState('signedOut');
        return;
      }

      setErrorMessage(null);

      try {
        await reauthenticateWithPopup(
          user,
          googleProvider,
        );

        const allowed =
          await checkAllowlist(user);

        setState(
          allowed
            ? 'authorized'
            : 'unauthorized',
        );
      } catch (error: unknown) {
        logger.error(
          'Application unlock failed',
          {
            kind:
              error instanceof Error
                ? error.name
                : 'unknown',
          },
        );

        setErrorMessage(
          'La réauthentification est nécessaire pour déverrouiller VERNYSS.',
        );

        setState('locked');
      }
    }, [user]);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,
        state,
        errorMessage,
        signIn,
        signOutNow,
        lock,
        unlock,
      }),
      [
        user,
        state,
        errorMessage,
        signIn,
        signOutNow,
        lock,
        unlock,
      ],
    );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context =
    useContext(AuthContext);

  if (context === null) {
    throw new Error(
      'useAuth doit être utilisé à l’intérieur de AuthProvider.',
    );
  }

  return context;
}