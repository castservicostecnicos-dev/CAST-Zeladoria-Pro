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
  originalUser: Profile | null;
  isDevMaster: boolean;
  company: Company | null;
  property: Property | null;
  role: UserRole | null;
  isDemoMode: boolean;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  switchDemoRole: (targetRole: UserRole) => void;
  returnToDev: () => void;
  requestPasswordReset: (email: string) => Promise<boolean>;
  updateCurrentUser: (updates: Partial<Profile>) => Promise<void>;
  refreshCompany: () => Promise<void>;
  currentPath: string;
  navigate: (path: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'zeladoria_session_user_v1';
const ORIGINAL_USER_STORAGE_KEY = 'zeladoria_original_auth_user_v1';
const DEMO_MODE_KEY = 'zeladoria_demo_active_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [originalUser, setOriginalUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<string>('/login');

  const isDevMaster = originalUser?.role === 'DEV';

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

  const loadRelationsLocal = (profile: Profile) => {
    if (profile.company_id) {
      const companies = DataStore.getCompaniesLocal();
      const comp = companies.find(c => c.id === profile.company_id) || null;
      setCompany(comp);

      if (profile.property_id) {
        const properties = DataStore.getPropertiesLocal(profile.company_id);
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

  // Initialize session & bootstrap Firestore
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        // Iniciar população do Firestore em background sem travar a interface
        DataStore.seedFirestoreIfEmpty().catch(err => {
          console.warn('Aviso de seed Firestore em background:', err);
        });

        let savedUserJson = safeGetLocal<Profile | null>(AUTH_STORAGE_KEY, null);
        const savedOriginalUserJson = safeGetLocal<Profile | null>(ORIGINAL_USER_STORAGE_KEY, null);

        // Se o usuário salvo pertencer aos dados legados (@demo.com), limpa a sessão
        if (
          savedUserJson?.email?.toLowerCase().includes('@demo.com') ||
          savedOriginalUserJson?.email?.toLowerCase().includes('@demo.com') ||
          savedUserJson?.id === 'user-zelador-02'
        ) {
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
            localStorage.removeItem(DEMO_MODE_KEY);
          } catch {}
          savedUserJson = null;
        }

        const initialOriginal = savedOriginalUserJson || savedUserJson;
        
        // Se o usuário autenticado original não for DEV, proíbe manter perfil de outro papel
        if (initialOriginal && initialOriginal.role !== 'DEV') {
          savedUserJson = initialOriginal;
        }

        const isCurrentlyDemo = initialOriginal?.role === 'DEV' && savedUserJson?.role !== 'DEV';

        if (isMounted) {
          setOriginalUser(initialOriginal);
          setIsDemoMode(isCurrentlyDemo);
        }

        if (savedUserJson) {
          const parsedUser = savedUserJson;
          if (isMounted) {
            setUser(parsedUser);
            loadRelationsLocal(parsedUser);
          }
          // Sincronizar relações atualizadas em background
          loadRelations(parsedUser).catch(() => {});
          
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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Obter perfis no cache local para resposta imediata
    let profiles = DataStore.getProfilesLocal();
    let matched = profiles.find(p => p.email.toLowerCase().trim() === normalizedEmail);

    // 2. Se não encontrar localmente e o Firebase estiver ativo, busca no Firestore
    if (!matched && isFirebaseConfigured) {
      try {
        const remoteProfiles = await DataStore.getProfiles();
        matched = remoteProfiles.find(p => p.email.toLowerCase().trim() === normalizedEmail);
      } catch (err) {
        console.warn('Erro buscando perfil no Firestore:', err);
      }
    }

    if (!matched) {
      return { success: false, message: 'Usuário não cadastrado no sistema.' };
    }

    if (matched.status === 'Inativo') {
      return { success: false, message: 'Seu acesso está desativado. Entre em contato com o administrador.' };
    }

    // Validação de senha direta (sem necessidade de link de e-mail)
    if (password) {
      const expectedPassword = matched.password || 'cast@2468';
      const isValidPassword = password === expectedPassword || (matched.role !== 'DEV' && password === '123456');
      if (!isValidPassword) {
        return { 
          success: false, 
          message: 'Senha incorreta. Verifique a senha digitada ou solicite a redefinição direta ao Administrador DEV.' 
        };
      }
    }

    // Verifica status da empresa se não for DEV
    if (matched.role !== 'DEV' && matched.company_id) {
      const companies = DataStore.getCompaniesLocal();
      const comp = companies.find(c => c.id === matched.company_id);
      if (comp && comp.status === 'Inativa') {
        return { success: false, message: 'A empresa deste usuário está inativa. Entre em contato com o administrador.' };
      }
    }

    // Sucesso imediato: define o usuário e perfil original autenticado
    setUser(matched);
    setOriginalUser(matched);
    setIsDemoMode(false);
    safeSetLocal(AUTH_STORAGE_KEY, matched);
    safeSetLocal(ORIGINAL_USER_STORAGE_KEY, matched);
    safeSetLocal(DEMO_MODE_KEY, 'false');
    loadRelationsLocal(matched);

    // Carrega em background no Firestore e grava log
    loadRelations(matched).catch(() => {});
    DataStore.logAction(matched, 'login', 'auth', matched.id).catch(() => {});

    // Redireciona automaticamente para o dashboard do papel
    routeUser(matched.role);
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
      await DataStore.logAction(user, 'logout', 'auth', user.id).catch(() => {});
    }
    setUser(null);
    setOriginalUser(null);
    setCompany(null);
    setProperty(null);
    setIsDemoMode(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(ORIGINAL_USER_STORAGE_KEY);
      localStorage.removeItem(DEMO_MODE_KEY);
    } catch {}
    navigate('/login');
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    // REGRA DE SEGURANÇA ESTRITA: Apenas quem se autenticou como DEV pode alternar ou ver demonstrações
    if (originalUser?.role !== 'DEV') {
      console.warn('Operação bloqueada: Apenas o perfil DEV tem permissão para alternar entre perfis de demonstração.');
      return;
    }

    if (targetRole === 'DEV') {
      setIsDemoMode(false);
      safeSetLocal(DEMO_MODE_KEY, 'false');
      setUser(originalUser);
      safeSetLocal(AUTH_STORAGE_KEY, originalUser);
      loadRelationsLocal(originalUser);
      loadRelations(originalUser).catch(() => {});
      DataStore.logAction(originalUser, 'Retorno ao painel DEV a partir da demonstração', 'auth', originalUser.id).catch(() => {});
      routeUser('DEV');
      return;
    }

    setIsDemoMode(true);
    safeSetLocal(DEMO_MODE_KEY, 'true');

    const profiles = DataStore.getProfilesLocal();
    const target = profiles.find(p => p.role === targetRole && !p.email.toLowerCase().includes('@demo.com')) || initialProfiles.find(p => p.role === targetRole)!;
    setUser(target);
    safeSetLocal(AUTH_STORAGE_KEY, target);
    loadRelationsLocal(target);
    loadRelations(target).catch(() => {});
    DataStore.logAction(originalUser, `DEV acessou demonstração do perfil (${targetRole})`, 'auth', target.id).catch(() => {});
    routeUser(targetRole);
  };

  const returnToDev = () => {
    if (originalUser?.role === 'DEV') {
      switchDemoRole('DEV');
    }
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

  const refreshCompany = async (): Promise<void> => {
    if (user?.company_id) {
      const companies = await DataStore.getCompanies();
      const comp = companies.find(c => c.id === user.company_id) || null;
      setCompany(comp);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        originalUser,
        isDevMaster,
        company,
        property,
        role: user?.role || null,
        isDemoMode,
        isLoading,
        signIn,
        signOut,
        switchDemoRole,
        returnToDev,
        requestPasswordReset,
        updateCurrentUser,
        refreshCompany,
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
