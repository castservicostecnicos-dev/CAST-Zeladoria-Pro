import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Company, UserRole, Property } from '../types';
import { DataStore } from '../services/store';
import { initialProfiles } from '../services/mockData';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { safeGetLocal, safeSetLocal } from '../lib/storageManager';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: Profile | null;
  company: Company | null;
  property: Property | null;
  role: UserRole | null;
  isDemoMode: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  switchDemoRole: (targetRole: UserRole) => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updateCurrentUser: (updates: Partial<Profile>) => Promise<void>;
  currentPath: string;
  navigate: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'zeladoria_session_user_v1';
const DEMO_MODE_KEY = 'zeladoria_demo_active_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<string>('/login');

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
  };

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initialize session & bootstrap Firestore
  useEffect(() => {
    let isMounted = true;

    // Failsafe timeout: garante que nunca fique preso na tela de carregamento
    const failsafe = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 2500);

    const initSession = async () => {
      try {
        // Iniciar população do Firestore em background sem travar a interface
        DataStore.seedFirestoreIfEmpty().catch(err => {
          console.warn('Aviso de seed Firestore em background:', err);
        });

        const savedUserJson = safeGetLocal<Profile | null>(AUTH_STORAGE_KEY, null);
        const demoStored = safeGetLocal<string>(DEMO_MODE_KEY, 'true');
        if (isMounted) {
          setIsDemoMode(demoStored !== 'false');
        }

        if (savedUserJson) {
          const parsedUser = savedUserJson;
          if (isMounted) {
            setUser(parsedUser);
          }
          try {
            await loadRelations(parsedUser);
          } catch (relErr) {
            console.warn('Erro ao carregar relações do perfil:', relErr);
          }
          
          // Auto route if on /login
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            routeUser(parsedUser.role);
          } else {
            if (isMounted) setCurrentPath(window.location.pathname);
          }
        } else {
          // Default to login
          if (isMounted) {
            setCurrentPath(window.location.pathname === '/' ? '/login' : window.location.pathname);
          }
        }
      } catch (err) {
        console.error('Erro inicializando sessão:', err);
      } finally {
        clearTimeout(failsafe);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
    };
  }, []);

  const loadRelations = async (profile: Profile) => {
    if (profile.company_id) {
      const companies = await DataStore.getCompanies();
      const comp = companies.find(c => c.id === profile.company_id) || null;
      setCompany(comp);

      if (profile.property_id) {
        const properties = await DataStore.getProperties(profile.company_id);
        const prop = properties.find(p => p.id === profile.property_id) || null;
        setProperty(prop);
      } else {
        setProperty(null);
      }
    } else {
      setCompany(null);
      setProperty(null);
    }
  };

  const routeUser = (role: UserRole) => {
    switch (role) {
      case 'DEV':
        navigate('/dev');
        break;
      case 'EMPRESA':
        navigate('/empresa');
        break;
      case 'ZELADOR':
        navigate('/zelador');
        break;
      case 'ADM_PREDIAL':
        navigate('/adm-predial');
        break;
      default:
        navigate('/login');
    }
  };

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);

    // Se Firebase Auth estiver disponível e não for usuário demo simulado
    if (isFirebaseConfigured && auth && password && !email.endsWith('@demo.com')) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          // Buscar perfil no Firestore
          const q = query(collection(db, 'profiles'), where('email', '==', email.toLowerCase().trim()));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const profileData = snap.docs[0].data() as Profile;
            if (profileData.status === 'Inativo') {
              await firebaseSignOut(auth);
              setIsLoading(false);
              return { success: false, message: 'Seu acesso está desativado. Entre em contato com o administrador.' };
            }

            setUser(profileData);
            safeSetLocal(AUTH_STORAGE_KEY, profileData);
            setIsDemoMode(false);
            safeSetLocal(DEMO_MODE_KEY, 'false');
            await loadRelations(profileData);
            routeUser(profileData.role);
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (e: any) {
        console.warn('Falha na autenticação Firebase Auth, tentando consulta ao banco Firestore:', e?.message || e);
      }
    }

    // Consulta ao Firestore / LocalStore para perfis cadastrados
    const profiles = await DataStore.getProfiles();
    const matched = profiles.find(p => p.email.toLowerCase().trim() === email.toLowerCase().trim());

    if (!matched) {
      setIsLoading(false);
      return { success: false, message: 'Usuário não cadastrado no sistema.' };
    }

    if (matched.status === 'Inativo') {
      setIsLoading(false);
      return { success: false, message: 'Seu acesso está desativado. Entre em contato com o administrador.' };
    }

    // Validação de senha direta (sem necessidade de link de e-mail)
    if (password) {
      const expectedPassword = matched.password || '123456';
      if (password !== expectedPassword) {
        setIsLoading(false);
        return { 
          success: false, 
          message: 'Senha incorreta. Verifique a senha digitada ou solicite a redefinição direta ao Administrador DEV.' 
        };
      }
    }

    // Verifica status da empresa se não for DEV
    if (matched.role !== 'DEV' && matched.company_id) {
      const companies = await DataStore.getCompanies();
      const comp = companies.find(c => c.id === matched.company_id);
      if (comp && comp.status === 'Inativa') {
        setIsLoading(false);
        return { success: false, message: 'A empresa deste usuário está inativa. Entre em contato com o administrador.' };
      }
    }

    setUser(matched);
    safeSetLocal(AUTH_STORAGE_KEY, matched);
    await loadRelations(matched);
    await DataStore.logAction(matched, 'login', 'auth', matched.id);
    routeUser(matched.role);
    setIsLoading(false);
    return { success: true };
  };

  const signOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Erro ao deslogar do Firebase:', err);
      }
    }
    if (user) {
      await DataStore.logAction(user, 'logout', 'auth', user.id);
    }
    setUser(null);
    setCompany(null);
    setProperty(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    navigate('/login');
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    setIsDemoMode(true);
    safeSetLocal(DEMO_MODE_KEY, 'true');

    const profiles = await DataStore.getProfiles();
    const target = profiles.find(p => p.role === targetRole) || initialProfiles.find(p => p.role === targetRole)!;
    setUser(target);
    safeSetLocal(AUTH_STORAGE_KEY, target);
    await loadRelations(target);
    await DataStore.logAction(target, `mudança de perfil em demonstração (${targetRole})`, 'auth', target.id);
    routeUser(targetRole);
    setIsLoading(false);
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    if (isFirebaseConfigured && auth) {
      try {
        await sendPasswordResetEmail(auth, email);
        return true;
      } catch (err) {
        console.warn('Erro enviando reset de senha Firebase:', err);
      }
    }
    return true;
  };

  const updateCurrentUser = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) return;
    const safeUpdates: Partial<Profile> = {
      name: updates.name ?? user.name,
      phone: updates.phone ?? user.phone,
      photo_url: updates.photo_url ?? user.photo_url,
      cpf: updates.cpf ?? user.cpf,
      address: updates.address ?? user.address,
      city: updates.city ?? user.city,
      state: updates.state ?? user.state,
    };

    const updated = await DataStore.updateProfile(user.id, safeUpdates, user);
    setUser(updated);
    safeSetLocal(AUTH_STORAGE_KEY, updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        property,
        role: user?.role || null,
        isDemoMode,
        isLoading,
        signIn,
        signOut,
        switchDemoRole,
        requestPasswordReset,
        updateCurrentUser,
        currentPath,
        navigate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
