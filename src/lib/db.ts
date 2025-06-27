import type { AppData } from '@/types';
import { INITIAL_GUEST_GROUPS } from './constants';

const DB_KEY = 'bellaNoteWeddingPlannerData';

const getDefaultAppData = (): AppData => ({
  weddingDate: null,
  budget: { total: 0, categories: [] },
  transactions: [],
  vendors: [],
  guests: [],
  tasks: [],
  gifts: [],
  guestGroups: [...INITIAL_GUEST_GROUPS],
  userProfile: {},
  weddingDetails: {},
  selectedPackages: [],
});

export const db = {
  initialize: (): Promise<void> => {
    return new Promise((resolve) => {
      if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify(getDefaultAppData()));
      } else {
        // Ensure guestGroups is populated if missing from older data
        const data = JSON.parse(localStorage.getItem(DB_KEY)!) as AppData;
        if (!data.guestGroups || data.guestGroups.length === 0) {
          data.guestGroups = [...INITIAL_GUEST_GROUPS];
          localStorage.setItem(DB_KEY, JSON.stringify(data));
        }
        // Ensure userProfile and weddingDetails exist
        if (!data.userProfile) {
          data.userProfile = {};
        }
        if (!data.weddingDetails) {
          data.weddingDetails = {};
        }
        localStorage.setItem(DB_KEY, JSON.stringify(data));
      }
      resolve();
    });
  },

  getData: (): Promise<AppData | null> => {
    return new Promise((resolve) => {
      const data = localStorage.getItem(DB_KEY);
      if (data) {
        const parsedData = JSON.parse(data) as AppData;
        // Ensure all top-level keys from getDefaultAppData exist
        const defaultData = getDefaultAppData();
        let needsUpdate = false;
        for (const key in defaultData) {
          if (!(key in parsedData)) {
            (parsedData as any)[key] = (defaultData as any)[key];
            needsUpdate = true;
          }
        }
        if (needsUpdate) {
          localStorage.setItem(DB_KEY, JSON.stringify(parsedData));
        }
        resolve(parsedData);
      } else {
        const defaultData = getDefaultAppData();
        localStorage.setItem(DB_KEY, JSON.stringify(defaultData));
        resolve(defaultData);
      }
    });
  },

  updateData: (newData: Partial<AppData>): Promise<AppData> => {
    return new Promise((resolve, reject) => {
      try {
        const currentDataString = localStorage.getItem(DB_KEY);
        let currentData = currentDataString ? JSON.parse(currentDataString) as AppData : getDefaultAppData();
        
        // Deep merge for nested objects like budget, userProfile, weddingDetails
        const updatedData = { ...currentData };

        for (const key in newData) {
          const k = key as keyof AppData;
          if (typeof newData[k] === 'object' && newData[k] !== null && !Array.isArray(newData[k])) {
             // Ensure the property exists on currentData before merging
            if (typeof updatedData[k] !== 'object' || updatedData[k] === null) {
              updatedData[k] = {} as any; // Initialize if not an object
            }
            updatedData[k] = { ...updatedData[k], ...newData[k] } as any;
          } else {
            (updatedData as any)[k] = newData[k];
          }
        }
        
        localStorage.setItem(DB_KEY, JSON.stringify(updatedData));
        resolve(updatedData);
      } catch (error) {
        console.error("Failed to update data in localStorage:", error);
        reject(error);
      }
    });
  },

  clearData: (): Promise<void> => {
    return new Promise((resolve) => {
      localStorage.removeItem(DB_KEY);
      resolve();
    });
  }
};