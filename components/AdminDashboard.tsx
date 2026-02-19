
'use client';
import React, { useState, useEffect } from 'react';
import { ExperimentResult } from '../types';
import { DataService } from '../services/dataService';

interface AdminDashboardProps {
  onClose: () => void;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onRefresh }) => {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isCloudConfigured = DataService.isCloudConnected();

  // Load local data on mount
  useEffect(() => {
    setResults(DataService.getGlobalResults());
  }, []);

  const handleRefreshCloud = async () => {
    if (!isCloudConfigured) return;
    setIsLoading(true);
    const cloudData = await DataService.fetchFromCloud();
    if (cloudData.length > 0) {
      setResults(cloudData);
      localStorage.setItem('chroma_global_vault', JSON.stringify(cloudData));
      onRefresh();
    } else {
      alert("No data found in the cloud yet. Have you completed any experiments?");
    }
    setIsLoading(false);
  };

  const handleClearAll = () => {
    if (confirm("DANGER: This will clear your current VIEW. It won't delete data from your Google Sheet. Proceed?")) {
      DataService.nukeGlobalData();
      setResults([]);
      onRefresh();
    }
  };

  const downloadCSV = () => {
    const headers = ['Participant ID', 'Timestamp', 'Stimulus', 'Stare(s)', 'Persistence(s)', 'Insight'];
    const rows = results.map(r => [
      r.participantId, 
      new Date(r.timestamp).toLocaleString(), 
      r.colorName, 
      r.stareDuration, 
      r.persistenceDuration,
      (r.aiInsight || '').replace(/,/g, ';')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Global_Experiment_Data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in fade-in duration-300">
      <header className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-md text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30">
            Global Database
          </div>
          <h2 className="text-xl font-bold tracking-tight">Research Command Center</h2>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleRefreshCloud} 
            disabled={isLoading} 
            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              isLoading ? 'bg-white/10 text-white/40' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
            }`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Sync Live Data
          </button>
          
          <button onClick={downloadCSV} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all">
            Export CSV
          </button>
          
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8 bg-gradient-to-b from-transparent to-indigo-500/5">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Status Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Cloud Link</p>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                <span className="font-bold text-lg">Active Connection</span>
              </div>
              <p className="text-[10px] mt-2 text-white/40 font-mono truncate">ID: 0rygha3cscbk9</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Total Trials</p>
              <p className="text-3xl font-black text-white">{results.length}</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Avg. Duration</p>
              <p className="text-3xl font-black text-indigo-400">
                {results.length > 0 ? (results.reduce((acc, r) => acc + r.persistenceDuration, 0) / results.length).toFixed(1) : '0.0'}s
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Instructions</p>
              <p className="text-[11px] text-white/50 leading-tight">
                Click "Sync Live Data" to see observations from other participants. 
              </p>
              <button onClick={handleClearAll} className="mt-2 text-[10px] text-red-400 hover:underline uppercase font-bold text-left">Clear local cache</button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 uppercase text-[10px] font-mono tracking-widest text-white/40">
                <tr>
                  <th className="px-8 py-5">Subject ID</th>
                  <th className="px-8 py-5">Stimulus</th>
                  <th className="px-8 py-5 text-center">Stare</th>
                  <th className="px-8 py-5 text-center">Afterimage</th>
                  <th className="px-8 py-5 text-right">Observation Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-xl font-medium">No records found. Click "Sync" to check the cloud.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  results.slice().reverse().map((res, idx) => (
                    <tr key={res.id || idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="font-mono text-xs text-white/40 group-hover:text-white transition-colors">{res.participantId}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: res.colorHex }} />
                          <span className="font-bold">{res.colorName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center font-mono opacity-40">{res.stareDuration}s</td>
                      <td className="px-8 py-5 text-center font-mono font-black text-indigo-400 text-lg">{res.persistenceDuration}s</td>
                      <td className="px-8 py-5 text-right font-mono text-[11px] opacity-30">{new Date(res.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
