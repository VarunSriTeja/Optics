
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExperimentPhase, ColorStimulus, ExperimentResult } from '../types';
import { COLOR_LIBRARY, DEFAULT_STARE_DURATION } from '../constants';
import { ColorGrid } from '../components/ColorGrid';
import { ExperimentView } from '../components/ExperimentView';
import { ResultsChart } from '../components/ResultsChart';
import { AdminDashboard } from '../components/AdminDashboard';
import { generateInsight } from '../services/geminiService';
import { DataService } from '../services/dataService';

export default function Home() {
  const [phase, setPhase] = useState<ExperimentPhase>(ExperimentPhase.IDLE);
  const [selectedStimulus, setSelectedStimulus] = useState<ColorStimulus>(COLOR_LIBRARY[0]);
  const [stareDuration, setStareDuration] = useState(DEFAULT_STARE_DURATION);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [currentResult, setCurrentResult] = useState<ExperimentResult | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const logoClickCount = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem('chroma_results');
    if (saved) {
      try {
        setResults(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved results");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chroma_results', JSON.stringify(results));
  }, [results]);

  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickCount.current >= 5) {
      const pin = prompt("Admin Access Required. Enter PIN:");
      if (pin === "chroma2024") {
        setIsAdmin(true);
        alert("Admin Mode: Global Vault Unlocked.");
      } else {
        alert("Incorrect PIN.");
      }
      logoClickCount.current = 0;
    }
    setTimeout(() => { logoClickCount.current = 0; }, 2000);
  };

  const navigateToSection = (id: string) => {
    if (phase === ExperimentPhase.STARING || phase === ExperimentPhase.PERSISTENCE) return;
    setPhase(ExperimentPhase.IDLE);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const startConfig = () => {
    setPhase(ExperimentPhase.CONFIGURING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const startExperiment = () => setPhase(ExperimentPhase.STARING);
  
  const finishStare = useCallback(() => {
    setPhase(ExperimentPhase.PERSISTENCE);
  }, []);

  const finishPersistence = async (duration: number) => {
    const newResult: ExperimentResult = {
      id: crypto.randomUUID(),
      participantId: DataService.getParticipantId(),
      timestamp: Date.now(),
      colorName: selectedStimulus.name,
      colorHex: selectedStimulus.hex,
      stareDuration: stareDuration,
      persistenceDuration: parseFloat(duration.toFixed(2)),
    };

    setCurrentResult(newResult);
    setPhase(ExperimentPhase.RESULTS);
    
    setIsSyncing(true);
    await DataService.syncToCloud(newResult);
    setIsSyncing(false);

    setIsAiLoading(true);
    const insight = await generateInsight(newResult);
    const finalResult = { ...newResult, aiInsight: insight, isSynced: true };
    setCurrentResult(finalResult);
    setResults(prev => [finalResult, ...prev]);
    setIsAiLoading(false);
  };

  const abortExperiment = () => setPhase(ExperimentPhase.IDLE);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-indigo-500 selection:text-white">
      <header className="px-6 py-6 border-b border-white/10 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none">
            <div 
              onClick={handleLogoClick}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform active:scale-95"
            >
              <span className="text-xl font-black italic">Ɵ</span>
            </div>
            <div onClick={() => setPhase(ExperimentPhase.IDLE)}>
              <h1 className="font-bold text-lg tracking-tight">ChromaƟc Adaptation</h1>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-[0.2em]">Vision Science Exhibit</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => navigateToSection('theory')} className="hidden lg:block text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white transition-colors">Theory</button>
            <button onClick={() => navigateToSection('anatomy')} className="hidden lg:block text-[10px] uppercase font-bold tracking-widest text-white/40 hover:text-white transition-colors">Anatomy</button>
            {isAdmin && (
              <button 
                onClick={() => setPhase(ExperimentPhase.ADMIN_DASHBOARD)}
                className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
              >
                Open Vault
              </button>
            )}
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-white/40">Lab Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {phase === ExperimentPhase.IDLE || phase === ExperimentPhase.CONFIGURING ? (
          <div className="space-y-32">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-8">
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="space-y-2">
                  <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.4em]">Perceptual Research Trials</span>
                  <h2 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tighter">
                    ChromaƟc <br />
                    <span className="text-gradient">Adaptation.</span>
                  </h2>
                </div>
                <p className="text-white/60 text-lg leading-relaxed max-w-lg">
                  Observe the biological phenomenon of <strong>Retinal Fatigue</strong>. 
                  Learn how your brain creates phantom colors through photochemical adaptation and neural rebound.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={startConfig}
                    className="px-10 py-5 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                  >
                    Start Experiment
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => navigateToSection('theory')}
                    className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all flex items-center gap-3"
                  >
                    Explore Theory
                  </button>
                </div>
              </div>
              <div className="relative aspect-video animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="absolute -inset-4 bg-indigo-500/10 rounded-[3rem] blur-2xl"></div>
                <div className="relative bg-white/5 border border-white/10 rounded-[2.5rem] h-full w-full overflow-hidden flex flex-col justify-center items-center p-12 group">
                   <div className="grid grid-cols-4 gap-4 w-full h-full">
                      {COLOR_LIBRARY.slice(0, 4).map(c => (
                        <div key={c.id} className="rounded-2xl transition-all duration-500 group-hover:scale-105" style={{ backgroundColor: c.hex }} />
                      ))}
                   </div>
                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="font-mono text-[10px] tracking-[0.5em] text-indigo-400">READY_FOR_ADAPTATION</p>
                   </div>
                </div>
              </div>
            </section>

            {phase === ExperimentPhase.CONFIGURING && (
              <section id="config" className="bg-indigo-500/5 border border-indigo-500/20 p-12 rounded-[3rem] animate-in slide-in-from-bottom-8 duration-500 scroll-mt-24">
                <div className="max-w-4xl mx-auto space-y-12">
                  <div className="text-center">
                    <h3 className="text-3xl font-bold mb-2">Configure Trial Parameters</h3>
                    <p className="text-white/40">The duration of stare directly correlates to the intensity of retinal bleaching.</p>
                  </div>
                  
                  <div className="space-y-12">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center underline decoration-indigo-500/30 underline-offset-8">I. Stimulus Selection</label>
                      <ColorGrid selectedId={selectedStimulus.id} onSelect={setSelectedStimulus} />
                    </div>

                    <div className="max-w-xl mx-auto">
                      <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-8 text-center">
                        II. Adaptation Period: <span className="text-white font-mono bg-white/10 px-4 py-1 rounded-lg">{stareDuration}s</span>
                      </label>
                      <input 
                        type="range" min="5" max="120" step="5"
                        value={stareDuration}
                        onChange={(e) => setStareDuration(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className="flex justify-between mt-4 text-[9px] font-mono text-white/20">
                        <span>5S (MIN)</span>
                        <span>45S (RECOMMENDED)</span>
                        <span>120S (MAX)</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6 max-w-xl mx-auto">
                      <button onClick={startExperiment} className="flex-1 py-6 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                        BEGIN TRIAL
                      </button>
                      <button onClick={abortExperiment} className="px-8 py-6 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all">
                        CANCEL
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-24">
                <section id="theory" className="scroll-mt-32 space-y-8">
                  <div className="inline-flex items-center gap-4">
                    <div className="h-px w-12 bg-indigo-500/30"></div>
                    <span className="text-indigo-400 font-mono text-xs uppercase tracking-[0.5em]">The Discovery</span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-tight">The Opponent Process Theory</h3>
                  <div className="space-y-6 text-white/60 leading-relaxed text-lg">
                    <p>
                      In 1892, German physiologist <strong>Ewald Hering</strong> challenged the dominant theory of color vision. He noticed that some colors are mutually exclusive—you never see a "reddish-green" or a "yellowish-blue."
                    </p>
                    <p>
                      Hering proposed that color is processed in mutually exclusive pairs. This experiment effectively "jams" one side of these neural circuits. By staring at red, you exhaust the red-detecting neurons. When you switch to a white screen, your visual system attempts to re-calibrate, but since the red-pathway is "bleached," the opposing green/cyan signal spikes, creating the ghost-like perception of the complementary color.
                    </p>
                  </div>
                </section>

                <section id="anatomy" className="scroll-mt-32 space-y-10">
                  <div className="inline-flex items-center gap-4">
                    <div className="h-px w-12 bg-purple-500/30"></div>
                    <span className="text-purple-400 font-mono text-xs uppercase tracking-[0.5em]">Anatomy of Vision</span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-tight">Photoreceptors & Adaptation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="group p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:border-purple-500/30 transition-all">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          Photoreceptor Cones
                        </h4>
                        <p className="text-sm text-white/50 leading-relaxed">
                          The retina contains three types of cones, each housing a specific <strong>Photopsin</strong> protein. 
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-12">
                 <div className="sticky top-32 space-y-12">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Trial Analytics</h4>
                      <ResultsChart results={results} />
                    </section>
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20">Recent Trial History</h4>
                      <div className="space-y-3">
                        {results.length === 0 ? (
                          <div className="py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center">
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-mono text-center px-6">Complete a trial to see data history</p>
                          </div>
                        ) : (
                          results.slice(0, 5).map((r) => (
                            <div key={r.id} className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex justify-between items-center group">
                               <div className="flex items-center gap-4">
                                  <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: r.colorHex }} />
                                  <div>
                                    <p className="text-sm font-bold group-hover:text-indigo-400 transition-colors">{r.colorName}</p>
                                    <p className="text-[9px] font-mono text-white/20">{new Date(r.timestamp).toLocaleTimeString()}</p>
                                  </div>
                               </div>
                               <span className="text-lg font-mono font-bold text-indigo-400">{r.persistenceDuration}s</span>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                 </div>
              </div>
            </div>
          </div>
        ) : phase === ExperimentPhase.RESULTS ? (
          <div className="max-w-4xl mx-auto py-12 space-y-16 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-8">
              <h2 className="text-7xl font-black tracking-tighter leading-none">Experiment <br />Complete.</h2>
              <p className="text-white/40 text-xl max-w-2xl mx-auto leading-relaxed">
                Your visual system adapted to <span className="text-white font-bold">{selectedStimulus.name}</span> for {stareDuration}s, 
                yielding an afterimage persistence of <span className="text-indigo-400 font-bold font-mono">{currentResult?.persistenceDuration}s</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2 p-12 rounded-[3.5rem] bg-white/5 border border-white/10 relative overflow-hidden">
                  <h3 className="text-[10px] font-bold uppercase text-indigo-400 mb-8 tracking-[0.4em]">Neural-AI Insight</h3>
                  {isAiLoading ? (
                    <div className="space-y-4">
                      <div className="h-5 bg-white/10 rounded-full w-full animate-pulse"></div>
                      <div className="h-5 bg-white/10 rounded-full w-4/5 animate-pulse"></div>
                    </div>
                  ) : (
                    <p className="text-2xl font-medium italic text-white/90 leading-relaxed">
                      "{currentResult?.aiInsight}"
                    </p>
                  )}
               </div>
               <div className="p-12 rounded-[3.5rem] bg-indigo-500 text-white flex flex-col justify-center items-center shadow-2xl shadow-indigo-500/40">
                  <p className="text-[10px] font-bold uppercase text-white/60 mb-3 tracking-widest">Persistence</p>
                  <p className="text-6xl font-black font-mono tracking-tighter">{currentResult?.persistenceDuration}s</p>
               </div>
            </div>

            <div className="flex justify-center gap-4 pt-12">
              <button onClick={startConfig} className="px-12 py-6 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-2xl active:scale-95">New Trial</button>
              <button onClick={() => setPhase(ExperimentPhase.IDLE)} className="px-12 py-6 bg-white/5 text-white/60 rounded-2xl font-bold hover:bg-white/10 transition-all">Back to Home</button>
            </div>
          </div>
        ) : phase === ExperimentPhase.ADMIN_DASHBOARD ? (
          <AdminDashboard 
            onClose={() => setPhase(ExperimentPhase.IDLE)} 
            onRefresh={() => {
               const saved = localStorage.getItem('chroma_results');
               if (saved) setResults(JSON.parse(saved));
            }} 
          />
        ) : null}
      </main>

      {(phase === ExperimentPhase.STARING || phase === ExperimentPhase.PERSISTENCE) && (
        <ExperimentView 
          phase={phase}
          stimulus={selectedStimulus}
          stareLimit={stareDuration}
          onFinishStare={finishStare}
          onFinishPersistence={finishPersistence}
          onAbort={abortExperiment}
        />
      )}

      <footer className="mt-48 border-t border-white/5 py-24 px-6 bg-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold italic">Ɵ</div>
                <h5 className="text-sm font-bold uppercase tracking-widest">ChromaƟc Adaptation</h5>
              </div>
              <p className="text-xs text-white/30 leading-relaxed">
                A digital research exhibit exploring the limits of human visual perception. 
              </p>
           </div>
           <div className="flex flex-col md:items-end justify-between opacity-20 text-[9px] uppercase font-mono tracking-[0.4em]">
              <div className="text-right">
                <p>Scientific Exhibit V1.7.0 (Next.js)</p>
                <p>Node ID: {DataService.getParticipantId()}</p>
              </div>
              <p>© 2024 Visual Perception Lab</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
