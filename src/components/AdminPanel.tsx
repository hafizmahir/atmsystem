import React, { useState, useEffect } from 'react';
import { Account, Transaction, SupportRequest } from '../types';
import { 
  getRawFileContents, saveRawFile, CS_CODE_EXAMPLES, serializeAccounts, serializeTransactions, serializeSupport
} from '../utils/fileSimulator';
import { 
  ShieldAlert, ShieldCheck, Users, FileText, Database, 
  Terminal, Check, X, Code, HelpCircle, Save, Download, 
  Upload, UserPlus, AlertTriangle, FileWarning, Search, Landmark,
  Lock, Unlock
} from 'lucide-react';

interface AdminPanelProps {
  accounts: Account[];
  transactions: Transaction[];
  support: SupportRequest[];
  onUpdateData: (accounts: Account[], transactions: Transaction[], support: SupportRequest[]) => void;
  systemLogs: Array<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warning' | 'error' }>;
  onLogSystemActivity: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AdminPanel({
  accounts,
  transactions,
  support,
  onUpdateData,
  systemLogs,
  onLogSystemActivity
}: AdminPanelProps) {
  
  // Tabs: dashboard | accounts | support | files | logs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'support' | 'files' | 'logs'>('dashboard');

  // New Account state
  const [newAccNum, setNewAccNum] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccPin, setNewAccPin] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccError, setNewAccError] = useState('');
  const [newAccSuccess, setNewAccSuccess] = useState('');

  // CSV live editor state
  const [selectedFile, setSelectedFile] = useState<'accounts.txt' | 'transactions.txt' | 'support_requests.txt'>('accounts.txt');
  const [fileText, setFileText] = useState('');
  const [editorFeedback, setEditorFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  // Search accounts query
  const [searchQuery, setSearchQuery] = useState('');

  // Session authentication state (persists in sessionStorage)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('admin_session_auth') === 'true';
  });
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Search accounts/logs filter states
  const [accountFilter, setAccountFilter] = useState<'all' | 'verified' | 'unverified' | 'fake'>('all');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all');
  const [logSearch, setLogSearch] = useState('');

  const handleAuthenticate = (pin: string) => {
    if (pin === '8888' || pin === 'admin123' || pin.toLowerCase() === 'admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_session_auth', 'true');
      setAuthError('');
      onLogSystemActivity("Administrator verified and unlocked system dashboard.", 'success');
    } else {
      setAuthError("🔒 ACCESS DENIED: Invalid Administrative Credential. Please verify the code and try again.");
      onLogSystemActivity(`Failed Admin access attempt using code/PIN: "${pin}"`, 'error');
    }
  };

  const handleKeypadPress = (val: string) => {
    setAuthError('');
    if (val === '✕') {
      setAuthPin('');
    } else if (val === '↵') {
      handleAuthenticate(authPin);
    } else {
      if (authPin.length < 15) {
        setAuthPin(prev => prev + val);
      }
    }
  };

  const handleExportLogs = () => {
    const header = "Time,Log Level,Event Details\n";
    const body = systemLogs.map(log => `[${log.time}],${log.type.toUpperCase()},"${log.msg.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onLogSystemActivity("Exported administrative log logs to CSV.", 'info');
  };

  // Load physical representation file contents into editor when selecting file
  useEffect(() => {
    const contents = getRawFileContents();
    if (selectedFile === 'accounts.txt') {
      setFileText(contents.accounts);
    } else if (selectedFile === 'transactions.txt') {
      setFileText(contents.transactions);
    } else if (selectedFile === 'support_requests.txt') {
      setFileText(contents.support);
    }
    setEditorFeedback(null);
  }, [selectedFile, accounts, transactions, support]);

  // Handler for custom account registration
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setNewAccError('');
    setNewAccSuccess('');

    if (!newAccNum.trim() || !newAccName.trim() || !newAccPin.trim() || !newAccBalance.trim()) {
      setNewAccError("Validation Error: Please complete every input field before adding an account.");
      return;
    }

    if (!/^\d+$/.test(newAccNum.trim())) {
      setNewAccError("Format Error: Account numbers must only contain numerical digits.");
      return;
    }

    if (!/^\d{4}$/.test(newAccPin.trim())) {
      setNewAccError("Security Rules Error: Account PIN must be exactly 4 numeric characters.");
      return;
    }

    const parsedBalance = parseFloat(newAccBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setNewAccError("Financial Error: Initial Balance must be a positive decimal number.");
      return;
    }

    // Check duplicate account
    if (accounts.some(a => a.accountNumber === newAccNum.trim())) {
      setNewAccError(`Account Conflict: Account number "${newAccNum}" already occupies active database.`);
      return;
    }

    const newAcc: Account = {
      accountNumber: newAccNum.trim(),
      pin: newAccPin.trim(),
      holderName: newAccName.trim(),
      balance: parsedBalance,
      isVerified: true,
      isFake: false,
      createdAt: new Date().toISOString()
    };

    const newTxn: Transaction = {
      id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
      accountNumber: newAcc.accountNumber,
      type: 'Account Created',
      amount: parsedBalance,
      timestamp: new Date().toISOString(),
      balanceAfter: parsedBalance,
      status: 'Success',
      details: 'Initial account balance entry via Admin Panel creation form.'
    };

    onUpdateData([...accounts, newAcc], [newTxn, ...transactions], support);
    setNewAccSuccess(`Account ${newAcc.accountNumber} successfully established.`);
    onLogSystemActivity(`Admin created new account: ${newAcc.accountNumber} (${newAcc.holderName})`, 'success');

    // Reset inputs
    setNewAccNum('');
    setNewAccName('');
    setNewAccPin('');
    setNewAccBalance('');
  };

  // Toggle flags
  const handleToggleVerify = (accountNum: string) => {
    const updated = accounts.map(a => {
      if (a.accountNumber === accountNum) {
        const nextState = !a.isVerified;
        onLogSystemActivity(`Verification status of Acc ${accountNum} set to ${nextState}`, 'info');
        return { ...a, isVerified: nextState };
      }
      return a;
    });
    onUpdateData(updated, transactions, support);
  };

  const handleToggleFake = (accountNum: string) => {
    const updated = accounts.map(a => {
      if (a.accountNumber === accountNum) {
        const nextState = !a.isFake;
        onLogSystemActivity(`Fraud/Fake status of Acc ${accountNum} marked to ${nextState}`, nextState ? 'error' : 'success');
        return { ...a, isFake: nextState };
      }
      return a;
    });
    onUpdateData(updated, transactions, support);
  };

  // Support actions management
  const handleResolveSupport = (id: string, status: 'Approved' | 'Resolved' | 'Rejected') => {
    const ticket = support.find(s => s.id === id);
    if (!ticket) return;

    let updatedAccounts = [...accounts];
    let updatedTransactions = [...transactions];

    if (ticket.requestType === 'New Account Request' && status === 'Approved' && ticket.requestedDetails) {
      // Validate
      const { pin, holderName, initialBalance } = ticket.requestedDetails;
      // Generate a sequence ID
      const newNum = String(1000 + accounts.length + 1);
      
      const newAcc: Account = {
        accountNumber: newNum,
        pin,
        holderName,
        balance: initialBalance,
        isVerified: true,
        isFake: false,
        createdAt: new Date().toISOString()
      };

      const newTxn: Transaction = {
        id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
        accountNumber: newAcc.accountNumber,
        type: 'Account Created',
        amount: initialBalance,
        timestamp: new Date().toISOString(),
        balanceAfter: initialBalance,
        status: 'Success',
        details: `Account established via approved support request ticket ${id}`
      };

      updatedAccounts = [...accounts, newAcc];
      updatedTransactions = [newTxn, ...transactions];

      onLogSystemActivity(`Approved Request ${id}: Created Acc ${newNum} for ${holderName}`, 'success');
    } else if (ticket.requestType === 'Card Crush' && status === 'Resolved') {
      onLogSystemActivity(`Resolved card crush ticket ${id}. Card replacement ordered.`, 'success');
    } else {
      onLogSystemActivity(`Ticket ${id} status marked ${status}`, 'info');
    }

    const updatedSupport = support.map(s => {
      if (s.id === id) {
        return { ...s, status };
      }
      return s;
    });

    onUpdateData(updatedAccounts, updatedTransactions, updatedSupport);
  };

  // Save changes from Textarea file editor
  const handleSaveEditor = () => {
    const r = saveRawFile(selectedFile, fileText);
    if (r.success) {
      setEditorFeedback({
        success: true,
        msg: `File ${selectedFile} written to local-simulated filesystem. Accounts schema reloaded successfully!`
      });
      onLogSystemActivity(`Admin edited and saved ${selectedFile} manually inside txt editor.`, 'success');

      // Trigger full data state reload
      const contents = getRawFileContents();
      const nextData = saveRawFile(selectedFile, fileText); // returns active
      // For immediate react sync, reload:
      window.location.reload(); // Quick sync OR trigger onUpdateData from outer
    } else {
      setEditorFeedback({
        success: false,
        msg: `File Save Failed! C# parser reports ${r.errorCount} structure violations: \n` + r.errors.join('\n')
      });
      onLogSystemActivity(`Admin flat-file edit rejected on ${selectedFile} due to validation errors.`, 'error');
    }
  };

  // Code download
  const downloadTextFile = () => {
    const contents = getRawFileContents();
    let text = '';
    if (selectedFile === 'accounts.txt') text = contents.accounts;
    if (selectedFile === 'transactions.txt') text = contents.transactions;
    if (selectedFile === 'support_requests.txt') text = contents.support;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile;
    a.click();
    URL.revokeObjectURL(url);
    onLogSystemActivity(`Downloaded ${selectedFile} file.`, 'info');
  };

  // File Upload importer (Story 9)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name !== 'accounts.txt' && file.name !== 'transactions.txt' && file.name !== 'support_requests.txt') {
      onLogSystemActivity(`Rejected upload of "${file.name}". Must match flat-file namespace exactly.`, 'error');
      alert("Invalid Name: Please select a file named 'accounts.txt', 'transactions.txt', or 'support_requests.txt'");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileText(text);
      const r = saveRawFile(file.name, text);
      if (r.success) {
        onLogSystemActivity(`Imported external file "${file.name}" into local bank index.`, 'success');
        alert(`Success: "${file.name}" uploaded, parsed, and merged! Web app reload sync pending.`);
        window.location.reload();
      } else {
        onLogSystemActivity(`Upload parse failed on "${file.name}": ${r.errors.join("; ")}`, 'error');
        alert("Parse Fail: The CSV structure doesn't meet our database validator specification.");
      }
    };
    reader.readAsText(file);
  };

  // Stats calculate
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const unverifiedAccounts = accounts.filter(a => !a.isVerified).length;
  const fakeAccounts = accounts.filter(a => a.isFake).length;
  const pendingRequests = support.filter(s => s.status === 'Pending').length;

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.accountNumber.includes(searchQuery);
    if (!matchesSearch) return false;
    if (accountFilter === 'verified') return a.isVerified;
    if (accountFilter === 'unverified') return !a.isVerified;
    if (accountFilter === 'fake') return a.isFake;
    return true;
  });

  const filteredLogs = systemLogs.filter(log => {
    const matchesType = logFilter === 'all' || log.type === logFilter;
    const matchesSearch = log.msg.toLowerCase().includes(logSearch.toLowerCase()) || 
                          log.time.includes(logSearch) || 
                          log.type.toLowerCase().includes(logSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-950 text-slate-100 rounded-px overflow-hidden border border-slate-800 flex flex-col h-[700px] shadow-2xl justify-between">
        {/* Header bar stating restricted mode */}
        <div className="bg-rose-955/10 border-b border-rose-900/40 p-4 shrink-0 flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-rose-500/10 rounded-md text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold font-mono tracking-wider animate-pulse flex items-center gap-1.5 font-sans justify-center">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
              Restricted Secure Terminal
            </span>
            <span className="text-xs font-semibold font-sans text-slate-200">ADMIN-ONLY ENCLAVE</span>
          </div>
          <span className="text-[10px] text-rose-500 font-mono">CODE LEVEL: MASTER SEC</span>
        </div>

        {/* Lock Screen Middle Pad */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 max-w-sm mx-auto select-none">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Lock className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">console access authorization</h3>
            <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
              Administrative monitoring of active verification levels and live trace system logs is restricted. Enter PIN or core passcode.
            </p>
          </div>

          <div className="w-full space-y-3.5">
            {/* Password input box display */}
            <div className="relative">
              <input 
                type="password"
                placeholder="••••••"
                value={authPin}
                readOnly
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-lg font-mono tracking-[0.25em] text-white focus:outline-none focus:border-indigo-600"
              />
              <button 
                type="button"
                onClick={() => setAuthPin('')}
                className="absolute right-3.5 top-3.5 text-[10px] text-slate-500 hover:text-slate-350 cursor-pointer hover:underline"
              >
                Clear
              </button>
            </div>

            {authError && (
              <p className="text-[10px] bg-red-955/20 border border-red-900/30 text-red-350 p-2 rounded text-center leading-relaxed font-mono animate-pulse">
                {authError}
              </p>
            )}

            {/* Simulated ATM-style 12-key numeric keypad */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  className="bg-slate-900 hover:bg-slate-850 active:bg-slate-905 py-2.5 rounded-lg text-slate-205 text-center font-bold transition cursor-pointer border border-slate-800/60"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeypadPress('✕')}
                className="bg-red-955/20 text-red-400 hover:bg-red-900/40 py-2.5 rounded-lg text-center font-semibold text-[10px] uppercase border border-red-900/40 cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="bg-slate-900 hover:bg-slate-850 py-2.5 rounded-lg text-slate-205 text-center font-bold cursor-pointer border border-slate-800/60"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('↵')}
                className="bg-emerald-950 hover:bg-emerald-900 text-emerald-350 py-2.5 font-bold rounded-lg text-center text-[10px] uppercase border border-emerald-900/40 cursor-pointer"
              >
                Enter
              </button>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl space-y-1 text-left w-full">
            <span className="text-[9px] uppercase font-mono font-bold text-indigo-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Sandbox Testing Access Key:
            </span>
            <p className="text-[9.5px] text-slate-400 leading-normal font-mono">
              Use core student PIN <span className="text-teal-400 font-bold font-mono text-[10px] px-1 bg-slate-900 rounded">8888</span> or passcode <span className="text-teal-400 font-bold font-mono text-[10px] px-1 bg-slate-900 rounded">admin123</span> to verify systems auditing.
            </p>
          </div>
        </div>

        {/* Footer info label */}
        <div className="bg-slate-900 p-2.5 px-4 text-center border-t border-slate-850 text-[10px] text-slate-500 font-mono flex justify-between items-center select-none font-sans">
          <span>PORT INGRESS: 3000</span>
          <span>SYSTEM SECURITY STATUS: ENABLED</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 flex flex-col h-[700px] shadow-2xl select-none">
      
      {/* Admin Window Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/30">
            <Landmark className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2 text-slate-100">
              Community Bank Admin Console 
              <span className="text-[10px] bg-slate-800/80 text-teal-400 font-mono py-0.5 px-2 rounded-full border border-teal-500/20">
                DATABASE-LESS ARCHITECTURE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Manage CSV Accounts & Audit Card Incidents (Local Files Sim)</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Database },
            { id: 'accounts', label: 'Accounts', icon: Users },
            { id: 'support', label: 'Support Queue', icon: ShieldAlert },
            { id: 'files', label: 'Flat Files Editor', icon: FileText },
            { id: 'logs', label: 'Live Systems Audit', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-indigo-650 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main tab content container */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">
            {/* Warning bar for fake accounts */}
            {fakeAccounts > 0 && (
              <div className="bg-amber-950/40 border border-amber-900 text-amber-300 p-3.5 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold font-sans">Active Security Threat Levels Detected!</h4>
                  <p className="text-[11px] text-amber-400/90 leading-relaxed">
                    There are currently {fakeAccounts} accounts flagged as <strong className="text-red-400 text-xs">FRAUDULENT/FAKE</strong> under your bank's file registry. Verify holder IDs inside the accounts tree immediately to protect automated ATM withdrawals.
                  </p>
                </div>
              </div>
            )}

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Total System Balance</p>
                <p className="text-xl font-bold font-mono text-teal-400">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                <p className="text-[9px] text-slate-500 mt-1">Sum of accounts.txt columns</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Registered Accounts</p>
                <p className="text-xl font-bold text-indigo-400 font-mono">{accounts.length}</p>
                <p className="text-[9px] text-slate-500 mt-1">{unverifiedAccounts} awaiting review locks</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Fraudulent (Fake) Flagged</p>
                <p className="text-xl font-bold text-rose-450 font-mono">{fakeAccounts}</p>
                <p className="text-[9px] text-slate-400/80 mt-1">Blocked from ATM keypad access</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">Pending Support Tickets</p>
                <p className="text-xl font-bold text-yellow-450 font-mono">{pendingRequests}</p>
                <p className="text-[9px] text-slate-400/80 mt-1">Requires admin card-replacement approvals</p>
              </div>
            </div>

            {/* Developer architectural checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              
              <div className="lg:col-span-8 bg-slate-905/70 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">How This Sandbox Project Storage Works:</h3>
                <p className="text-[11.5px] leading-relaxed text-slate-450">
                  Per strict student programming mandates, this banking apparatus **avoids hosting cloud or relational SQL servers**. It utilizes localized memory segments representing plain comma-separated flat tables (shown under the **Flat Files Editor** tab). 
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-350">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-900">
                    <strong className="text-teal-400 font-bold block mb-0.5">📂 Flat-Files Loading:</strong>
                    The system triggers JS parsing matching C# code. If any row contains bad alphanumeric characters, warning streams prevent data crashes.
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-900">
                    <strong className="text-teal-400 font-bold block mb-0.5">💾 Instant Disk Injection:</strong>
                    Deposits or card actions perform safe serializing outputs back to a model text array, maintaining persistence without an external DB!
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-900 flex justify-between items-center">
                  <span className="text-[10.5px] text-slate-400">Want to back up active accounts? Descry downloading files button:</span>
                  <button 
                    onClick={() => { setSelectedFile('accounts.txt'); setActiveTab('files'); }}
                    className="text-xs py-1 px-3 bg-indigo-950/60 hover:bg-indigo-900 rounded text-indigo-300 font-medium"
                  >
                    View accounts.txt editor ➔
                  </button>
                </div>
              </div>

              {/* Developer quick action adding accounts */}
              <div className="lg:col-span-4 bg-slate-900/40 border border-slate-850 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                  <UserPlus className="w-4 h-4 text-emerald-500" /> Quick Account Form
                </h3>
                
                <form onSubmit={handleCreateAccount} className="space-y-2 text-[10px]">
                  <input 
                    type="text" 
                    placeholder="Account ID (eg 1004)" 
                    value={newAccNum} 
                    onChange={e => setNewAccNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-indigo-600 focus:outline-none placeholder-slate-600 text-slate-200"
                  />
                  <input 
                    type="text" 
                    placeholder="Holder Name (eg Bob Smith)" 
                    value={newAccName} 
                    onChange={e => setNewAccName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-indigo-600 focus:outline-none placeholder-slate-600 text-slate-200"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      maxLength={4}
                      placeholder="PIN (4 digits)" 
                      value={newAccPin} 
                      onChange={e => setNewAccPin(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-indigo-600 focus:outline-none placeholder-slate-600 text-slate-200"
                    />
                    <input 
                      type="number" 
                      placeholder="Initial Dep. ($)" 
                      value={newAccBalance} 
                      onChange={e => setNewAccBalance(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded p-1.5 focus:border-indigo-600 focus:outline-none placeholder-slate-600 text-slate-200"
                    />
                  </div>
                  
                  {newAccError && <p className="text-[9px] text-rose-450">{newAccError}</p>}
                  {newAccSuccess && <p className="text-[9px] text-emerald-450">{newAccSuccess}</p>}

                  <button 
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded cursor-pointer text-center"
                  >
                    Insert New Row Code
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* ACCOUNTS MANAGEMENT TAB */}
        {activeTab === 'accounts' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Query by holder or account ID..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-600 text-slate-200 w-64"
                />
              </div>

              {/* Account Filter Pills */}
              <div className="flex gap-1 flex-wrap p-1 bg-slate-950 rounded-lg border border-slate-850">
                {[
                  { id: 'all', label: 'All Registered', count: accounts.length },
                  { id: 'verified', label: 'Verified Real', count: accounts.filter(a => a.isVerified).length },
                  { id: 'unverified', label: 'Unverified Index', count: accounts.filter(a => !a.isVerified).length },
                  { id: 'fake', label: 'Fraud Suspect', count: accounts.filter(a => a.isFake).length }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setAccountFilter(p.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] uppercase font-mono tracking-tighter transition font-bold cursor-pointer ${
                      accountFilter === p.id 
                        ? 'bg-indigo-650 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      accountFilter === p.id ? 'bg-indigo-850 text-white shadow' : 'bg-slate-900 text-slate-500'
                    }`}>
                      {p.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl border border-slate-850 overflow-hidden">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="bg-slate-900 text-[10px] text-slate-450 uppercase border-b border-slate-800">
                    <th className="p-3">Account #</th>
                    <th className="p-3 border-l border-slate-850">Full Holder Name</th>
                    <th className="p-3 border-l border-slate-850 text-right">Balance</th>
                    <th className="p-3 border-l border-slate-850">PIN Index</th>
                    <th className="p-3 border-l border-slate-850">Safety State Checks (Real vs Fake)</th>
                    <th className="p-3 text-center">Actions / Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredAccounts.map((acc, index) => (
                    <tr key={index} className={`hover:bg-slate-900/40 ${acc.isFake ? 'bg-rose-950/10' : ''}`}>
                      <td className="p-3 font-bold text-slate-205">{acc.accountNumber}</td>
                      <td className="p-3 border-l border-slate-850 text-slate-350">{acc.holderName}</td>
                      <td className="p-3 border-l border-slate-850 text-right text-emerald-400 font-bold">${acc.balance.toFixed(2)}</td>
                      <td className="p-3 border-l border-slate-850 text-slate-400">●●●● ({acc.pin})</td>
                      <td className="p-3 border-l border-slate-850">
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold ${
                            acc.isVerified 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/50' 
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-905'
                          }`}>
                            {acc.isVerified ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            {acc.isVerified ? 'VERIFIED REAL' : 'UNVERIFIED INDEX'}
                          </span>

                          <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold ${
                            acc.isFake 
                              ? 'bg-rose-950 border border-rose-900 text-rose-400' 
                              : 'bg-slate-950 text-slate-500'
                          }`}>
                            {acc.isFake ? 'FRAUD SUSPECT' : 'CLEAN ID'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1.5 text-[10px] font-sans">
                          <button 
                            onClick={() => handleToggleVerify(acc.accountNumber)}
                            className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-[9px]"
                          >
                            {acc.isVerified ? 'UNVERIFY' : 'VERIFY REAL'}
                          </button>
                          <button 
                            onClick={() => handleToggleFake(acc.accountNumber)}
                            className={`px-2.5 py-1 rounded text-[9px] ${
                              acc.isFake 
                                ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900' 
                                : 'bg-rose-950 text-rose-450 hover:bg-rose-900'
                            }`}
                          >
                            {acc.isFake ? 'MARK AS REAL' : 'MARK AS FAKE'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUPPORT & INCIDENT TICKETS QUEUE */}
        {activeTab === 'support' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-205 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                ATM Crash Incident Reports & Add-Account Demands
              </h3>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                Story 17 specifies handling card crash receipts and registration updates. You can approve pending account forms directly from here, generating real banking index records instantly.
              </p>
            </div>

            <div className="space-y-3">
              {support.length === 0 ? (
                <div className="p-10 border border-dashed border-slate-800 text-center text-slate-500">
                  All systems operating normally. No active support requests.
                </div>
              ) : (
                support.map((ticket, i) => (
                  <div key={i} className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-250 font-mono">TICKET: {ticket.id}</span>
                        <span className={`p-1 px-2.5 uppercase text-[9px] font-sans font-bold rounded ${
                          ticket.status === 'Pending' 
                            ? 'bg-amber-955 text-amber-400 border border-amber-900' 
                            : ticket.status === 'Approved' || ticket.status === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                            : 'bg-slate-950 text-slate-500'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="bg-slate-950 p-1 px-2 text-[9px] text-zinc-450 rounded font-mono">
                          {ticket.requestType}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-350 leading-relaxed">
                        {ticket.description}
                      </p>

                      {ticket.requestedDetails && (
                        <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-[10px] font-mono text-indigo-400 space-y-1">
                          <p>⭐ Client Desired Name: <strong>{ticket.requestedDetails.holderName}</strong></p>
                          <p>📌 Setup PIN: <strong>{ticket.requestedDetails.pin}</strong> | Opening Balance: <strong>${ticket.requestedDetails.initialBalance}</strong></p>
                        </div>
                      )}

                      <p className="text-[10px] text-slate-500 font-mono">
                        User/Account Index: {ticket.accountNumber || 'Anonymous guest'} | Filed: {new Date(ticket.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {ticket.status === 'Pending' && (
                      <div className="flex gap-2 shrink-0 self-end md:self-center">
                        <button 
                          onClick={() => handleResolveSupport(ticket.id, 'Rejected')}
                          className="p-1.5 px-3 bg-red-950/80 hover:bg-red-900 border border-red-900/50 text-red-350 font-sans font-semibold rounded text-xs"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => {
                            if (ticket.requestType === 'New Account Request') {
                              handleResolveSupport(ticket.id, 'Approved');
                            } else {
                              handleResolveSupport(ticket.id, 'Resolved');
                            }
                          }}
                          className="p-1.5 px-4 bg-emerald-700 hover:bg-emerald-650 text-white font-sans font-semibold rounded text-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{ticket.requestType === 'New Account Request' ? 'Approve & Create' : 'Resolve Incident'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FLAT FILES EDITOR & C# IMPLEMENTATION PORTAL */}
        {activeTab === 'files' && (
          <div className="space-y-5 animate-fade-in text-xs">
            
            {/* Header select instructions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 font-bold">Select Simulated File:</span>
                <div className="flex bg-slate-90 font-mono border border-slate-800 rounded overflow-hidden">
                  {(['accounts.txt', 'transactions.txt', 'support_requests.txt'] as const).map(file => (
                    <button
                      key={file}
                      onClick={() => setSelectedFile(file)}
                      className={`px-3 py-1 text-xs cursor-pointer transition ${
                        selectedFile === file 
                          ? 'bg-indigo-650 text-white font-bold' 
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-350'
                      }`}
                    >
                      {file}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                
                {/* Visual File upload trigger */}
                <label className="flex items-center gap-1 text-[10px] bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold p-1 px-3.5 border border-slate-850 rounded cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload text file</span>
                  <input 
                    type="file" 
                    accept=".txt" 
                    className="hidden" 
                    onChange={handleFileUpload}
                  />
                </label>

                <button
                  onClick={downloadTextFile}
                  className="flex items-center gap-1.5 text-[10px] bg-indigo-950/50 hover:bg-indigo-900 text-indigo-300 font-bold p-1 px-3.5 border border-indigo-900/50 rounded transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {selectedFile}</span>
                </button>
              </div>
            </div>

            {/* Custom Interactive Code Editor Display */}
            <div className="space-y-2">
              <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex flex-col">
                <div className="bg-slate-900 p-2 px-4 border-b border-slate-850 flex justify-between items-center text-[10px] font-mono text-slate-450">
                  <span>ROOT / DISK / COMMUNITY_BANK_FS / {selectedFile}</span>
                  <span className="text-teal-400 animate-pulse font-bold flex items-center gap-1">
                    <Database className="w-3 h-3" /> PLANE TEXT CSV PARSER
                  </span>
                </div>
                
                <textarea
                  rows={10}
                  value={fileText}
                  onChange={e => setFileText(e.target.value)}
                  className="w-full bg-slate-950 p-4 font-mono text-[11px] text-teal-350 tracking-wider h-52 leading-relaxed focus:outline-none focus:bg-slate-950 scrollbar-thin rounded-b-xl"
                  placeholder="Insert CSV layout lines inside..."
                />
              </div>

              {editorFeedback && (
                <div className={`p-3 rounded-lg border text-[11px] leading-relaxed font-mono whitespace-pre-wrap ${
                  editorFeedback.success 
                    ? 'bg-emerald-955 text-emerald-350 border-emerald-900/55' 
                    : 'bg-rose-955 text-rose-350 border-rose-900/55'
                }`}>
                  {editorFeedback.msg}
                </div>
              )}

              <button
                onClick={handleSaveEditor}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-650 text-white font-bold cursor-pointer rounded-lg flex items-center justify-center gap-2 shadow"
              >
                <Save className="w-4 h-4" />
                <span>Save Plain-Text file & update live UI registers</span>
              </button>
            </div>

            {/* Educational C# Implementation Section (Story 1 & Story 15 learning support) */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-slate-205 flex items-center gap-1.5 uppercase tracking-wider">
                <Code className="w-4 h-4 text-teal-400" />
                Student C# Source Implementation Reference
              </h3>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                As a beginner student programmer learning backend system architecture, you're requested to write real file handling modules without a secondary SQL engine. Inspect how actual C# structures convert commas and string tokens dynamically:
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-32 overflow-y-auto scrollbar-thin">
                <pre className="text-[10px] text-indigo-350 leading-relaxed font-mono">
                  {selectedFile === 'accounts.txt' ? CS_CODE_EXAMPLES.accounts : CS_CODE_EXAMPLES.transactions}
                </pre>
              </div>

              <p className="text-[9.5px] text-slate-500 italic">
                *Tip: Feel free to select 'transactions.txt' above to see how logs serialize!
              </p>
            </div>

          </div>
        )}

        {/* LIVE SYSTEM AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-fade-in text-xs h-full flex flex-col justify-between">
            {/* Headers with audit search and export mechanisms */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse inline-block" />
                    ATM Terminal System Event Logs Journal
                  </h3>
                  <p className="text-[10.5px] text-slate-405 mt-0.5">Real-time trace entries generated dynamically via ATM actions, keypad inputs, and security gateways.</p>
                </div>
                
                <button
                  type="button"
                  onClick={handleExportLogs}
                  className="flex items-center gap-1.5 text-[10.5px] bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 font-bold py-1 px-3.5 border border-indigo-900/50 rounded transition cursor-pointer shrink-0 font-mono shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export LOGS (.CSV)</span>
                </button>
              </div>

              {/* Filters and search logs */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-slate-850">
                {/* Search Text */}
                <div className="md:col-span-4 relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search logs by keyword..."
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1 text-[11px] font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-600 text-slate-300"
                  />
                </div>

                {/* Level Pills */}
                <div className="md:col-span-8 flex flex-wrap gap-1 items-center justify-end">
                  {[
                    { id: 'all', label: 'All Trace', count: systemLogs.length, color: 'text-slate-450' },
                    { id: 'info', label: 'Info', count: systemLogs.filter(l => l.type === 'info').length, color: 'text-indigo-400' },
                    { id: 'success', label: 'Success', count: systemLogs.filter(l => l.type === 'success').length, color: 'text-emerald-400' },
                    { id: 'warning', label: 'Warning', count: systemLogs.filter(l => l.type === 'warning').length, color: 'text-yellow-400' },
                    { id: 'error', label: 'Error', count: systemLogs.filter(l => l.type === 'error').length, color: 'text-rose-450' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setLogFilter(p.id as any)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-semibold transition cursor-pointer flex items-center gap-1 ${
                        logFilter === p.id
                          ? 'bg-indigo-650 text-white font-bold'
                          : 'bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200'
                      }`}
                    >
                      <span className={p.color}>●</span>
                      <span>{p.label}</span>
                      <span className="text-[9px] opacity-70">({p.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List block */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-[11px] font-mono flex-1 overflow-y-auto space-y-1.5 scrollbar-thin min-h-[250px]">
              {filteredLogs.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-sans italic">
                  No log entries found matching log filter values or query keys.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="flex gap-2.5 items-start font-mono leading-relaxed select-text">
                    <span className="text-zinc-650 shrink-0">[{log.time}]</span>
                    <span className={`px-1.5 rounded shrink-0 text-[8px] font-sans font-bold py-0.5 border ${
                      log.type === 'success' ? 'bg-emerald-950 text-emerald-400 border-emerald-900/30' :
                      log.type === 'error' ? 'bg-rose-950 text-rose-450 border-rose-900/30 font-bold' :
                      log.type === 'warning' ? 'bg-yellow-950 text-yellow-400 border-yellow-900/30' :
                      'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className={`text-[11px] ${
                      log.type === 'error' ? 'text-rose-450 font-semibold' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-300' :
                      'text-slate-300'
                    }`}>
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Clear option */}
            <button 
              onClick={() => {
                onLogSystemActivity("Admin cleared console terminal history buffer.", 'info');
              }}
              className="text-center w-full py-1 text-[10px] text-slate-500 hover:text-slate-350 underline font-mono cursor-pointer shrink-0"
            >
              Clear Live Screen buffer log
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
