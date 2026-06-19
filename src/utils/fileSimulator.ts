import { Account, Transaction, SupportRequest } from '../types';

// Default Accounts
const DEFAULT_ACCOUNTS: Account[] = [
  {
    accountNumber: '1001',
    pin: '1234',
    holderName: 'John Doe',
    balance: 5000.00,
    isVerified: true,
    isFake: false,
    createdAt: '2026-01-15T12:00:00Z',
  },
  {
    accountNumber: '1002',
    pin: '5555',
    holderName: 'Mr. Cryptic Spammer (Scam Acc)',
    balance: 250000.00,
    isVerified: false,
    isFake: true,
    createdAt: '2026-05-10T14:30:00Z',
  },
  {
    accountNumber: '1003',
    pin: '4321',
    holderName: 'Alice Smith',
    balance: 1530.45,
    isVerified: true,
    isFake: false,
    createdAt: '2026-02-18T09:15:00Z',
  }
];

// Default Transactions
const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN001',
    accountNumber: '1001',
    type: 'Deposit',
    amount: 1000.00,
    timestamp: '2026-06-18T10:00:00Z',
    balanceAfter: 5000.00,
    status: 'Success',
    details: 'Initial cash deposit at main ATM'
  },
  {
    id: 'TXN002',
    accountNumber: '1003',
    type: 'Withdrawal',
    amount: 200.00,
    timestamp: '2026-06-18T11:45:00Z',
    balanceAfter: 1530.45,
    status: 'Success',
    details: 'Cash withdrawal at ATM #3'
  }
];

// Default Support Requests
const DEFAULT_SUPPORT: SupportRequest[] = [
  {
    id: 'SR001',
    accountNumber: '1001',
    name: 'John Doe',
    requestType: 'Card Crush',
    description: 'My card is physically crushed and damaged. I need to request a replacement/new card immediately.',
    status: 'Pending',
    timestamp: '2026-06-19T08:12:00Z'
  },
  {
    id: 'SR002',
    name: 'Robert Jenkins',
    requestType: 'New Account Request',
    description: 'I would like to open a new checking account with an initial deposition.',
    status: 'Pending',
    timestamp: '2026-06-19T09:00:00Z',
    requestedDetails: {
      pin: '8888',
      holderName: 'Robert Jenkins',
      initialBalance: 1200.00
    }
  }
];

// Serialization: Account -> accounts.txt CSV style
export function serializeAccounts(accounts: Account[]): string {
  // Column Headers matching clean C# CSV format
  const header = 'AccountNumber,PIN,HolderName,Balance,IsVerified,IsFake,CreatedAt';
  const lines = accounts.map(acc => {
    // Escape names if containing commas (simple escape)
    const safeName = acc.holderName.replace(/,/g, ';');
    return `${acc.accountNumber},${acc.pin},${safeName},${acc.balance.toFixed(2)},${acc.isVerified},${acc.isFake},${acc.createdAt}`;
  });
  return [header, ...lines].join('\n');
}

// Deserialization: accounts.txt -> Account[] with rigorous error handling
export function deserializeAccounts(text: string): { data: Account[]; errors: string[] } {
  const accounts: Account[] = [];
  const errors: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length <= 1) return { data: [], errors: [] }; // Only header or empty

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // skip header-duplicate comments or blank lines
    if (rawLine.startsWith('#') || rawLine.startsWith('AccountNumber')) continue;

    const parts = rawLine.split(',');
    if (parts.length < 7) {
      errors.push(`Row ${i + 1}: Insufficient data columns (Expected 7, got ${parts.length})`);
      continue;
    }

    const [accNum, pin, name, balStr, verifiedStr, fakeStr, dateStr] = parts;

    // Type validation
    if (!/^\d+$/.test(accNum.trim())) {
      errors.push(`Row ${i + 1}: Account number "${accNum}" must be numeric digits only.`);
      continue;
    }
    if (!/^\d{4}$/.test(pin.trim())) {
      errors.push(`Row ${i + 1}: Account PIN "${pin}" must be exactly 4 digits.`);
      continue;
    }

    const parsedBalance = parseFloat(balStr);
    if (isNaN(parsedBalance)) {
      errors.push(`Row ${i + 1}: Invalid balance value "${balStr}".`);
      continue;
    }

    const isVerified = verifiedStr.trim().toLowerCase() === 'true';
    const isFake = fakeStr.trim().toLowerCase() === 'true';

    accounts.push({
      accountNumber: accNum.trim(),
      pin: pin.trim(),
      holderName: name.trim().replace(/;/g, ','),
      balance: parsedBalance,
      isVerified,
      isFake,
      createdAt: dateStr.trim() || new Date().toISOString()
    });
  }

  return { data: accounts, errors };
}

// Serialization: Transaction -> transactions.txt CSV style
export function serializeTransactions(txns: Transaction[]): string {
  const header = 'TransactionID,AccountNumber,Type,Amount,Timestamp,BalanceAfter,Status,Details';
  const lines = txns.map(t => {
    const safeDetails = (t.details || '').replace(/,/g, ';');
    return `${t.id},${t.accountNumber},${t.type},${t.amount.toFixed(2)},${t.timestamp},${t.balanceAfter.toFixed(2)},${t.status},${safeDetails}`;
  });
  return [header, ...lines].join('\n');
}

// Deserialization: transactions.txt -> Transaction[]
export function deserializeTransactions(text: string): { data: Transaction[]; errors: string[] } {
  const txns: Transaction[] = [];
  const errors: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;
    const parts = rawLine.split(',');
    if (parts.length < 7) {
      errors.push(`Row ${i + 1}: Insufficient transaction columns.`);
      continue;
    }

    const [id, accNum, type, amtStr, time, balAfterStr, status, details] = parts;
    const amount = parseFloat(amtStr);
    const balanceAfter = parseFloat(balAfterStr);

    if (isNaN(amount) || isNaN(balanceAfter)) {
      errors.push(`Row ${i + 1}: Numeric parse issue on amount/balanceAfter.`);
      continue;
    }

    txns.push({
      id: id.trim(),
      accountNumber: accNum.trim(),
      type: type.trim() as any,
      amount,
      timestamp: time.trim(),
      balanceAfter,
      status: status.trim() as any,
      details: details ? details.trim().replace(/;/g, ',') : ''
    });
  }
  return { data: txns, errors };
}

// Serialization: SupportRequest -> support_requests.txt JSON-lines or CSV style
// Let's use CSV.
export function serializeSupport(reqs: SupportRequest[]): string {
  const header = 'ID,Name,Type,AccountNumber,Status,Timestamp,Details_JSON';
  const lines = reqs.map(r => {
    const safeName = r.name.replace(/,/g, ';');
    const safeDesc = r.description.replace(/,/g, ';');
    const b64Details = r.requestedDetails ? btoa(JSON.stringify(r.requestedDetails)) : '';
    return `${r.id},${safeName},${r.requestType},${r.accountNumber || ''},${r.status},${r.timestamp},${safeDesc},${b64Details}`;
  });
  return [header, ...lines].join('\n');
}

// Deserialization: support_requests.txt
export function deserializeSupport(text: string): { data: SupportRequest[]; errors: string[] } {
  const reqs: SupportRequest[] = [];
  const errors: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine.startsWith('#')) continue;
    const parts = rawLine.split(',');
    if (parts.length < 7) {
      errors.push(`Row ${i + 1}: Insufficient support ticket columns.`);
      continue;
    }

    const [id, name, type, accNum, status, timestamp, desc, b64] = parts;
    let requestedDetails;
    if (b64 && b64.trim().length > 0) {
      try {
        requestedDetails = JSON.parse(atob(b64.trim()));
      } catch (e) {
        // Safe fallback
      }
    }

    reqs.push({
      id: id.trim(),
      name: name.trim().replace(/;/g, ','),
      requestType: type.trim() as any,
      accountNumber: accNum.trim() || undefined,
      status: status.trim() as any,
      timestamp: timestamp.trim(),
      description: desc ? desc.trim().replace(/;/g, ',') : '',
      requestedDetails
    });
  }
  return { data: reqs, errors };
}

// Local Storage Helper definitions
const CODESNI_CS_ACCOUNTS = `// C# Reading accounts.txt
public List<Account> LoadAccounts(string filePath) {
    var list = new List<Account>();
    if (!File.Exists(filePath)) return list;
    
    foreach (var line in File.ReadAllLines(filePath).Skip(1)) {
        var parts = line.Split(',');
        if (parts.Length >= 7) {
            list.Add(new Account {
                AccountNumber = parts[0],
                PIN = parts[1],
                HolderName = parts[2].Replace(';', ','),
                Balance = decimal.Parse(parts[3]),
                IsVerified = bool.Parse(parts[4]),
                IsFake = bool.Parse(parts[5]),
                CreatedAt = DateTime.Parse(parts[6])
            });
        }
    }
    return list;
}

// C# Writing accounts.txt
public void SaveAccounts(string filePath, List<Account> accounts) {
    var lines = new List<string> { "AccountNumber,PIN,HolderName,Balance,IsVerified,IsFake,CreatedAt" };
    foreach (var a in accounts) {
        string safeName = a.HolderName.Replace(',', ';');
        lines.Add($"\${a.AccountNumber},\${a.PIN},\${safeName},\${a.Balance},\${a.IsVerified},\${a.IsFake},\${a.CreatedAt:o}");
    }
    File.WriteAllLines(filePath, lines);
}`;

const CODESNI_CS_TRANSACTIONS = `// C# Reading transactions.txt
public List<Transaction> LoadTransactions(string filePath) {
    var list = new List<Transaction>();
    if (!File.Exists(filePath)) return list;
    
    foreach (var line in File.ReadAllLines(filePath).Skip(1)) {
        var parts = line.Split(',');
        if (parts.Length >= 7) {
            list.Add(new Transaction {
                ID = parts[0],
                AccountNumber = parts[1],
                Type = parts[2],
                Amount = decimal.Parse(parts[3]),
                Timestamp = DateTime.Parse(parts[4]),
                BalanceAfter = decimal.Parse(parts[5]),
                Status = parts[6],
                Details = parts.Length > 7 ? parts[7].Replace(';', ',') : ""
            });
        }
    }
    return list;
}`;

export const CS_CODE_EXAMPLES = {
  accounts: CODESNI_CS_ACCOUNTS,
  transactions: CODESNI_CS_TRANSACTIONS
};

// Orchestration to localStorage
export function initializeStorage() {
  if (!localStorage.getItem('atm_initialized')) {
    localStorage.setItem('atm_files_accounts', serializeAccounts(DEFAULT_ACCOUNTS));
    localStorage.setItem('atm_files_transactions', serializeTransactions(DEFAULT_TRANSACTIONS));
    localStorage.setItem('atm_files_support', serializeSupport(DEFAULT_SUPPORT));
    localStorage.setItem('atm_initialized', 'true');
  }
}

export function loadSimulatedFiles(): { accounts: Account[]; transactions: Transaction[]; support: SupportRequest[] } {
  initializeStorage();
  const accText = localStorage.getItem('atm_files_accounts') || '';
  const txnText = localStorage.getItem('atm_files_transactions') || '';
  const supText = localStorage.getItem('atm_files_support') || '';

  const accounts = deserializeAccounts(accText).data;
  const transactions = deserializeTransactions(txnText).data;
  const support = deserializeSupport(supText).data;

  return { accounts, transactions, support };
}

export function saveSimulatedFiles(accounts: Account[], transactions: Transaction[], support: SupportRequest[]) {
  localStorage.setItem('atm_files_accounts', serializeAccounts(accounts));
  localStorage.setItem('atm_files_transactions', serializeTransactions(transactions));
  localStorage.setItem('atm_files_support', serializeSupport(support));
}

export function getRawFileContents(): { accounts: string; transactions: string; support: string } {
  initializeStorage();
  return {
    accounts: localStorage.getItem('atm_files_accounts') || '',
    transactions: localStorage.getItem('atm_files_transactions') || '',
    support: localStorage.getItem('atm_files_support') || ''
  };
}

export function saveRawFile(fileName: string, text: string): { success: boolean; errorCount: number; errors: string[] } {
  if (fileName === 'accounts.txt') {
    const { data, errors } = deserializeAccounts(text);
    if (errors.length === 0) {
      localStorage.setItem('atm_files_accounts', text);
      return { success: true, errorCount: 0, errors };
    }
    return { success: false, errorCount: errors.length, errors };
  } else if (fileName === 'transactions.txt') {
    const { data, errors } = deserializeTransactions(text);
    if (errors.length === 0) {
      localStorage.setItem('atm_files_transactions', text);
      return { success: true, errorCount: 0, errors };
    }
    return { success: false, errorCount: errors.length, errors };
  } else if (fileName === 'support_requests.txt') {
    const { data, errors } = deserializeSupport(text);
    if (errors.length === 0) {
      localStorage.setItem('atm_files_support', text);
      return { success: true, errorCount: 0, errors };
    }
    return { success: false, errorCount: errors.length, errors };
  }
  return { success: false, errorCount: 1, errors: ['Unknown file identity'] };
}
