its
import { ExperimentResult } from "../types";

/**
 * GOOGLE SHEETS INTEGRATION (ACTIVE):
 * Data is being synced to: https://sheetdb.io/api/v1/0rygha3cscbk9
 */
const REAL_CLOUD_API_URL = 'https://sheetdb.io/api/v1/0rygha3cscbk9'; 

const LOCAL_STORAGE_KEY = 'chroma_global_vault';

export const DataService = {
  isCloudConnected: (): boolean => {
    return REAL_CLOUD_API_URL.length > 0;
  },

  getParticipantId: (): string => {
    let pid = typeof window !== 'undefined' ? localStorage.getItem('participant_id') : null;
    if (!pid && typeof window !== 'undefined') {
      pid = `subject_${Math.random().toString(36).substr(2, 5)}_${Date.now().toString().slice(-4)}`;
      localStorage.setItem('participant_id', pid);
    }
    return pid || 'anonymous';
  },

  // Sends one result to the Google Sheet
  syncToCloud: async (result: ExperimentResult): Promise<boolean> => {
    // Save locally first as a backup
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    localData.push({ ...result, isSynced: DataService.isCloudConnected() });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));

    if (REAL_CLOUD_API_URL) {
      try {
        const response = await fetch(REAL_CLOUD_API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            data: [{
              participantId: result.participantId,
              timestamp: new Date(result.timestamp).toLocaleString(),
              colorName: result.colorName,
              colorHex: result.colorHex,
              stareDuration: result.stareDuration,
              persistenceDuration: result.persistenceDuration,
              aiInsight: result.aiInsight || 'Processing...'
            }] 
          })
        });
        return response.ok;
      } catch (e) {
        console.error("Cloud Push Failed:", e);
        return false;
      }
    }
    return true;
  },

  // Fetches ALL results from the Google Sheet (The "Admin" View)
  fetchFromCloud: async (): Promise<ExperimentResult[]> => {
    if (!REAL_CLOUD_API_URL) return [];
    
    try {
      const response = await fetch(REAL_CLOUD_API_URL);
      const cloudRows = await response.json();
      
      if (!Array.isArray(cloudRows)) return [];

      // Map Google Sheet rows back to our App's format
      return cloudRows.map((row: any, index: number) => ({
        id: `cloud-${index}-${Date.now()}`,
        participantId: row.participantId || 'unknown',
        timestamp: row.timestamp ? new Date(row.timestamp).getTime() : Date.now(),
        colorName: row.colorName || 'Unknown',
        colorHex: row.colorHex || '#ffffff',
        stareDuration: parseFloat(row.stareDuration) || 0,
        persistenceDuration: parseFloat(row.persistenceDuration) || 0,
        aiInsight: row.aiInsight || '',
        isSynced: true
      }));
    } catch (e) {
      console.error("Cloud Fetch Failed:", e);
      return [];
    }
  },

  getGlobalResults: (): ExperimentResult[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  },

  nukeGlobalData: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('chroma_results');
  }
};
