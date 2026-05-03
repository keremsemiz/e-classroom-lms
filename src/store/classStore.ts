import { create } from 'zustand';

interface ClassState {
  currentClassId: string | null;
  currentClass: {
    id: string;
    name: string;
    code: string;
    color: string;
  } | null;
  
  setCurrentClass: (classData: ClassState['currentClass']) => void;
  clearCurrentClass: () => void;
}

export const useClassStore = create<ClassState>((set) => ({
  currentClassId: null,
  currentClass: null,

  setCurrentClass: (classData) => set({ currentClass: classData, currentClassId: classData?.id || null }),
  clearCurrentClass: () => set({ currentClass: null, currentClassId: null }),
}));
