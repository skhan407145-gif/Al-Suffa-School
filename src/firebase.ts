import { 
  INITIAL_STUDENTS, 
  getInitialFees, 
  getInitialAttendance, 
  INITIAL_INVENTORY,
  INITIAL_RESULTS,
  INITIAL_FEEDBACKS,
  INITIAL_LEAVES,
  INITIAL_TEACHERS
} from './initialData';

// Mock DB and Auth exports to keep existing imports/typing compatible
export const db = {} as any;
export const auth = {
  currentUser: null
} as any;

export let isFirebaseConnected = false;

// Reactive in-memory database store
const memoryStore: Record<string, any[]> = {
  student: [],
  teacher: [],
  admin: [],
  fees: [],
  attendance: [],
  inventory: [],
  results: [],
  feedbacks: [],
  leaves: []
};

// Subscription listeners mapping collection names to sets of callbacks
const subscribers: Record<string, Set<(data: any[]) => void>> = {};

// Trigger all active callbacks with a deep copy of the array
function notifySubscribers(collectionName: string) {
  const data = memoryStore[collectionName] || [];
  const copy = JSON.parse(JSON.stringify(data));
  if (subscribers[collectionName]) {
    subscribers[collectionName].forEach((cb) => {
      try {
        cb(copy);
      } catch (err) {
        console.error(`Error in subscriber callback for ${collectionName}:`, err);
      }
    });
  }
}

// Persist the current state of a collection to localStorage for an optimal offline-first experience
function saveToLocalStorage(collectionName: string) {
  try {
    localStorage.setItem(`school_db_${collectionName}`, JSON.stringify(memoryStore[collectionName]));
  } catch (err) {
    console.error(`Error saving ${collectionName} to localStorage:`, err);
  }
}

// Helper to subscribe to real-time updates of an in-memory collection
export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: T[]) => void,
  onError?: (error: any) => void
): () => void {
  if (!subscribers[collectionName]) {
    subscribers[collectionName] = new Set();
  }
  subscribers[collectionName].add(callback);
  
  // Immediately trigger the callback with the current state of the collection
  const currentData = memoryStore[collectionName] || [];
  callback(JSON.parse(JSON.stringify(currentData)));

  return () => {
    subscribers[collectionName].delete(callback);
  };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('In-memory Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to fetch all documents from an in-memory collection
export async function getAllDocuments<T>(collectionName: string): Promise<T[]> {
  const data = memoryStore[collectionName] || [];
  return JSON.parse(JSON.stringify(data)) as T[];
}

// Helper to save/update an in-memory document
export async function saveDocument(collectionName: string, id: string | number, data: any): Promise<void> {
  if (!memoryStore[collectionName]) {
    memoryStore[collectionName] = [];
  }
  
  const numericId = isNaN(Number(id)) ? id : Number(id);
  const docData = { ...data, id: numericId };
  
  const index = memoryStore[collectionName].findIndex(item => item.id === numericId);
  if (index > -1) {
    memoryStore[collectionName][index] = { ...memoryStore[collectionName][index], ...docData };
  } else {
    memoryStore[collectionName].push(docData);
  }
  
  saveToLocalStorage(collectionName);
  notifySubscribers(collectionName);
}

// Helper to delete an in-memory document
export async function deleteDocument(collectionName: string, id: string | number): Promise<void> {
  if (!memoryStore[collectionName]) return;
  
  const numericId = isNaN(Number(id)) ? id : Number(id);
  memoryStore[collectionName] = memoryStore[collectionName].filter(item => item.id !== numericId);
  
  saveToLocalStorage(collectionName);
  notifySubscribers(collectionName);
}

// Helper to check and seed initial data if empty (operating offline in-memory)
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  let seeded = false;
  
  const collectionsToSeed = [
    { name: 'student', initial: INITIAL_STUDENTS },
    { name: 'teacher', initial: INITIAL_TEACHERS },
    { name: 'admin', initial: [
      { id: 1, name: 'Principal Office (Admin)', email: 'admin@alsuffa.edu.pk', password: 'admin123', contact: '+92 42 11112233' }
    ]},
    { name: 'fees', initial: getInitialFees() },
    { name: 'attendance', initial: getInitialAttendance() },
    { name: 'inventory', initial: INITIAL_INVENTORY },
    { name: 'results', initial: INITIAL_RESULTS },
    { name: 'feedbacks', initial: INITIAL_FEEDBACKS },
    { name: 'leaves', initial: INITIAL_LEAVES }
  ];
  
  for (const col of collectionsToSeed) {
    const saved = localStorage.getItem(`school_db_${col.name}`);
    if (saved) {
      try {
        memoryStore[col.name] = JSON.parse(saved);
      } catch (e) {
        memoryStore[col.name] = [...col.initial];
        seeded = true;
      }
    } else {
      memoryStore[col.name] = [...col.initial];
      seeded = true;
    }
    notifySubscribers(col.name);
  }
  
  return seeded;
}
