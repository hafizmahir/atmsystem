import React, { useState, useEffect } from 'react';
import { loadSimulatedFiles, saveSimulatedFiles } from '../utils/fileSimulator';
import { Account, Transaction, SupportRequest } from '../types';
import AtmScreen from './AtmScreen';
import AdminPanel from './AdminPanel';
import { csharpProjectFiles } from '../utils/csharpCodeLibrary';
import { 
  Monitor, Landmark, Shield, FileCode, CheckCircle, Info, 
  HelpCircle, Settings, HardDrive, Calendar, CreditCard, ChevronRight, Sparkles,
  Copy, Check
} from 'lucide-react';

export default function DesktopLayout() {
  
  // Load initial bank state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [support, setSupport] = useState<SupportRequest[]>([]);

  // Windows opened states
  const [isAtmOpen, setIsAtmOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Active / Focused Window
  const [focusedWindow, setFocusedWindow] = useState<'atm' | 'admin' | 'about'>('atm');

  // Real-time audit logs state
  const [systemLogs, setSystemLogs] = useState<Array<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warning' | 'error' }>>([]);

  // Selected file for C# Explorer Tab
  const [selectedCsharpFile, setSelectedCsharpFile] = useState<string>("readme.txt");
  const [isCodeCopied, setIsCodeCopied] = useState<boolean>(false);

  // Copy code utility
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
    logSystemActivity(`C# code file copied: ${selectedCsharpFile}`, 'info');
  };

  // Load files on Mount
  useEffect(() => {
    const { accounts: accs, transactions: txs, support: sups } = loadSimulatedFiles();
    setAccounts(accs);
    setTransactions(txs);
    setSupport(sups);

    // Initial logs seed
    const initLogs = [
      {
        id: 'L001',
        time: new Date(Date.now() - 60000).toLocaleTimeString(),
        msg: "Local flat-file systems loaded. accounts.txt parsed successfully.",
        type: 'info' as const
      },
      {
        id: 'L002',
        time: new Date(Date.now() - 40000).toLocaleTimeString(),
        msg: "Secure ATM terminal PIN validation engine active.",
        type: 'success' as const
      },
      {
        id: 'L003',
        time: new Date().toLocaleTimeString(),
        msg: "Desktop application shell booted successfully on Port 3000.",
        type: 'success' as const
      }
    ];
    setSystemLogs(initLogs);
  }, []);

  // System Action log callback
  const logSystemActivity = (msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newItem = {
      id: `L_${Date.now()}_${Math.random()}`,
      time: new Date().toLocaleTimeString(),
      msg,
      type
    };
    setSystemLogs(prev => [newItem, ...prev]);
  };

  // Sync state mutations to state and physical localStorage
  const handleUpdateData = (
    nextAccs: Account[], 
    nextTxns: Transaction[], 
    nextSups: SupportRequest[]
  ) => {
    setAccounts(nextAccs);
    setTransactions(nextTxns);
    setSupport(nextSups);
    saveSimulatedFiles(nextAccs, nextTxns, nextSups);
  };

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden relative">
      
      {/* BACKGROUND MATRIX ACCENTS */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]" />
      
      {/* DESKTOP STATUS TOP BAR */}
      <div className="bg-slate-900/80 backdrop-blur border-b border-white/5 text-[11px] font-mono px-4 py-2 z-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold flex items-center gap-1.5 text-indigo-300">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span>CommunityOS Desktop v26.06</span>
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">Host: COMMUNITY_ATM_PC</span>
          <span className="text-slate-500 hidden lg:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">Database-Less C# Project</span>
        </div>

        {/* Live system clock */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40 text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] uppercase font-bold">FILESYSTEM STANDBY</span>
          </div>
          <span className="text-slate-400 font-bold">{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* DESKTOP AREA & GRID */}
      <div className="flex-1 p-6 relative flex flex-col xl:flex-row gap-6 items-start z-10 max-w-7xl mx-auto w-full overflow-y-auto pb-24">
        
        {/* DESKTOP VIEWPORT LAYOUT WRAPPER / APP MANAGER */}
        <div className="w-full flex flex-col gap-6 items-stretch">
          
          {/* USER WELCOME ADER */}
          <div className="bg-white/5 backdrop-blur p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                ATM Management Desktop Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Double-click applications below to test secure user transaction loops & flat-file administration panels side-by-side. 
              </p>
            </div>
            
            {/* Shortcuts controllers */}
            <div className="flex gap-2.5">
              <button 
                onClick={() => { setIsAtmOpen(true); setFocusedWindow('atm'); }}
                className="p-1 px-3 bg-indigo-650 hover:bg-indigo-600 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5"
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>ATM Terminal</span>
              </button>
              <button 
                onClick={() => { setIsAdminOpen(true); setFocusedWindow('admin'); }}
                className="p-1 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition flex items-center gap-1.5 border border-white/10"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Console</span>
              </button>
              <button 
                onClick={() => { setIsAboutOpen(true); setFocusedWindow('about'); }}
                className="p-1 px-3 bg-slate-850 hover:bg-slate-800 rounded-lg text-xs text-slate-300 transition flex items-center gap-1.5 border border-white/5"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>C# Academic Info</span>
              </button>
            </div>
          </div>

          {/* APPLICATION WINDOWS AREA ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
            
            {/* ATM WINDOW BLOCK CONTAINER: Col span varies depending on which are open */}
            {isAtmOpen && (
              <div className={`transition-all duration-300 ${isAdminOpen ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col`}>
                <div 
                  onClick={() => setFocusedWindow('atm')}
                  className={`bg-slate-900 border overflow-hidden rounded-3xl flex flex-col h-full shadow-2xl transition duration-200 ${
                    focusedWindow === 'atm' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-800'
                  }`}
                >
                  {/* Custom System Window Title top bar */}
                  <div className="bg-slate-950 p-3 px-4 border-b border-slate-850 flex justify-between items-center text-[11px] font-mono select-none">
                    <span className="flex items-center gap-1.5 font-bold text-slate-200">
                      <Landmark className="w-3.5 h-3.5 text-indigo-400" />
                      <span>App: ATM_TERMINAL_EMULATOR.exe</span>
                    </span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                      <button 
                        onClick={() => setIsAtmOpen(false)}
                        className="w-4 h-4 rounded px-0.5 bg-red-950 text-red-500 hover:bg-red-900 active:bg-red-950 flex items-center justify-center font-bold text-[9px] text-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Window Inner Screen */}
                  <div className="p-4 flex-1 bg-slate-900">
                    <AtmScreen 
                      accounts={accounts}
                      transactions={transactions}
                      support={support}
                      onUpdateData={handleUpdateData}
                      onLogSystemActivity={logSystemActivity}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN CONSOLE WINDOW BLOCK */}
            {isAdminOpen && (
              <div className={`transition-all duration-300 ${isAtmOpen ? 'lg:col-span-6' : 'lg:col-span-12'} flex flex-col`}>
                <div 
                  onClick={() => setFocusedWindow('admin')}
                  className={`bg-slate-900 border overflow-hidden rounded-3xl flex flex-col h-full shadow-2xl transition duration-200 ${
                    focusedWindow === 'admin' ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-800'
                  }`}
                >
                  {/* Custom Title Top Bar */}
                  <div className="bg-slate-950 p-3 px-4 border-b border-slate-850 flex justify-between items-center text-[11px] font-mono select-none">
                    <span className="flex items-center gap-1.5 font-bold text-slate-250">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>App: BANK_ADMINISTRATION_WORKPLACE.exe</span>
                    </span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                      <button 
                        onClick={() => setIsAdminOpen(false)}
                        className="w-4 h-4 rounded px-0.5 bg-red-950 text-red-500 hover:bg-red-900 active:bg-red-950 flex items-center justify-center font-bold text-[9px] text-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Inner Window */}
                  <div className="p-4 flex-1 bg-slate-955">
                    <AdminPanel 
                      accounts={accounts}
                      transactions={transactions}
                      support={support}
                      onUpdateData={handleUpdateData}
                      systemLogs={systemLogs}
                      onLogSystemActivity={logSystemActivity}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* C# ACADEMIC INFORMATION WINDOW (STORY 1 & 15 DEMO HELP) */}
          {isAboutOpen && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 max-w-5xl mx-auto w-full animate-fade-in relative z-40">
              <div className="bg-slate-950 p-3 px-4 border-b border-slate-850 flex justify-between items-center text-[11px] font-mono">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <FileCode className="w-4 h-4 text-indigo-405" />
                  <span>Interactive: ATM_MANAGEMENT_C_SHARP_MANUAL & CODE EXPORTER</span>
                </span>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="w-5 h-5 rounded bg-red-955 text-red-400 hover:bg-red-900 flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Academic Context Header */}
                <div className="flex gap-3 bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-900/60 items-start">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-0.5 font-sans">Visual Studio C# Desktop Project Package:</h4>
                    <p className="leading-relaxed text-slate-350">
                      This desktop system fulfills academic objectives by storing banking data in plain comma-separated variables inside local flat-files (<code className="text-white">accounts.txt</code>), fully simulating multi-threaded locks in C#.
                    </p>
                  </div>
                </div>

                {/* FILE SYSTEM EXPLORER TAB COMPONENT CONTAINER */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch h-[400px]">
                  {/* File List sidebar */}
                  <div className="md:col-span-3 bg-slate-950/80 rounded-xl p-2.5 border border-white/5 flex flex-col gap-1 overflow-y-auto">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 px-2 pb-1.5 border-b border-white/5 block mb-1">
                      📁 C# Project Files
                    </span>
                    {Object.keys(csharpProjectFiles).map(fileName => {
                      const file = csharpProjectFiles[fileName];
                      return (
                        <button
                          key={fileName}
                          onClick={() => {
                            setSelectedCsharpFile(fileName);
                            setIsCodeCopied(false);
                          }}
                          className={`w-full text-left p-1.5 rounded text-[11px] font-mono leading-tight hover:bg-white/5 transition flex items-center justify-between ${
                            selectedCsharpFile === fileName 
                              ? 'bg-indigo-950/80 text-indigo-300 font-bold border-l-2 border-indigo-500' 
                              : 'text-slate-400'
                          }`}
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-[8px] bg-white/5 p-0.5 px-1 rounded uppercase min-w-[32px] text-center text-slate-500">
                            {file.language}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Code snippet display area */}
                  <div className="md:col-span-9 bg-slate-950 rounded-xl border border-white/5 flex flex-col overflow-hidden relative">
                    {/* Header Bar */}
                    <div className="bg-slate-900/60 p-2 px-4 border-b border-white/5 flex justify-between items-center text-[10.5px] font-mono">
                      <div>
                        <span className="text-white font-semibold">{csharpProjectFiles[selectedCsharpFile]?.name}</span>
                        <span className="text-slate-500 mx-2">|</span>
                        <span className="text-slate-400">{csharpProjectFiles[selectedCsharpFile]?.description}</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(csharpProjectFiles[selectedCsharpFile]?.content || "")}
                        className="p-1 px-2 bg-indigo-900/60 hover:bg-indigo-800 text-[10px] text-indigo-250 font-bold font-mono rounded flex items-center gap-1 cursor-pointer transition border border-indigo-800"
                      >
                        {isCodeCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{isCodeCopied ? 'COPIED!' : 'COPY CODE'}</span>
                      </button>
                    </div>

                    {/* Syntax-like code area */}
                    <pre className="flex-1 p-4 overflow-auto font-mono text-[10px] text-slate-300 leading-relaxed bg-slate-950 text-left select-all">
                      <code>{csharpProjectFiles[selectedCsharpFile]?.content}</code>
                    </pre>
                  </div>
                </div>

                {/* Close/Egress buttons */}
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button 
                    onClick={() => setIsAboutOpen(false)}
                    className="p-1 px-4 bg-indigo-650 hover:bg-indigo-600 rounded text-xs font-semibold text-white cursor-pointer"
                  >
                    Close Code Explorer
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* DESKTOP FOOTER DESK BAR (DOCK) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/40 backdrop-blur-md border-t border-white/5 p-2 px-10 flex justify-between items-center z-50">
        
        {/* Community bank start menu button */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              onClick={() => {
                setIsAtmOpen(true);
                setIsAdminOpen(true);
                logSystemActivity("Desktop terminal programs layout auto-arranged.", 'info');
              }}
              className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-xs tracking-wider font-mono flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              <span>START BANK</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-450 gap-2 font-mono">
            <span>Desktop: Active Terminals</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 font-bold">{ (isAtmOpen ? 1 : 0) + (isAdminOpen ? 1 : 0) } open</span>
          </div>
        </div>

        {/* Dynamic Launch app dock indices */}
        <div className="flex gap-4 p-1 bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
          <button 
            onClick={() => { setIsAtmOpen(!isAtmOpen); if(!isAtmOpen) setFocusedWindow('atm'); }}
            className={`p-2 rounded-xl transition duration-150 relative group ${isAtmOpen ? 'bg-indigo-950/60 text-indigo-300' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <CreditCard className="w-5 h-5" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-1.5 px-2.5 bg-slate-950 text-[10px] text-slate-205 rounded border border-white/10 hidden group-hover:block font-bold">ATM Terminal</div>
            {isAtmOpen && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-205" />}
          </button>

          <button 
            onClick={() => { setIsAdminOpen(!isAdminOpen); if(!isAdminOpen) setFocusedWindow('admin'); }}
            className={`p-2 rounded-xl transition duration-150 relative group ${isAdminOpen ? 'bg-indigo-950/60 text-indigo-300' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <Shield className="w-5 h-5" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-1.5 px-2.5 bg-slate-950 text-[10px] text-slate-205 rounded border border-white/10 hidden group-hover:block font-bold">Admin Console</div>
            {isAdminOpen && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-205" />}
          </button>

          <button 
            onClick={() => { setIsAboutOpen(!isAboutOpen); if(!isAboutOpen) setFocusedWindow('about'); }}
            className={`p-2 rounded-xl transition duration-150 relative group ${isAboutOpen ? 'bg-indigo-950/60 text-indigo-300' : 'text-slate-400 hover:bg-slate-900'}`}
          >
            <FileCode className="w-5 h-5" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-1.5 px-2.5 bg-slate-950 text-[10px] text-slate-205 rounded border border-white/10 hidden group-hover:block font-bold">C# PDF Manual</div>
            {isAboutOpen && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-205" />}
          </button>
        </div>

        {/* Dev System Identifier logs on bottom status bar */}
        <div className="hidden lg:flex items-center gap-1 px-3 py-1 bg-slate-950 rounded-lg text-[10px] font-mono text-indigo-400 border border-indigo-900/30">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Local Storage DB: accounts.txt, transactions.txt</span>
        </div>

      </div>

    </div>
  );
}
