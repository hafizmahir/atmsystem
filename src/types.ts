export interface Account {
  accountNumber: string;
  pin: string;
  holderName: string;
  balance: number;
  isVerified: boolean;
  isFake: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountNumber: string;
  type: 'Deposit' | 'Withdrawal' | 'Transfer' | 'Account Created';
  amount: number;
  timestamp: string;
  balanceAfter: number;
  status: 'Success' | 'Failed';
  details?: string;
}

export interface SupportRequest {
  id: string;
  accountNumber?: string;
  name: string;
  requestType: 'Card Crush' | 'New Account Request';
  description: string;
  status: 'Pending' | 'Approved' | 'Resolved' | 'Rejected';
  timestamp: string;
  requestedDetails?: {
    pin: string;
    holderName: string;
    initialBalance: number;
  };
}

export interface SimulatedFiles {
  'accounts.txt': string;
  'transactions.txt': string;
  'support_requests.txt': string;
}
