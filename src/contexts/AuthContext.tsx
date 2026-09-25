import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Company, UserRole, Property } from '../types';
import { DataStore } from '../services/store';
import { initialProfiles } from '../services/mockData';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
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
    const initSession = async () => {
      try {
        // Garantir dados no Firestore caso esteja vazio
        await DataStore.seedFirestoreIfEmpty();

        const savedUserJson = localStorage.getItem(AUTH_STORAGE_KEY);
        const demoStored = localStorage.getItem(DEMO_MODE_KEY);
        setIsDemoMode(demoStored !== 'false');

        if (savedUserJson) {
          const parsedUser = JSON.parse(savedUserJson) as Profile;
          setUser(parsedUser);
          await loadRelations(parsedUser);
          
          // Auto route if on /login
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            routeUser(parsedUser.role);
          } else {
            setCurrentPath(window.location.pathname);
          }
        } else {
          // Default to login
          setCurrentPath(window.location.pathname === '/' ? '/login' : window.location.pathname);
        }
      } catch (err) {
        console.error('Erro inicializando sessão:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
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
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profileData));
            setIsDemoMode(false);
            localStorage.setItem(DEMO_MODE_KEY, 'false');
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
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
    localStorage.removeItem(AUTH_STORAGE_KEY);
    navigate('/login');
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    setIsDemoMode(true);
    localStorage.setItem(DEMO_MODE_KEY, 'true');

    const profiles = await DataStore.getProfiles();
    const target = profiles.find(p => p.role === targetRole) || initialProfiles.find(p => p.role === targetRole)!;
    setUser(target);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(target));
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
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
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
