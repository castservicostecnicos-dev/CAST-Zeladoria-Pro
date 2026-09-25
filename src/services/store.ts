import { 
  Company, 
  Property, 
  Profile, 
  Task, 
  Routine, 
  TaskRequest, 
  AuditLog, 
  Notification,
  UserRole,
  TaskStatus,
  RequestStatus
} from '../types';
import { 
  initialCompanies, 
  initialProperties, 
  initialProfiles, 
  initialTasks, 
  initialRoutines, 
  initialRequests, 
  initialAuditLogs, 
  initialNotifications
} from './mockData';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';

// LocalStorage Keys for reliable fallback / offline caching
const KEYS = {
  COMPANIES: 'zeladoria_companies_v1',
  PROPERTIES: 'zeladoria_properties_v1',
  PROFILES: 'zeladoria_profiles_v1',
  TASKS: 'zeladoria_tasks_v1',
  ROUTINES: 'zeladoria_routines_v1',
  REQUESTS: 'zeladoria_requests_v1',
  AUDIT: 'zeladoria_audit_v1',
  NOTIFICATIONS: 'zeladoria_notifications_v1',
  SEEDED: 'zeladoria_firestore_seeded_v1',
};

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar no cache local (${key}):`, err);
  }
}

export class DataStore {
  private static isInitialized = false;

  /**
   * Garante que o banco de dados Firestore contenha os dados iniciais
   * independentemente de código ou recarregamentos.
   */
  static async seedFirestoreIfEmpty(): Promise<void> {
    if (!isFirebaseConfigured || this.isInitialized) return;
    this.isInitialized = true;

    try {
      const companiesSnap = await getDocs(collection(db, 'companies'));
      if (!companiesSnap.empty) {
        // Já possui dados no Firestore
        return;
      }

      console.log('Populando Firestore com dados iniciais de demonstração...');
      const batch = writeBatch(db);

      // 1. Companies
      initialCompanies.forEach(c => {
        const ref = doc(db, 'companies', c.id);
        batch.set(ref, c);
      });

      // 2. Properties
      initialProperties.forEach(p => {
        const ref = doc(db, 'properties', p.id);
        batch.set(ref, p);
      });

      // 3. Profiles
      initialProfiles.forEach(u => {
        const ref = doc(db, 'profiles', u.id);
        batch.set(ref, u);
      });

      // 4. Tasks
      initialTasks.forEach(t => {
        const ref = doc(db, 'tasks', t.id);
        batch.set(ref, t);
      });

      // 5. Routines
      initialRoutines.forEach(r => {
        const ref = doc(db, 'routines', r.id);
        batch.set(ref, r);
      });

      // 6. Requests
      initialRequests.forEach(req => {
        const ref = doc(db, 'task_requests', req.id);
        batch.set(ref, req);
      });

      // 7. Audit
      initialAuditLogs.forEach(a => {
        const ref = doc(db, 'audit_logs', a.id);
        batch.set(ref, a);
      });

      // 8. Notifications
      initialNotifications.forEach(n => {
        const ref = doc(db, 'notifications', n.id);
        batch.set(ref, n);
      });

      await batch.commit();
      console.log('Firestore populado com sucesso!');
    } catch (err) {
      console.warn('Aviso durante verificação inicial do Firestore:', err);
    }
  }

  // ---- AUDIT LOG ----
  static async logAction(
    user: Profile, 
    action: string, 
    entity_type: string, 
    entity_id: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const logs = getLocal<AuditLog[]>(KEYS.AUDIT, initialAuditLogs);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      company_id: user.company_id || null,
      user_id: user.id,
      user_name: user.name,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };

    setLocal(KEYS.AUDIT, [newLog, ...logs]);

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'audit_logs', newLog.id), newLog);
      } catch (err) {
        console.warn('Erro ao salvar audit log no Firestore:', err);
      }
    }
  }

  // ---- NOTIFICATIONS ----
  static async getNotifications(userId: string): Promise<Notification[]> {
    if (isFirebaseConfigured) {
      try {
        const q = query(
          collection(db, 'notifications'), 
          where('user_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Notification);
          setLocal(KEYS.NOTIFICATIONS, list);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fallback para notificações locais:', err);
      }
    }
    const all = getLocal<Notification[]>(KEYS.NOTIFICATIONS, initialNotifications);
    return all.filter(n => n.user_id === userId);
  }

  static async createNotification(
    targetUserId: string,
    type: 'info' | 'warning' | 'success' | 'alert',
    title: string,
    message: string,
    companyId?: string
  ): Promise<void> {
    const all = getLocal<Notification[]>(KEYS.NOTIFICATIONS, initialNotifications);
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      company_id: companyId || null,
      user_id: targetUserId,
      type,
      title,
      message,
      read: false,
      created_at: new Date().toISOString(),
    };
    setLocal(KEYS.NOTIFICATIONS, [newNotif, ...all]);

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      } catch (err) {
        console.warn('Erro ao salvar notificação no Firestore:', err);
      }
    }
  }

  static async markNotificationAsRead(id: string): Promise<void> {
    const all = getLocal<Notification[]>(KEYS.NOTIFICATIONS, initialNotifications);
    const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
    setLocal(KEYS.NOTIFICATIONS, updated);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (err) {
        console.warn('Erro ao atualizar notificação no Firestore:', err);
      }
    }
  }

  // ---- COMPANIES (DEV ROLE ONLY) ----
  static async getCompanies(): Promise<Company[]> {
    if (isFirebaseConfigured) {
      try {
        const snap = await getDocs(collection(db, 'companies'));
        if (!snap.empty) {
          const list = snap.docs
            .map(d => d.data() as Company)
            .filter(c => !c.deleted_at);
          setLocal(KEYS.COMPANIES, list);
          return list;
        }
      } catch (e) {
        console.warn('Fallback para local storage (companies):', e);
      }
    }
    const list = getLocal<Company[]>(KEYS.COMPANIES, initialCompanies);
    return list.filter(c => !c.deleted_at);
  }

  static async createCompany(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>, actor: Profile): Promise<Company> {
    const newComp: Company = {
      ...companyData,
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'companies', newComp.id), newComp);
      } catch (e) {
        console.warn('Erro ao inserir company no Firestore, mantendo em cache local:', e);
      }
    }

    const list = getLocal<Company[]>(KEYS.COMPANIES, initialCompanies);
    setLocal(KEYS.COMPANIES, [newComp, ...list]);
    await DataStore.logAction(actor, 'criação de empresa', 'company', newComp.id);
    return newComp;
  }

  static async updateCompany(id: string, updates: Partial<Company>, actor: Profile): Promise<Company> {
    const list = getLocal<Company[]>(KEYS.COMPANIES, initialCompanies);
    const updatedList = list.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    setLocal(KEYS.COMPANIES, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'companies', id), { ...updates, updated_at: new Date().toISOString() });
      } catch (e) {
        console.warn('Erro ao atualizar company no Firestore:', e);
      }
    }

    await DataStore.logAction(actor, 'edição de empresa', 'company', id, updates as Record<string, unknown>);
    return updatedList.find(c => c.id === id)!;
  }

  static async deleteCompany(id: string, actor: Profile): Promise<void> {
    // Soft delete according to Section 51.12
    const list = getLocal<Company[]>(KEYS.COMPANIES, initialCompanies);
    const updatedList = list.map(c => c.id === id ? { ...c, deleted_at: new Date().toISOString(), status: 'Inativa' as const } : c);
    setLocal(KEYS.COMPANIES, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'companies', id), {
          deleted_at: new Date().toISOString(),
          status: 'Inativa'
        });
      } catch (e) {
        console.warn('Erro ao realizar soft delete de company no Firestore:', e);
      }
    }

    await DataStore.logAction(actor, 'exclusão lógica de empresa', 'company', id);
  }

  // ---- PROPERTIES (EMPRESA / ADM_PREDIAL) ----
  static async getProperties(companyId: string): Promise<Property[]> {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'properties'), where('company_id', '==', companyId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Property);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fallback para properties:', err);
      }
    }
    const list = getLocal<Property[]>(KEYS.PROPERTIES, initialProperties);
    return list.filter(p => p.company_id === companyId);
  }

  static async createProperty(propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>, actor: Profile): Promise<Property> {
    const newProp: Property = {
      ...propertyData,
      id: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'properties', newProp.id), newProp);
      } catch (err) {
        console.warn('Erro ao salvar property no Firestore:', err);
      }
    }

    const list = getLocal<Property[]>(KEYS.PROPERTIES, initialProperties);
    setLocal(KEYS.PROPERTIES, [...list, newProp]);
    await DataStore.logAction(actor, 'criação de empreendimento', 'property', newProp.id);
    return newProp;
  }

  // ---- PROFILES / USERS (EMPRESA & DEV) ----
  static async getProfiles(companyId?: string, roleFilter?: UserRole): Promise<Profile[]> {
    if (isFirebaseConfigured) {
      try {
        let q = query(collection(db, 'profiles'));
        if (companyId) {
          q = query(q, where('company_id', '==', companyId));
        }
        if (roleFilter) {
          q = query(q, where('role', '==', roleFilter));
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs
            .map(d => d.data() as Profile)
            .filter(p => !p.deleted_at);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fallback para profiles:', err);
      }
    }

    const list = getLocal<Profile[]>(KEYS.PROFILES, initialProfiles).filter(p => !p.deleted_at);
    return list.filter(p => {
      if (companyId && p.company_id !== companyId) return false;
      if (roleFilter && p.role !== roleFilter) return false;
      return true;
    });
  }

  static async createProfile(profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>, actor: Profile): Promise<Profile> {
    const newProf: Profile = {
      ...profileData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'profiles', newProf.id), newProf);
      } catch (err) {
        console.warn('Erro ao salvar profile no Firestore:', err);
      }
    }

    const list = getLocal<Profile[]>(KEYS.PROFILES, initialProfiles);
    setLocal(KEYS.PROFILES, [...list, newProf]);
    await DataStore.logAction(actor, `criação de usuário ${profileData.role}`, 'profile', newProf.id);
    return newProf;
  }

  static async updateProfile(id: string, updates: Partial<Profile>, actor: Profile): Promise<Profile> {
    const list = getLocal<Profile[]>(KEYS.PROFILES, initialProfiles);
    const updatedList = list.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
    setLocal(KEYS.PROFILES, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'profiles', id), { ...updates, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Erro ao atualizar profile no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, 'edição de usuário', 'profile', id);
    return updatedList.find(p => p.id === id)!;
  }

  static async deleteProfile(id: string, actor: Profile): Promise<void> {
    // Soft delete
    const list = getLocal<Profile[]>(KEYS.PROFILES, initialProfiles);
    const updatedList = list.map(p => p.id === id ? { ...p, deleted_at: new Date().toISOString(), status: 'Inativo' as const } : p);
    setLocal(KEYS.PROFILES, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'profiles', id), {
          deleted_at: new Date().toISOString(),
          status: 'Inativo'
        });
      } catch (err) {
        console.warn('Erro ao excluir profile no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, 'exclusão lógica de usuário', 'profile', id);
  }

  // ---- TASKS (MULTI-TENANT & ROLE-AWARE) ----
  static async getTasks(user: Profile): Promise<Task[]> {
    if (isFirebaseConfigured) {
      try {
        let q = query(collection(db, 'tasks'));
        if (user.role === 'EMPRESA' && user.company_id) {
          q = query(q, where('company_id', '==', user.company_id));
        } else if (user.role === 'ZELADOR') {
          q = query(q, where('assigned_to', '==', user.id));
        } else if (user.role === 'ADM_PREDIAL' && user.property_id) {
          q = query(q, where('property_id', '==', user.property_id));
        }

        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs
            .map(d => d.data() as Task)
            .filter(t => !t.deleted_at);
          return list;
        }
      } catch (err) {
        console.warn('Firestore fallback para tasks:', err);
      }
    }

    const all = getLocal<Task[]>(KEYS.TASKS, initialTasks).filter(t => !t.deleted_at);

    if (user.role === 'DEV') {
      return all;
    }

    if (user.role === 'EMPRESA') {
      return all.filter(t => t.company_id === user.company_id);
    }

    if (user.role === 'ZELADOR') {
      return all.filter(t => t.assigned_to === user.id);
    }

    if (user.role === 'ADM_PREDIAL') {
      return all.filter(t => {
        if (user.property_id && t.property_id === user.property_id) return true;
        if (t.requested_by === user.id) return true;
        return t.company_id === user.company_id;
      });
    }

    return [];
  }

  static async createTask(
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: TaskStatus }, 
    actor: Profile
  ): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      status: taskData.status || 'PENDENTE',
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      photos: taskData.photos || [],
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'tasks', newTask.id), newTask);
      } catch (err) {
        console.warn('Erro ao salvar task no Firestore:', err);
      }
    }

    const list = getLocal<Task[]>(KEYS.TASKS, initialTasks);
    setLocal(KEYS.TASKS, [newTask, ...list]);

    await DataStore.logAction(actor, `criação de tarefa: "${newTask.title}"`, 'task', newTask.id);

    // Notificar o Zelador atribuído
    if (newTask.assigned_to) {
      await DataStore.createNotification(
        newTask.assigned_to,
        'info',
        'Nova Tarefa Atribuída',
        `Você recebeu a tarefa "${newTask.title}" para ${newTask.scheduled_date} às ${newTask.scheduled_time}.`,
        newTask.company_id
      );
    }

    return newTask;
  }

  static async updateTask(id: string, updates: Partial<Task>, actor: Profile): Promise<Task> {
    const list = getLocal<Task[]>(KEYS.TASKS, initialTasks);
    const existing = list.find(t => t.id === id);
    if (!existing) throw new Error('Tarefa não encontrada.');

    // Bloqueio de edição para tarefas já CONCLUÍDAS
    if (existing.status === 'CONCLUIDA' && actor.role !== 'DEV' && actor.role !== 'EMPRESA') {
      throw new Error('Esta tarefa já foi concluída e está bloqueada contra alterações.');
    }

    const updatedTask: Task = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedList = list.map(t => t.id === id ? updatedTask : t);
    setLocal(KEYS.TASKS, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'tasks', id), {
          ...updates,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao atualizar task no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, `atualização de tarefa (${updates.status || 'detalhes'})`, 'task', id);
    return updatedTask;
  }

  static async completeTask(
    id: string, 
    completionDescription: string, 
    photoUrls: string[], 
    actor: Profile
  ): Promise<Task> {
    if (!completionDescription.trim()) {
      throw new Error('A descrição do serviço executado é obrigatória para conclusão.');
    }

    const list = getLocal<Task[]>(KEYS.TASKS, initialTasks);
    const existing = list.find(t => t.id === id);
    if (!existing) throw new Error('Tarefa não encontrada.');

    const newPhotos = photoUrls.map((url, i) => ({
      id: `photo-${Date.now()}-${i}`,
      task_id: id,
      storage_path: url,
      uploaded_by: actor.id,
      created_at: new Date().toISOString(),
    }));

    const updatedTask: Task = {
      ...existing,
      status: 'CONCLUIDA',
      completed_at: new Date().toISOString(),
      completed_by: actor.id,
      completion_description: completionDescription,
      photos: [...(existing.photos || []), ...newPhotos],
      updated_at: new Date().toISOString(),
    };

    const updatedList = list.map(t => t.id === id ? updatedTask : t);
    setLocal(KEYS.TASKS, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'tasks', id), {
          status: 'CONCLUIDA',
          completed_at: updatedTask.completed_at,
          completed_by: actor.id,
          completion_description: completionDescription,
          photos: updatedTask.photos,
          updated_at: updatedTask.updated_at,
        });
      } catch (err) {
        console.warn('Erro ao concluir task no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, `conclusão de tarefa com ${photoUrls.length} foto(s)`, 'task', id);
    return updatedTask;
  }

  static async deleteTask(id: string, actor: Profile): Promise<void> {
    const list = getLocal<Task[]>(KEYS.TASKS, initialTasks);
    const updatedList = list.map(t => t.id === id ? { ...t, deleted_at: new Date().toISOString() } : t);
    setLocal(KEYS.TASKS, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'tasks', id), {
          deleted_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Erro ao excluir task no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, 'exclusão de tarefa', 'task', id);
  }

  static async updateTaskStatus(
    id: string, 
    newStatus: TaskStatus, 
    actor: Profile, 
    extraData?: { completion_description?: string; photo_url?: string }
  ): Promise<Task> {
    if (newStatus === 'CONCLUIDA') {
      return DataStore.completeTask(
        id, 
        extraData?.completion_description || 'Serviço concluído pelo zelador.', 
        extraData?.photo_url ? [extraData.photo_url] : [], 
        actor
      );
    }
    return DataStore.updateTask(id, { status: newStatus }, actor);
  }

  // ---- ROUTINES ----
  static async getRoutines(companyId: string): Promise<Routine[]> {
    if (isFirebaseConfigured) {
      try {
        const q = query(collection(db, 'routines'), where('company_id', '==', companyId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as Routine);
        }
      } catch (err) {
        console.warn('Firestore fallback para rotinas:', err);
      }
    }
    const list = getLocal<Routine[]>(KEYS.ROUTINES, initialRoutines);
    return list.filter(r => r.company_id === companyId);
  }

  static async createRoutine(routineData: Omit<Routine, 'id' | 'created_at' | 'updated_at'>, actor: Profile): Promise<Routine> {
    const newRoutine: Routine = {
      ...routineData,
      id: `rout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'routines', newRoutine.id), newRoutine);
      } catch (err) {
        console.warn('Erro ao salvar rotina no Firestore:', err);
      }
    }

    const list = getLocal<Routine[]>(KEYS.ROUTINES, initialRoutines);
    setLocal(KEYS.ROUTINES, [newRoutine, ...list]);
    await DataStore.logAction(actor, `criação de rotina: ${newRoutine.name}`, 'routine', newRoutine.id);
    return newRoutine;
  }

  static async toggleRoutineStatus(id: string, active: boolean, actor: Profile): Promise<Routine> {
    const list = getLocal<Routine[]>(KEYS.ROUTINES, initialRoutines);
    const updatedList = list.map(r => r.id === id ? { ...r, active, updated_at: new Date().toISOString() } : r);
    setLocal(KEYS.ROUTINES, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'routines', id), { active, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Erro ao atualizar rotina no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, `alteração de status da rotina para ${active ? 'Ativa' : 'Inativa'}`, 'routine', id);
    return updatedList.find(r => r.id === id)!;
  }

  static async deleteRoutine(id: string, actor: Profile): Promise<void> {
    const list = getLocal<Routine[]>(KEYS.ROUTINES, initialRoutines);
    const filtered = list.filter(r => r.id !== id);
    setLocal(KEYS.ROUTINES, filtered);

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'routines', id));
      } catch (err) {
        console.warn('Erro ao excluir rotina no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, 'exclusão de rotina', 'routine', id);
  }

  // ---- TASK REQUESTS (ADM_PREDIAL) ----
  static async getRequests(companyId?: string, propertyId?: string): Promise<TaskRequest[]> {
    if (isFirebaseConfigured) {
      try {
        let q = query(collection(db, 'task_requests'));
        if (companyId) {
          q = query(q, where('company_id', '==', companyId));
        }
        if (propertyId) {
          q = query(q, where('property_id', '==', propertyId));
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as TaskRequest);
        }
      } catch (err) {
        console.warn('Firestore fallback para task_requests:', err);
      }
    }

    const list = getLocal<TaskRequest[]>(KEYS.REQUESTS, initialRequests);
    return list.filter(r => {
      if (companyId && r.company_id !== companyId) return false;
      if (propertyId && r.property_id !== propertyId) return false;
      return true;
    });
  }

  static async createRequest(
    requestData: Omit<TaskRequest, 'id' | 'created_at' | 'updated_at' | 'status'> & { status?: RequestStatus }, 
    actor: Profile
  ): Promise<TaskRequest> {
    const newReq: TaskRequest = {
      ...requestData,
      status: requestData.status || 'SOLICITADA',
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'task_requests', newReq.id), newReq);
      } catch (err) {
        console.warn('Erro ao salvar task_request no Firestore:', err);
      }
    }

    const list = getLocal<TaskRequest[]>(KEYS.REQUESTS, initialRequests);
    setLocal(KEYS.REQUESTS, [newReq, ...list]);
    await DataStore.logAction(actor, `abertura de solicitação: "${newReq.title}"`, 'request', newReq.id);
    return newReq;
  }

  static async updateRequest(id: string, updates: Partial<TaskRequest>, actor: Profile): Promise<TaskRequest> {
    const list = getLocal<TaskRequest[]>(KEYS.REQUESTS, initialRequests);
    const updatedList = list.map(r => r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r);
    setLocal(KEYS.REQUESTS, updatedList);

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'task_requests', id), {
          ...updates,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao atualizar solicitação no Firestore:', err);
      }
    }

    await DataStore.logAction(actor, `atualização de solicitação (${updates.status || 'dados'})`, 'request', id);
    return updatedList.find(r => r.id === id)!;
  }

  static async processRequest(
    requestId: string,
    decision: 'APROVADA' | 'RECUSADA',
    assignedZeladorId: string | null,
    actor: Profile,
    rejectionReason?: string
  ): Promise<void> {
    const list = getLocal<TaskRequest[]>(KEYS.REQUESTS, initialRequests);
    const req = list.find(r => r.id === requestId);
    if (!req) throw new Error('Solicitação não encontrada');

    if (decision === 'APROVADA') {
      if (!assignedZeladorId) throw new Error('Zelador deve ser selecionado');

      const newTask = await DataStore.createTask({
        company_id: req.company_id,
        property_id: req.property_id,
        title: req.title,
        description: req.description,
        location: req.location,
        category: 'Solicitação Predial',
        priority: req.priority,
        status: 'PENDENTE',
        assigned_to: assignedZeladorId,
        created_by: actor.id,
        requested_by: req.requested_by,
        scheduled_date: req.desired_date,
        scheduled_time: req.desired_time,
        notes: req.notes,
        photos: req.photos ? req.photos.map((p, idx) => ({
          id: `req-photo-${Date.now()}-${idx}`,
          task_id: '',
          storage_path: p,
          uploaded_by: req.requested_by,
          created_at: new Date().toISOString()
        })) : [],
      }, actor);

      await DataStore.updateRequest(requestId, {
        status: 'CONVERTIDA_EM_TAREFA',
        converted_task_id: newTask.id,
      }, actor);

      // Notificar o ADM Predial que solicitou
      await DataStore.createNotification(
        req.requested_by,
        'success',
        'Solicitação Aprovada',
        `Sua solicitação "${req.title}" foi aprovada e convertida na tarefa #${newTask.id.slice(-4)}.`,
        req.company_id
      );
    } else {
      await DataStore.updateRequest(requestId, {
        status: 'RECUSADA',
        rejection_reason: rejectionReason || 'Não especificado',
      }, actor);

      // Notificar o ADM Predial que foi recusada
      await DataStore.createNotification(
        req.requested_by,
        'alert',
        'Solicitação Recusada',
        `Sua solicitação "${req.title}" foi recusada. Motivo: ${rejectionReason || 'Sem justificativa informada'}.`,
        req.company_id
      );
    }
  }

  static async generateTasksFromRoutines(companyId: string, actor: Profile): Promise<number> {
    const routines = await DataStore.getRoutines(companyId);
    const activeRoutines = routines.filter(r => r.active);
    const todayStr = new Date().toISOString().split('T')[0];

    let createdCount = 0;
    for (const r of activeRoutines) {
      await DataStore.createTask({
        company_id: r.company_id,
        property_id: r.property_id,
        title: `[Rotina] ${r.name}`,
        description: r.description,
        location: r.location,
        category: r.category,
        priority: r.priority,
        status: 'PENDENTE',
        assigned_to: r.assigned_to,
        created_by: actor.id,
        scheduled_date: todayStr,
        scheduled_time: r.scheduled_time,
        recurrence: r.frequency,
      }, actor);
      createdCount++;
    }

    return createdCount;
  }

  // ---- AUDIT LOG QUERY ----
  static async getAuditLogs(companyId?: string): Promise<AuditLog[]> {
    if (isFirebaseConfigured) {
      try {
        let q = query(collection(db, 'audit_logs'), orderBy('created_at', 'desc'), limit(100));
        if (companyId) {
          q = query(collection(db, 'audit_logs'), where('company_id', '==', companyId), limit(100));
        }
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as AuditLog);
        }
      } catch (err) {
        console.warn('Firestore fallback para audit_logs:', err);
      }
    }
    const all = getLocal<AuditLog[]>(KEYS.AUDIT, initialAuditLogs);
    return companyId ? all.filter(l => l.company_id === companyId) : all;
  }
}
