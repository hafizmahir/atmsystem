/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Account, Transaction, SupportRequest } from '../types';
import { 
  CreditCard, ArrowDownCircle, ArrowUpCircle, History, 
  XCircle, CheckCircle, AlertCircle, RefreshCw, Key, 
  HelpCircle, Receipt, DollarSign, CornerDownLeft, Inbox,
  Languages, Coins, ArrowRightLeft, Download
} from 'lucide-react';

interface AtmScreenProps {
  accounts: Account[];
  transactions: Transaction[];
  support: SupportRequest[];
  onUpdateData: (accounts: Account[], transactions: Transaction[], support: SupportRequest[]) => void;
  onLogSystemActivity: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AtmScreen({
  accounts,
  transactions,
  support,
  onUpdateData,
  onLogSystemActivity
}: AtmScreenProps) {
  // Global Language & Currency Configuration (User Switchable before & during transactions)
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Bangla'>('English');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'BDT'>('USD');

  // Exchange rate constant
  const EXCHANGE_RATE = 117.50;

  // Session States
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accountInput, setAccountInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [screenState, setScreenState] = useState<'welcome' | 'pin' | 'main' | 'balance' | 'deposit' | 'withdraw' | 'transfer' | 'history' | 'receipt' | 'support_ticket'>('welcome');
  
  // Hardware Simulation States
  const [isCardInserted, setIsCardInserted] = useState(false);
  const [isCardCrushedSimulated, setIsCardCrushedSimulated] = useState(false);
  const [dispensedCash, setDispensedCash] = useState<{ amount: number; symbol: string } | null>(null);
  const [printedReceipt, setPrintedReceipt] = useState<{
    txnId: string;
    type: string;
    amount: number;
    currency: string;
    balanceAfter: number;
    timestamp: string;
  } | null>(null);

  // Form Inputs
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportName, setSupportName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Localized UI Dictionary Translation Helper
  const t = (key: string, variables?: Record<string, string | number>) => {
    const dictionary: Record<string, { English: string; Bangla: string }> = {
      welcome: { English: "Welcome to Community Bank ATM", Bangla: "কমিউনিটি ব্যাংক এটিএম-এ স্বাগতম" },
      insertCard: { English: "Insert Demo Card or Enter Account Number:", Bangla: "কার্ড প্রবেশ করুন অথবা অ্যাকাউন্ট নম্বর লিখুন:" },
      enterPin: { English: "Enter Your 4-Digit Security PIN", Bangla: "আপনার ৪-সংখ্যার নিরাপত্তা পিনটি লিখুন" },
      authStatus: { English: "SECURE CARD AUTHENTICATION", Bangla: "নিরাপদ এটিএম কার্ড যাচাইকরণ" },
      pinPlaceholder: { English: "Enter 4-Digit PIN", Bangla: "৪-সংখ্যার পিন লিখুন" },
      submit: { English: "VALIDATE SECURE PIN", Bangla: "পিন যাচাই করুন" },
      accPlaceholder: { English: "1001 or type custom...", Bangla: "১০০১ বা অ্যাকাউন্ট লিখুন..." },
      balanceInquiry: { English: "Check Balance", Bangla: "ব্যালেন্স চেক" },
      depositMoney: { English: "Deposit Cash", Bangla: "টাকা জমা দিন" },
      withdrawMoney: { English: "Withdraw Cash", Bangla: "টাকা উত্তোলন" },
      fundTransfer: { English: "Fund Transfer", Bangla: "তহবিল স্থানান্তর" },
      miniStatement: { English: "Mini Statement", Bangla: "মিনি স্টেটমেন্ট" },
      reportDamage: { English: "Complaint Ticket", Bangla: "সেবা অভিযোগ কেন্দ্র" },
      logout: { English: "Eject Card & Exit", Bangla: "কার্ড বের করে প্রস্থান" },
      availableBalance: { English: "AVAILABLE OUTSTANDING BALANCE", Bangla: "আপনার অ্যাকাউন্টের ব্যালেন্স" },
      holderLabel: { English: "ACCOUNT HOLDER", Bangla: "হিসাবধারী গ্রাহকের নাম" },
      accNumLabel: { English: "ACCOUNT NUMBER", Bangla: "অ্যাকাউন্ট নম্বর" },
      statusVerified: { English: "VERIFIED REAL SYSTEM ASSET", Bangla: "যাচাইকৃত প্রকৃত ব্যাংক গ্রাহক" },
      returnMenu: { English: "RETURN TO MAIN MENU", Bangla: "প্রধান মেনুতে ফিরে যান" },
      depositTitle: { English: "Deposit Cash into Account", Bangla: "আপনার অ্যাকাউন্টে টাকা জমা দেওয়া" },
      depositAmountLabel: { English: "Specify deposit amount value:", Bangla: "জমাকৃত টাকার পরিমাণ লিখুন:" },
      insertCash: { English: "PROCEED DEPOSIT", Bangla: "ডিপোজিট করুন" },
      withdrawTitle: { English: "Secure Cash Withdrawal", Bangla: "নিরাপদ ক্যাশ উত্তোলন উইন্ডো" },
      withdrawCustomLabel: { English: "Or type custom amount:", Bangla: "অথবা নিজস্ব পরিমাণ লিখুন:" },
      withdrawAction: { English: "PROCEED WITHDRAWAL", Bangla: "টাকা উত্তোলন নিশ্চিত করুন" },
      transferTitle: { English: "Intra-Branch Fund Transfer Gateway", Bangla: "আন্তঃশাখা তহবিল স্থানান্তর গেটওয়ে" },
      transferTargetLabel: { English: "Enter Recipient Account Number:", Bangla: "প্রাপকের অ্যাকাউন্ট নম্বর লিখুন:" },
      transferAmountLabel: { English: "Enter Transfer Amount value:", Bangla: "স্থানান্তরযোগ্য টাকার পরিমাণ:" },
      proceedTransfer: { English: "CONFIRM & SEND FUNDS", Bangla: "তহবিল স্থানান্তর নিশ্চিত করুন" },
      historyTitle: { English: "TRANSACTION JOURNAL", Bangla: "লেনদেনের খতিয়ান বিবরণী" },
      noTransactions: { English: "No transaction history rows logged yet.", Bangla: "কোনো লেনদেনের তথ্য পাওয়া যায়নি।" },
      supportTitle: { English: "ATM Helpdesk complaining Desk", Bangla: "সেবা সহায়তা কমপ্লেক্স" },
      supportNameLabel: { English: "Reporter Full Name:", Bangla: "রিপোর্টার ব্যক্তির নাম:" },
      supportIssueLabel: { English: "Issue explanation / description:", Bangla: "অভিযোগ বা সমস্যার বিবরণ:" },
      submitSupport: { English: "SEND TICKET TO ADMIN", Bangla: "টিকিট অ্যাডমিনে পাঠান" },
      cancelBtn: { English: "CANCEL", Bangla: "বাতিল করুন" },
      exitBtn: { English: "Back to menu", Bangla: "মেনুতে ফিরে যান" },
    };

    const entry = dictionary[key];
    if (!entry) return key;
    let text = selectedLanguage === 'Bangla' ? entry.Bangla : entry.English;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  // Convert and Format Money dynamically based on currency selection
  const formatMoney = (amountInUSD: number) => {
    if (selectedCurrency === 'BDT') {
      const amountInBDT = amountInUSD * EXCHANGE_RATE;
      return `৳${amountInBDT.toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
    }
    return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  // Auto-dismiss feedback messages
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle Card Insertion
  const handleInsertCard = (accNum: string) => {
    if (isCardCrushedSimulated) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "কার্ড রিডার ব্লকড অবস্থায় রয়েছে। অনুগ্রহ করে অ্যাডমিনের সাহায্য নিন!"
        : "Card Reader blocked/crushed. Please clear system or submit support ticket!");
      return;
    }
    const acc = accounts.find(a => a.accountNumber === accNum);
    if (!acc) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "এই কার্ডের সাথে লিঙ্ক করা কোনো অ্যাকাউন্ট পাওয়া যায়নি।"
        : "No account linked to this card index. Please verify!");
      onLogSystemActivity(`Invalid card insertion attempt: ${accNum}`, 'error');
      return;
    }
    setIsCardInserted(true);
    setAccountInput(accNum);
    setScreenState('pin');
    setPinInput('');
    setErrorMessage('');
    onLogSystemActivity(`Card inserted for account: ${accNum} [Language: ${selectedLanguage}, Currency: ${selectedCurrency}]`, 'info');
  };

  const handleManualAccountLogin = () => {
    if (!accountInput.trim()) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "দয়া করে অ্যাকাউন্ট নম্বরটি লিখুন!" : "Please enter your account number!");
      return;
    }
    if (!/^\d+$/.test(accountInput.trim())) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "ভুল ইনপুট: অ্যাকাউন্ট নম্বর শুধুমাত্র সংখ্যার হতে হবে।" : "Invalid Input: Account number must contain numeric digits only.");
      return;
    }

    const acc = accounts.find(a => a.accountNumber === accountInput);
    if (!acc) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "অ্যাকাউন্ট প্রমাণীকরণ ব্যর্থ: অ্যাকাউন্ট নম্বরটির অস্তিত্ব নেই।"
        : "Authentication Error: Account number does not exist.");
      onLogSystemActivity(`Failed login attempt: Account ${accountInput} not found`, 'warning');
      return;
    }

    setScreenState('pin');
    setPinInput('');
    setErrorMessage('');
  };

  const handlePinSubmit = () => {
    if (!/^\d{4}$/.test(pinInput)) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "নিরাপত্তা সতর্কতা: পিন অবশ্যই ৪-সংখ্যার হতে হবে।"
        : "Security Warning: PIN must make up exactly 4 numeric digits.");
      onLogSystemActivity(`Invalid PIN structure input attempt for ${accountInput}`, 'warning');
      return;
    }

    const acc = accounts.find(a => a.accountNumber === accountInput);
    if (!acc || acc.pin !== pinInput) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "প্রবেশাধিকার নাকচ: অ্যাকাউন্ট নম্বর বা পিন ভুল হয়েছে।"
        : "Access Denied: Incorrect Account Number or PIN. Authentication failed.");
      onLogSystemActivity(`Failed authentication for account ${accountInput}`, 'error');
      return;
    }

    if (!acc.isVerified) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "সতর্কতা: এই অ্যাকাউন্টটি ব্যাংক দ্বারা অপরিবর্তিত বা লক অবস্থায় রয়েছে।"
        : "Warning: This account is currently LOCKED or UNVERIFIED by bank admins. Please report to support.");
      onLogSystemActivity(`Access blocked for unverified account: ${acc.accountNumber}`, 'warning');
      return;
    }

    if (acc.isFake) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "সিস্টেম নিরাপত্তা: এই অ্যাকাউন্টটি সন্দেহজনক/নকল হওয়ার কারণে ব্লক রয়েছে।"
        : "System Security: This account is flagged as FRAUDULENT/FAKE. All operations suspended.");
      onLogSystemActivity(`Fraud flag block: Account ${acc.accountNumber}`, 'error');
      return;
    }

    // Login successful
    setCurrentAccount(acc);
    setScreenState('main');
    setErrorMessage('');
    setSuccessMessage(selectedLanguage === 'Bangla'
      ? `স্বাগতম ${acc.holderName}! সফল নিরাপত্তা সেশন প্রতিষ্ঠিত হয়েছে।`
      : `Welcome back, ${acc.holderName}! Secure Session Established.`);
    onLogSystemActivity(`User ${acc.accountNumber} (${acc.holderName}) logged in successfully. Lang: ${selectedLanguage}, Curr: ${selectedCurrency}`, 'success');
  };

  const handleLogout = () => {
    onLogSystemActivity(`User logged out: ${currentAccount?.accountNumber || accountInput}`, 'info');
    setCurrentAccount(null);
    setAccountInput('');
    setPinInput('');
    setIsCardInserted(false);
    setScreenState('welcome');
    setDispensedCash(null);
    setPrintedReceipt(null);
    setTransferRecipient('');
    setTransferAmount('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Deposit Money Logic (With dynamic currency conversion)
  const handleDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "সতর্কতা: জমার পরিমাণ অবশ্যই একটি সঠিক পজিটিভ সংখ্যা হতে হবে।"
        : "Warning: Deposit amount must be a valid positive number.");
      return;
    }

    if (!currentAccount) return;

    // Convert input amount to master USD if currently in BDT
    const usdDepositAmt = selectedCurrency === 'BDT' ? amt / EXCHANGE_RATE : amt;

    if (usdDepositAmt > 10000) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "ডিপোজিটের সীমা অতিক্রম করেছে। এককালীন জমা দেওয়ার সর্বোচ্চ সীমা ১০,০০০ ইউএসডি সমপরিমাণ।"
        : "Deposit limit exceeded. Maximum single deposit is $10,000 USD equivalent.");
      return;
    }

    const updatedAccounts = accounts.map(a => {
      if (a.accountNumber === currentAccount.accountNumber) {
        return { ...a, balance: a.balance + usdDepositAmt };
      }
      return a;
    });

    const newTxnId = `TXN${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn: Transaction = {
      id: newTxnId,
      accountNumber: currentAccount.accountNumber,
      type: 'Deposit',
      amount: usdDepositAmt,
      timestamp: new Date().toISOString(),
      balanceAfter: currentAccount.balance + usdDepositAmt,
      status: 'Success',
      details: `Simulated Cash Deposit at ATM console in ${selectedCurrency}`
    };

    const updatedTransactions = [newTxn, ...transactions];
    onUpdateData(updatedAccounts, updatedTransactions, support);
    setCurrentAccount({ ...currentAccount, balance: currentAccount.balance + usdDepositAmt });

    // Print Receipt
    setPrintedReceipt({
      txnId: newTxnId,
      type: selectedLanguage === 'Bangla' ? 'ক্যাশ জমা (Deposit)' : 'Cash Deposit',
      amount: amt,
      currency: selectedCurrency,
      balanceAfter: currentAccount.balance + usdDepositAmt,
      timestamp: newTxn.timestamp
    });

    setSuccessMessage(selectedLanguage === 'Bangla'
      ? `সফল হয়েছে! ${selectedCurrency} ${amt.toFixed(2)} জমা হয়েছে।`
      : `Success! Successfully deposited ${selectedCurrency} ${amt.toFixed(2)}. Account balance updated.`);
    onLogSystemActivity(`User ${currentAccount.accountNumber} deposited ${selectedCurrency} ${amt} (New master USD Bal: $${(currentAccount.balance + usdDepositAmt).toFixed(2)})`, 'success');
    setDepositAmount('');
    setScreenState('receipt');
  };

  // Withdraw Cash Logic (With dynamic exchange conversion)
  const handleWithdrawal = (amtValue?: number) => {
    const amt = amtValue || parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "সতর্কতা: উত্তোলনের পরিমাণ অবশ্যই সঠিক পজিটিভ সংখ্যা হতে হবে।"
        : "Warning: Withdrawal amount must be a valid positive number.");
      return;
    }

    if (!currentAccount) return;

    // Convert input amount to master USD if in BDT
    const usdWithdrawAmt = selectedCurrency === 'BDT' ? amt / EXCHANGE_RATE : amt;

    if (usdWithdrawAmt > currentAccount.balance) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? `অপর্যাপ্ত ব্যালেন্স: আপনার অ্যাকাউন্টে পর্যাপ্ত টাকা নেই।`
        : `Insufficient Funds: Unable to withdraw ${selectedCurrency} ${amt.toFixed(2)} due to balance limit.`);
      onLogSystemActivity(`Failed withdrawal (Insufficient funds): Acc ${currentAccount.accountNumber} tried to obtain ${selectedCurrency} ${amt}`, 'warning');
      return;
    }

    // Atmospheric/ATM hardware checks
    if (selectedCurrency === 'USD' && amt % 20 !== 0) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "এটিএম সীমাবদ্ধতা: অনুগ্রহ করে শুধুমাত্র ২০ মার্কিন ডলারের গুণিতকে উত্তোলন করুন।"
        : "ATM limitation: Withdrawals must be in multiples of $20 USD.");
      return;
    }
    if (selectedCurrency === 'BDT' && amt % 500 !== 0) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "এটিএম সীমাবদ্ধতা: অনুগ্রহ করে শুধুমাত্র ৫০০ টাকার গুণিতকে উত্তোলন করুন।"
        : "ATM limitation: Withdrawals must be in multiples of ৳500 BDT.");
      return;
    }

    if (usdWithdrawAmt > 1000) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "দৈনিক উত্তোলন সীমা: এককালীন ১,০০০ মার্কিন ডলার সমপরিমাণের বেশি উত্তোলন করা সম্ভব নয়।"
        : "Daily Security limit: Cannot withdraw more than $1,000 USD equivalent per transaction.");
      return;
    }

    const updatedAccounts = accounts.map(a => {
      if (a.accountNumber === currentAccount.accountNumber) {
        return { ...a, balance: a.balance - usdWithdrawAmt };
      }
      return a;
    });

    const newTxnId = `TXN${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxn: Transaction = {
      id: newTxnId,
      accountNumber: currentAccount.accountNumber,
      type: 'Withdrawal',
      amount: usdWithdrawAmt,
      timestamp: new Date().toISOString(),
      balanceAfter: currentAccount.balance - usdWithdrawAmt,
      status: 'Success',
      details: `Simulated Cash Withdrawal in ${selectedCurrency}`
    };

    const updatedTransactions = [newTxn, ...transactions];
    onUpdateData(updatedAccounts, updatedTransactions, support);
    setCurrentAccount({ ...currentAccount, balance: currentAccount.balance - usdWithdrawAmt });

    // Physical Cash Output Simulation
    setDispensedCash({
      amount: amt,
      symbol: selectedCurrency === 'BDT' ? '৳' : '$'
    });

    // Receipt Structure
    setPrintedReceipt({
      txnId: newTxnId,
      type: selectedLanguage === 'Bangla' ? 'ক্যাশ উত্তোলন (Withdrawal)' : 'ATM Withdrawal',
      amount: amt,
      currency: selectedCurrency,
      balanceAfter: currentAccount.balance - usdWithdrawAmt,
      timestamp: newTxn.timestamp
    });

    setSuccessMessage(selectedLanguage === 'Bangla'
      ? `সফল হয়েছে! ${selectedCurrency} ${amt.toFixed(2)} ক্যাশ ট্র্যান্সফার করা হলো।`
      : `Success! Withdrew ${selectedCurrency} ${amt.toFixed(2)}. Please collect your banknotes below.`);
    onLogSystemActivity(`User ${currentAccount.accountNumber} withdrew ${selectedCurrency} ${amt} (New master USD Bal: $${(currentAccount.balance - usdWithdrawAmt).toFixed(2)})`, 'success');
    setWithdrawAmount('');
    setScreenState('receipt');
  };

  // Fund Transfer Logic
  const handleTransfer = () => {
    const rxAccNum = transferRecipient.trim();
    const amt = parseFloat(transferAmount);

    if (!rxAccNum) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "প্রাপকের অ্যাকাউন্ট নম্বরটি দিন।" : "Please specify a recipient account number.");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "স্থানান্তরের পরিমাণ সঠিক সংখ্যা হতে হবে।" : "Please enter a valid positive transfer amount.");
      return;
    }
    if (!currentAccount) return;

    if (rxAccNum === currentAccount.accountNumber) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "নিজের অ্যাকাউন্টে তহবিল স্থানান্তর করা সম্ভব নয়।" : "Safety Lock: Cannot transfer funds to your own logged-in account.");
      return;
    }

    const recipientAcc = accounts.find(a => a.accountNumber === rxAccNum);
    if (!recipientAcc) {
      setErrorMessage(selectedLanguage === 'Bangla' 
        ? "হিসাব মেলেনি: প্রাপকের অ্যাকাউন্ট নম্বরটি সিস্টেমে খুঁজে পাওয়া যায়নি।" 
        : "Transfer Failed: Recipient account number is not registered in our branch database.");
      return;
    }

    const usdTransferAmt = selectedCurrency === 'BDT' ? amt / EXCHANGE_RATE : amt;

    if (usdTransferAmt > currentAccount.balance) {
      setErrorMessage(selectedLanguage === 'Bangla'
        ? "অপর্যাপ্ত তহবিল: স্থানান্তরের জন্য আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।"
        : "Transfer Failed: Your balances are insufficient for this request.");
      return;
    }

    // Perform transaction: Deduct sender and credit recipient
    const updatedAccounts = accounts.map(a => {
      if (a.accountNumber === currentAccount.accountNumber) {
        return { ...a, balance: a.balance - usdTransferAmt };
      }
      if (a.accountNumber === rxAccNum) {
        return { ...a, balance: a.balance + usdTransferAmt };
      }
      return a;
    });

    const newTxnId = `TXN${Math.floor(100000 + Math.random() * 900000)}`;
    const stamp = new Date().toISOString();

    // Senders transaction ledger row
    const senderTxn: Transaction = {
      id: newTxnId,
      accountNumber: currentAccount.accountNumber,
      type: 'Withdrawal',
      amount: usdTransferAmt,
      timestamp: stamp,
      balanceAfter: currentAccount.balance - usdTransferAmt,
      status: 'Success',
      details: `Fund transfer to #${rxAccNum}`
    };

    // Recipients transaction ledger row
    const recipientTxn: Transaction = {
      id: newTxnId,
      accountNumber: rxAccNum,
      type: 'Deposit',
      amount: usdTransferAmt,
      timestamp: stamp,
      balanceAfter: recipientAcc.balance + usdTransferAmt,
      status: 'Success',
      details: `Fund transfer from #${currentAccount.accountNumber}`
    };

    const updatedTransactions = [senderTxn, recipientTxn, ...transactions];
    onUpdateData(updatedAccounts, updatedTransactions, support);
    setCurrentAccount({ ...currentAccount, balance: currentAccount.balance - usdTransferAmt });

    // Print receipt
    setPrintedReceipt({
      txnId: newTxnId,
      type: selectedLanguage === 'Bangla' ? 'তহবিল স্থানান্তর (Transfer)' : 'Account Transfer',
      amount: amt,
      currency: selectedCurrency,
      balanceAfter: currentAccount.balance - usdTransferAmt,
      timestamp: stamp
    });

    setSuccessMessage(selectedLanguage === 'Bangla'
      ? `তহবিল স্থানান্তর সফল হয়েছে! ${selectedCurrency} ${amt.toFixed(2)} অ্যাকাউন্ট #${rxAccNum}-কে পাঠানো হয়েছে।`
      : `Success! Transferred ${selectedCurrency} ${amt.toFixed(2)} to account #${rxAccNum} successfully.`);
    onLogSystemActivity(`User ${currentAccount.accountNumber} transferred ${selectedCurrency} ${amt} to Account ${rxAccNum} (Receipt: ${newTxnId})`, 'success');
    
    setTransferRecipient('');
    setTransferAmount('');
    setScreenState('receipt');
  };

  // Support complaint filing system
  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName.trim() || !supportMessage.trim()) {
      setErrorMessage(selectedLanguage === 'Bangla' ? "দয়া করে সবগুলো ঘর পূরণ করুন।" : "Please complete all fields of the support report.");
      return;
    }

    const ticketId = `SR${Math.floor(100 + Math.random() * 900)}`;
    const newTicket: SupportRequest = {
      id: ticketId,
      accountNumber: currentAccount?.accountNumber || accountInput || undefined,
      name: supportName,
      requestType: 'Card Crush',
      description: `[ATM-CRASHED-CARD REPORT] - ${supportMessage}`,
      status: 'Pending',
      timestamp: new Date().toISOString()
    };

    const updatedSupport = [newTicket, ...support];
    onUpdateData(accounts, transactions, updatedSupport);
    
    if (isCardInserted) {
      setIsCardCrushedSimulated(true);
      setIsCardInserted(false);
      onLogSystemActivity("Card Crush physical lock enabled on ATM due to customer safety ticket submission.", 'warning');
    }

    setSuccessMessage(selectedLanguage === 'Bangla'
      ? `টিকিট নিবন্ধিত হয়েছে! আপনার সাপোর্ট টিকিট আইডি: ${ticketId}`
      : `Ticket Registered! Support ticket ${ticketId} filed successfully. Bank administrators were notified.`);
    onLogSystemActivity(`Card crush report submitted by ${supportName} (Ticket: ${ticketId})`, 'info');
    setSupportName('');
    setSupportMessage('');
    setScreenState('welcome');
  };

  // Keyboard button interaction handlers
  const appendDigit = (digit: string) => {
    if (screenState === 'welcome') {
      setAccountInput(prev => prev + digit);
    } else if (screenState === 'pin') {
      if (pinInput.length < 4) {
        setPinInput(prev => prev + digit);
      }
    } else if (screenState === 'deposit') {
      setDepositAmount(prev => prev + digit);
    } else if (screenState === 'withdraw') {
      setWithdrawAmount(prev => prev + digit);
    } else if (screenState === 'transfer') {
      if (document.activeElement?.id === 'transfer-amt-input') {
        setTransferAmount(prev => prev + digit);
      } else {
        setTransferRecipient(prev => prev + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (screenState === 'welcome') {
      setAccountInput(prev => prev.slice(0, -1));
    } else if (screenState === 'pin') {
      setPinInput(prev => prev.slice(0, -1));
    } else if (screenState === 'deposit') {
      setDepositAmount(prev => prev.slice(0, -1));
    } else if (screenState === 'withdraw') {
      setWithdrawAmount(prev => prev.slice(0, -1));
    } else if (screenState === 'transfer') {
      if (document.activeElement?.id === 'transfer-amt-input') {
        setTransferAmount(prev => prev.slice(0, -1));
      } else {
        setTransferRecipient(prev => prev.slice(0, -1));
      }
    }
  };

  const handleClear = () => {
    if (screenState === 'welcome') {
      setAccountInput('');
    } else if (screenState === 'pin') {
      setPinInput('');
    } else if (screenState === 'deposit') {
      setDepositAmount('');
    } else if (screenState === 'withdraw') {
      setWithdrawAmount('');
    } else if (screenState === 'transfer') {
      setTransferRecipient('');
      setTransferAmount('');
    }
  };

  const handleKeypadCancel = () => {
    if (currentAccount) {
      setScreenState('main');
    } else {
      handleLogout();
    }
  };

  const handleKeypadEnter = () => {
    if (screenState === 'welcome') {
      handleManualAccountLogin();
    } else if (screenState === 'pin') {
      handlePinSubmit();
    } else if (screenState === 'deposit') {
      handleDeposit();
    } else if (screenState === 'withdraw') {
      handleWithdrawal();
    } else if (screenState === 'transfer') {
      handleTransfer();
    }
  };

  const accountTxns = transactions.filter(t => t.accountNumber === currentAccount?.accountNumber);

  return (
    <div className="flex flex-col xl:flex-row gap-6 p-1 max-w-full overflow-hidden items-stretch h-full">
      
      {/* ATM Physical Console Body box */}
      <div id="atm-console-main" className="flex-1 bg-slate-800 rounded-3xl p-5 border-4 border-slate-700 shadow-2xl flex flex-col justify-between max-w-2xl mx-auto min-h-[660px] text-white relative">
        
        {/* BRAND BANNER & LANGUAGE SWITCH SELECTORS */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center pb-3 border-b border-slate-700 mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 bg-indigo-650 rounded-lg text-[10.5px] font-bold font-mono tracking-widest text-slate-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              COMMUNITY BANK ATM
            </span>
          </div>

          {/* DYNAMIC CONTROLS SWITCH - Bangla/English and BDT/USD */}
          <div className="flex items-center gap-1.5 self-center">
            {/* Language Selection Option */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              <select 
                value={selectedLanguage}
                onChange={(e) => {
                  const lang = e.target.value as 'English' | 'Bangla';
                  setSelectedLanguage(lang);
                  onLogSystemActivity(`Locale terminal language switched: ${lang}`, 'info');
                }}
                className="bg-transparent text-[10px] text-slate-205 font-mono font-bold focus:outline-none border-none py-0.5"
              >
                <option value="English" className="bg-slate-950 text-white font-bold">English</option>
                <option value="Bangla" className="bg-slate-950 text-white font-bold">বাংলা (Bangla)</option>
              </select>
            </div>

            {/* Currency Selection Option */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
              <Coins className="w-3.5 h-3.5 text-yellow-500" />
              <select
                value={selectedCurrency}
                onChange={(e) => {
                  const curr = e.target.value as 'USD' | 'BDT';
                  setSelectedCurrency(curr);
                  onLogSystemActivity(`Core balance standard currency switched: ${curr}`, 'info');
                }}
                className="bg-transparent text-[10px] text-slate-205 font-mono font-bold focus:outline-none border-none py-0.5"
              >
                <option value="USD" className="bg-slate-950 text-white font-bold">USD ($)</option>
                <option value="BDT" className="bg-slate-950 text-white font-bold">BDT (৳)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ATM CRT BANK SCREEN */}
        <div className="relative bg-emerald-950 rounded-xl border-8 border-slate-950 shadow-inner p-4 min-h-[300px] flex flex-col justify-between overflow-hidden font-sans select-none">
          
          {/* CRT scan lines simulation effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
          
          {/* CRT Screen Security Header bar */}
          <div className="z-10 flex justify-between items-center text-emerald-400 text-[10px] font-mono border-b border-emerald-900/60 pb-1.5">
            <span className="tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-405 animate-pulse inline-block" />
              {t('authStatus')}
            </span>
            <span>{selectedLanguage === 'Bangla' ? 'এটিএম উইন্ডোজ ৩.২' : 'C# WinForms Terminal v3.2'}</span>
          </div>

          {/* CRT Internal Window routers based on state */}
          <div className="z-10 flex-1 flex flex-col justify-center py-2 text-center text-emerald-100">
            
            {/* WELCOME SCREEN */}
            {screenState === 'welcome' && (
              <div className="space-y-3.5 animate-fade-in text-center">
                <span className="inline-block p-1.5 bg-emerald-900/40 rounded-full text-emerald-400">
                  <CreditCard className="w-9 h-9" />
                </span>
                <h3 className="text-sm font-bold tracking-tight text-emerald-200 uppercase font-mono">
                  {t('welcome')}
                </h3>
                <p className="text-[11px] text-emerald-400 leading-normal max-w-sm mx-auto font-sans">
                  {t('insertCard')}
                </p>
                
                <div className="max-w-xs mx-auto space-y-2 pt-1">
                  <input 
                    type="text" 
                    placeholder="Enter Account Number"
                    value={accountInput} 
                    onChange={(e) => setAccountInput(e.target.value)}
                    className="w-full text-center font-mono tracking-widest bg-emerald-900/40 border border-emerald-800 text-emerald-300 rounded p-1.5 text-xs focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    onClick={handleManualAccountLogin}
                    className="w-full text-xs font-bold py-1.5 bg-emerald-800 text-emerald-200 hover:bg-emerald-700 rounded transition font-mono border border-emerald-750 cursor-pointer shadow-sm"
                  >
                    {t('continue')} ↵
                  </button>
                </div>
              </div>
            )}

            {/* PIN SECURITY SCREEN */}
            {screenState === 'pin' && (
              <div className="space-y-4 animate-fade-in max-w-xs mx-auto">
                <span className="inline-block p-1 px-2 text-indigo-950 font-mono text-[9px] font-bold rounded border border-indigo-900 bg-emerald-900/50 text-emerald-400">
                  {selectedLanguage === 'Bangla' ? 'নিরাপত্তা প্রমাণীকরণ উইন্ডো' : 'C# PRIVATE AUTHENTICATION SECURE'}
                </span>
                <h3 className="text-xs font-bold tracking-wide text-emerald-250 font-mono">
                  {t('enterPin')}
                </h3>
                
                {/* Visual custom dot indicators for input length */}
                <div className="flex gap-2 justify-center py-1">
                  {[0, 1, 2, 3].map((index) => (
                    <div 
                      key={index} 
                      className={`w-8 h-9 border rounded flex items-center justify-center font-bold text-lg transition-all ${
                        pinInput.length > index 
                          ? 'border-emerald-400 bg-emerald-900 text-emerald-300 shadow-md scale-105' 
                          : 'border-emerald-900 bg-emerald-950/40 text-emerald-850'
                      }`}
                    >
                      {pinInput.length > index ? '•' : ''}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleLogout}
                    className="flex-1 text-[11px] py-1 bg-red-950 border border-red-900 text-red-300 rounded cursor-pointer hover:bg-red-900/40 font-mono"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button 
                    onClick={handlePinSubmit}
                    className="flex-1 text-[11px] font-bold py-1 bg-emerald-800 text-emerald-100 hover:bg-emerald-700 rounded border border-emerald-750 cursor-pointer font-mono"
                  >
                    {t('submit')} ↵
                  </button>
                </div>
              </div>
            )}

            {/* MAIN DASHBOARD SCREEN (WinForms C# layout) */}
            {screenState === 'main' && currentAccount && (
              <div className="text-left animate-fade-in space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-900/60 pb-1.5">
                  <div>
                    <p className="text-[9px] text-emerald-455 font-mono">{t('holderLabel')}</p>
                    <p className="text-xs font-bold text-emerald-150">{currentAccount.holderName.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-emerald-455 font-mono">{t('accNumLabel')}</p>
                    <p className="text-xs font-bold text-emerald-150 font-mono">#{currentAccount.accountNumber}</p>
                  </div>
                </div>

                {/* Sub Menu Selection Header */}
                <p className="text-center font-mono text-[10px] text-emerald-300 font-bold bg-emerald-900/20 p-1 rounded border border-emerald-900/30">
                  {selectedLanguage === 'Bangla' ? 'ATM লেনদেন অপারেশন নির্বাচন করুন:' : 'SELECT WINDOWS ATM TRANSACTION OPERATION:'}
                </p>

                {/* C# WinForms Operations Grid Array Layout */}
                <div className="grid grid-cols-2 gap-2 text-[11.5px] font-mono">
                  {/* Balance Check */}
                  <button 
                    onClick={() => setScreenState('balance')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('balanceInquiry')}</span>
                  </button>

                  {/* Deposit Cash */}
                  <button 
                    onClick={() => setScreenState('deposit')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('depositMoney')}</span>
                  </button>

                  {/* Withdraw Cash */}
                  <button 
                    onClick={() => setScreenState('withdraw')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('withdrawMoney')}</span>
                  </button>

                  {/* Fund Transfer */}
                  <button 
                    onClick={() => setScreenState('transfer')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('fundTransfer')}</span>
                  </button>

                  {/* Mini Statement */}
                  <button 
                    onClick={() => setScreenState('history')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{t('miniStatement')}</span>
                  </button>

                  {/* Support Ticket */}
                  <button 
                    onClick={() => setScreenState('support_ticket')}
                    className="flex items-center gap-1.5 p-1.5 bg-emerald-900/40 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800/80 transition cursor-pointer text-left"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{t('reportDamage')}</span>
                  </button>
                </div>

                {/* Footer Exit Row */}
                <div className="pt-2 border-t border-emerald-900/60 flex justify-between">
                  <div className="text-[9.5px] font-mono text-emerald-450 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Session Currency: {selectedCurrency}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-[11px] p-0.5 px-3 bg-red-955/80 border border-red-900 text-red-200 hover:bg-red-900 rounded font-mono cursor-pointer transition shadow-sm"
                  >
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}

            {/* BALANCE INQUIRY SCREEN */}
            {screenState === 'balance' && currentAccount && (
              <div className="text-left space-y-3.5 animate-fade-in">
                <div className="bg-emerald-950/60 p-4 rounded border border-emerald-800 text-center space-y-1">
                  <p className="text-[10px] text-emerald-405 font-mono uppercase tracking-wider">{t('availableBalance')}</p>
                  <p className="text-2xl font-mono text-emerald-300 font-bold">{formatMoney(currentAccount.balance)}</p>
                </div>

                <div className="text-[10px] space-y-1 bg-emerald-950/40 p-2.5 rounded border border-emerald-900/60 text-emerald-400 font-mono">
                  <p>✔ {selectedLanguage === 'Bangla' ? 'হিসাবধারীর নাম:' : 'Account Holder:'} <strong className="text-emerald-100">{currentAccount.holderName}</strong></p>
                  <p>✔ {selectedLanguage === 'Bangla' ? 'ব্যাংক সেভিংস ট্রেইল:' : 'Audit Status:'} <strong className="text-teal-400">{t('statusVerified')}</strong></p>
                  <p>✔ Core Exchange Conversion Locked: 1 USD = {EXCHANGE_RATE} BDT</p>
                </div>

                <button 
                  onClick={() => setScreenState('main')}
                  className="w-full text-xs font-bold py-1.5 bg-emerald-800 text-emerald-100 hover:bg-emerald-700 rounded transition font-mono border border-emerald-750 cursor-pointer shadow-sm"
                >
                  {t('returnMenu')} ↵
                </button>
              </div>
            )}

            {/* DEPOSIT CASH SCREEN */}
            {screenState === 'deposit' && currentAccount && (
              <div className="space-y-3.5 py-1 animate-fade-in text-left">
                <h3 className="text-xs font-bold text-emerald-300 border-b border-emerald-900/60 pb-1.5 font-mono uppercase tracking-wider">
                  {t('depositTitle')} (#{currentAccount.accountNumber})
                </h3>

                <div className="max-w-xs mx-auto space-y-2">
                  <label className="text-[10.5px] text-emerald-405 font-mono block leading-relaxed">
                    {t('depositAmountLabel')} ({selectedCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-emerald-300 font-bold font-mono">
                      {selectedCurrency === 'BDT' ? '৳' : '$'}
                    </span>
                    <input 
                      type="text" 
                      placeholder="0.00" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full text-right font-mono bg-emerald-900/60 border border-emerald-800 text-emerald-300 rounded p-1.5 text-xs focus:outline-none focus:border-emerald-600 pl-7"
                    />
                  </div>
                </div>

                {/* Preset Fast Depositors options */}
                <div className="flex gap-2 max-w-sm mx-auto">
                  {[
                    { val: '500', label: selectedCurrency === 'BDT' ? '+৳৫০০' : '+$50' },
                    { val: '1000', label: selectedCurrency === 'BDT' ? '+৳১০০০' : '+$100' },
                    { val: '5000', label: selectedCurrency === 'BDT' ? '+৳৫০০০' : '+$500' }
                  ].map(item => (
                    <button 
                      key={item.val}
                      onClick={() => { 
                        // Set the value depending on what they choose
                        setDepositAmount(selectedCurrency === 'BDT' ? item.val : String(parseFloat(item.val) / 10));
                      }}
                      className="flex-1 py-1 bg-emerald-900/40 text-emerald-300 rounded text-[11px] font-mono border border-emerald-800 hover:bg-emerald-900 cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 max-w-xs mx-auto pt-1 font-mono">
                  <button 
                    onClick={() => setScreenState('main')}
                    className="flex-1 text-[11px] py-1 border border-emerald-900 text-emerald-400 hover:bg-emerald-900/30 rounded cursor-pointer"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button 
                    onClick={handleDeposit}
                    className="flex-1 text-[11px] font-bold py-1 bg-emerald-700 text-emerald-100 hover:bg-emerald-600 rounded cursor-pointer"
                  >
                    {t('insertCash')} ↵
                  </button>
                </div>
              </div>
            )}

            {/* UTILITY COMPACT WITHDRAW SCREEN */}
            {screenState === 'withdraw' && currentAccount && (
              <div className="space-y-3 py-1 animate-fade-in text-left">
                <h3 className="text-xs font-bold text-emerald-305 border-b border-emerald-900/60 pb-1 font-mono uppercase">
                  {t('withdrawTitle')}
                </h3>

                {/* Fast withdrawal grid controls */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                  {(selectedCurrency === 'BDT' ? [500, 1000, 2050, 5000] : [20, 40, 100, 200]).map(val => (
                    <button 
                      key={val}
                      onClick={() => handleWithdrawal(val)}
                      className="py-1 px-1.5 bg-emerald-900/50 hover:bg-emerald-900 rounded font-mono text-[10.5px] text-emerald-300 border border-emerald-800 cursor-pointer"
                    >
                      {selectedCurrency === 'BDT' ? `৳${val}` : `$${val}`}
                    </button>
                  ))}
                </div>

                <div className="max-w-xs mx-auto space-y-1">
                  <label className="text-[10.5px] text-emerald-410 font-mono">
                    {t('withdrawCustomLabel')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1 text-emerald-300 font-bold">
                      {selectedCurrency === 'BDT' ? '৳' : '$'}
                    </span>
                    <input 
                      type="text" 
                      placeholder={selectedCurrency === 'BDT' ? 'e.g. 1000' : 'e.g. 40'} 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full text-right font-mono bg-emerald-900/60 border border-emerald-800 text-emerald-300 rounded p-1 text-xs focus:outline-none focus:border-emerald-600 pl-7"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1 font-mono">
                  <button 
                    onClick={() => setScreenState('main')}
                    className="flex-1 text-[11px] py-1 border border-emerald-900 text-emerald-400 hover:bg-emerald-900/30 rounded cursor-pointer"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button 
                    onClick={() => handleWithdrawal()}
                    className="flex-1 text-[11px] font-bold py-1 bg-emerald-700 text-emerald-100 hover:bg-emerald-600 rounded cursor-pointer"
                  >
                    {t('withdrawAction')} ↵
                  </button>
                </div>
              </div>
            )}

            {/* NEW FUND TRANSFER SCREEN */}
            {screenState === 'transfer' && currentAccount && (
              <div className="space-y-3 py-1 animate-fade-in text-left">
                <h3 className="text-xs font-bold text-emerald-300 border-b border-emerald-900/60 pb-1 font-mono uppercase tracking-wider">
                  {t('transferTitle')}
                </h3>

                {/* Recipient Account row */}
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono block leading-none">
                    {t('transferTargetLabel')}
                  </label>
                  <input 
                    type="text"
                    id="transfer-target-input"
                    placeholder="Enter Recipient e.g. 1002"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="w-full bg-emerald-900/50 border border-emerald-800 text-emerald-300 rounded p-1 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Transfer amount value */}
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-400 font-mono block leading-none">
                    {t('transferAmountLabel')} ({selectedCurrency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1 text-emerald-300 font-bold">
                      {selectedCurrency === 'BDT' ? '৳' : '$'}
                    </span>
                    <input 
                      type="text"
                      id="transfer-amt-input"
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full text-right font-mono bg-emerald-900/50 border border-emerald-800 text-emerald-300 rounded p-1 text-xs focus:outline-none focus:border-emerald-500 pl-7"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1 font-mono">
                  <button 
                    onClick={() => setScreenState('main')}
                    className="flex-1 text-[11px] py-1 border border-emerald-900 text-emerald-400 hover:bg-emerald-900/30 rounded cursor-pointer"
                  >
                    {t('cancelBtn')}
                  </button>
                  <button 
                    onClick={handleTransfer}
                    className="flex-1 text-[11px] font-bold py-1 bg-emerald-750 text-emerald-100 hover:bg-emerald-700 rounded border border-emerald-700 cursor-pointer text-center"
                  >
                    {t('proceedTransfer')} ↵
                  </button>
                </div>
              </div>
            )}

            {/* MINI STATEMENT (TRANSACTION HISTORY SHEET) */}
            {screenState === 'history' && currentAccount && (
              <div className="text-left space-y-2.5 py-1 animate-fade-in font-mono text-[10.5px]">
                <div className="flex justify-between items-center border-b border-emerald-900 pb-1">
                  <span className="text-emerald-300 font-bold uppercase">{t('historyTitle')}</span>
                  <span className="text-emerald-450 text-[10px]">{selectedLanguage === 'Bangla' ? 'লোকাল খতিয়ান খসড়া' : 'C# Local Log'}</span>
                </div>

                {/* Ledger dynamic list viewport */}
                <div className="max-h-[150px] overflow-y-auto space-y-1 h-[135px] pr-1 scrollbar-thin">
                  {accountTxns.length === 0 ? (
                    <div className="text-center text-emerald-500 py-6 italic font-sans">
                      {t('noTransactions')}
                    </div>
                  ) : (
                    accountTxns.slice(0, 5).map((tItem, idx) => (
                      <div key={idx} className="flex justify-between p-1 px-1.5 rounded bg-emerald-950/60 border-l-2 border-emerald-850">
                        <div>
                          <p className="font-bold text-emerald-200 text-[10px]">{tItem.type}</p>
                          <p className="text-[8.5px] text-emerald-500 leading-none mt-0.5">
                            {new Date(tItem.timestamp).toLocaleDateString()} {new Date(tItem.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-[10px] ${tItem.type === 'Withdrawal' ? 'text-rose-400' : 'text-emerald-300'}`}>
                            {tItem.type === 'Withdrawal' ? '-' : '+'}{formatMoney(tItem.amount)}
                          </p>
                          <p className="text-[8.5px] text-emerald-500 leading-none">Bal: {formatMoney(tItem.balanceAfter)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => setScreenState('main')}
                  className="w-full text-xs font-bold py-1 bg-emerald-800 text-emerald-100 hover:bg-emerald-700 rounded text-center cursor-pointer font-mono border border-emerald-750 shadow-sm"
                >
                  {t('returnMenu')} ↵
                </button>
              </div>
            )}

            {/* SUCCESS TRANSACTION COMPLETION / PRINT RECEIPT SCREEN */}
            {screenState === 'receipt' && printedReceipt && (
              <div className="text-center space-y-3 animate-fade-in font-mono">
                <span className="inline-block p-1 bg-emerald-900/60 rounded-full text-emerald-400">
                  <CheckCircle className="w-7 h-7" />
                </span>
                <h3 className="text-xs font-bold text-emerald-250 uppercase">{t('receiptSuccess')}</h3>
                <p className="text-[10px] text-emerald-400 font-sans leading-snug">
                  {t('receiptSub')}
                </p>

                {/* Simulated Paper receipt slip structure */}
                <div className="bg-emerald-950 p-2 text-[10px] border border-emerald-900 rounded max-w-xs mx-auto text-left space-y-1 font-mono select-all">
                  <p className="text-emerald-500">{t('receiptNo')}: <strong className="text-emerald-200">{printedReceipt.txnId}</strong></p>
                  <p className="font-bold text-emerald-200">{printedReceipt.type}: {printedReceipt.currency === 'BDT' ? '৳' : '$'}{printedReceipt.amount.toFixed(2)} {printedReceipt.currency}</p>
                  <p className="text-emerald-300">{t('newBalance')}: {formatMoney(printedReceipt.balanceAfter)}</p>
                </div>

                <div className="flex gap-2 max-w-xs mx-auto">
                  <button 
                    onClick={() => {
                      setPrintedReceipt(printedReceipt);
                      onLogSystemActivity(`ATM receipt generated and pushed into layout paper holder slip.`, "success");
                      setScreenState('main');
                    }}
                    className="flex-1 text-[11px] py-1 bg-emerald-900 text-emerald-150 rounded cursor-pointer font-bold border border-emerald-800/80"
                  >
                    {t('continue')} ↵
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex-1 text-[11px] py-1 bg-slate-900 border border-emerald-900 text-emerald-400 rounded cursor-pointer"
                  >
                    {t('finishLogout')}
                  </button>
                </div>
              </div>
            )}

            {/* SUPPORT & TICKETING INCIDENT PANEL */}
            {screenState === 'support_ticket' && (
              <form onSubmit={handleSupportSubmit} className="text-left space-y-2.5 animate-fade-in py-1 font-mono">
                <div className="flex justify-between items-center border-b border-emerald-900 pb-1.5">
                  <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {t('supportTitle')}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setScreenState('main')}
                    className="text-emerald-400 hover:text-emerald-200 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <label className="text-emerald-400 block">{t('supportNameLabel')}</label>
                  <input 
                    type="text" 
                    placeholder="Abidur Rahman" 
                    value={supportName} 
                    onChange={(e) => setSupportName(e.target.value)}
                    className="w-full bg-emerald-900/50 border border-emerald-800 text-emerald-300 rounded p-1 text-xs focus:outline-none focus:border-amber-600"
                    required
                  />
                </div>

                <div className="space-y-0.5 text-[11px]">
                  <label className="text-emerald-400 block">{t('supportIssueLabel')}</label>
                  <textarea 
                    rows={2}
                    placeholder="Enter complain, request pin edit, or report mechanical blockage..." 
                    value={supportMessage} 
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full bg-emerald-900/50 border border-emerald-800 text-emerald-300 rounded p-1 text-xs focus:outline-none focus:border-amber-600 scrollbar-none"
                    required
                  />
                  <span className="text-[9px] text-emerald-500 leading-tight block">
                    {t('explainTicketing')}
                  </span>
                </div>

                <button 
                  type="submit"
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded text-xs transition text-center cursor-pointer shadow-sm uppercase border border-amber-550"
                >
                  {t('submitSupport')} ↵
                </button>
              </form>
            )}
          </div>

          {/* CRT Screen Security Footer logs */}
          <div className="z-10 mt-1.5 font-mono text-[9px] py-1 border-t border-emerald-900/50 flex flex-col justify-end">
            {errorMessage && (
              <div className="text-rose-400 bg-rose-955/20 p-1 px-2 rounded border border-rose-900/40 flex items-center gap-1.5 animate-pulse text-left">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                <span className="font-bold">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="text-emerald-300 bg-emerald-955/20 p-1 px-2 rounded border border-emerald-900/40 flex items-center gap-1.5 text-left">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
                <span className="font-bold">{successMessage}</span>
              </div>
            )}
            {!errorMessage && !successMessage && (
              <div className="text-emerald-650 text-center select-none font-mono text-[9px] tracking-widest uppercase">
                {selectedLanguage === 'Bangla' ? 'কমিউনিটি ব্যাংক নিরাপদ নোড ৪.৫.২' : 'ONLINE SECURE TRANSACTION NODE v4.5.2'}
              </div>
            )}
          </div>
        </div>

        {/* PHYSICAL DEVICE SLOTS LAYER */}
        <div className="grid grid-cols-12 gap-3 mt-4 pt-3 border-t border-slate-700">
          
          {/* ATM Keypad Console */}
          <div className="col-span-8 bg-slate-900 rounded-xl p-2.5 border-2 border-slate-755 shadow-inner flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => appendDigit(num)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-indigo-900 text-xs font-bold rounded-lg border-b-2 border-slate-950 shadow flex items-center justify-center cursor-pointer transition text-slate-200"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="p-2 bg-slate-800 hover:bg-slate-705 active:bg-slate-900 text-[10px] font-bold rounded-lg border-b-2 border-slate-950 shadow flex items-center justify-center text-amber-500 font-mono"
              >
                ◀ {selectedLanguage === 'Bangla' ? 'ব্যাক' : 'BACK'}
              </button>
              <button
                onClick={() => appendDigit('0')}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:bg-indigo-900 text-xs font-bold rounded-lg border-b-2 border-slate-950 shadow flex items-center justify-center text-slate-200"
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="p-2 bg-amber-950/20 hover:bg-amber-900/40 text-amber-400 text-[10px] font-bold rounded-lg border-b-2 border-slate-950 shadow flex items-center justify-center font-mono"
              >
                {selectedLanguage === 'Bangla' ? 'পরিষ্কার' : 'CLEAR'}
              </button>
            </div>

            {/* ATM ATM Command/Alert trigger hot-actions */}
            <div className="grid grid-cols-3 gap-1.5 mt-2 font-mono">
              <button
                onClick={handleKeypadCancel}
                className="p-1.5 bg-rose-950/80 hover:bg-rose-900 active:bg-rose-950 text-[8.5px] font-extrabold rounded-lg border-l-2 border-slate-950 border-b-2 text-rose-300 tracking-wider font-sans cursor-pointer"
              >
                {selectedLanguage === 'Bangla' ? 'বাতিল (CANCEL)' : 'CANCEL (EXIT)'}
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 bg-yellow-950/80 hover:bg-yellow-900 active:bg-yellow-950 text-[8.5px] font-extrabold rounded-lg border-l-2 border-slate-950 border-b-2 text-yellow-300 tracking-wider font-sans cursor-pointer"
              >
                {selectedLanguage === 'Bangla' ? 'সংশোধন' : 'CORRECTION'}
              </button>
              <button
                onClick={handleKeypadEnter}
                className="p-1.5 bg-emerald-950 hover:bg-emerald-900 active:bg-emerald-950 text-[8.5px] font-extrabold rounded-lg border-l-2 border-slate-950 border-b-2 text-emerald-400 font-mono tracking-wider cursor-pointer"
              >
                {selectedLanguage === 'Bangla' ? 'নিশ্চিত ↵' : 'ENTER ↵'}
              </button>
            </div>
          </div>

          {/* Device Side entries controls */}
          <div className="col-span-4 flex flex-col justify-between gap-2.5 font-mono text-[9px] text-slate-400">
            
            {/* Card reader entry */}
            <div className={`p-1.5 bg-slate-900 rounded-lg border text-center ${isCardInserted ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-700'}`}>
              <div className="font-bold text-[9px] text-slate-350 mb-1">{selectedLanguage === 'Bangla' ? 'কার্ড প্রবেশ স্লট' : 'ATM CARD SLOT'}</div>
              <div className="h-1.5 bg-black rounded relative border border-slate-800 mb-1.5 overflow-hidden">
                <div className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${isCardInserted ? 'w-full bg-emerald-500 animate-pulse' : 'w-3 bg-slate-700'}`} />
              </div>
              
              {!isCardInserted ? (
                <div className="space-y-1 block">
                  <button 
                    onClick={() => handleInsertCard('1001')}
                    className="w-full py-0.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 rounded text-[8px] font-mono cursor-pointer transition font-bold"
                  >
                    John (Acc 1001)
                  </button>
                  <button 
                    onClick={() => handleInsertCard('1002')}
                    className="w-full py-0.5 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-105 rounded text-[8px] font-mono cursor-pointer transition font-bold"
                  >
                    Sadia (Acc 1002)
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="w-full py-0.5 bg-red-955/80 hover:bg-red-900 border border-red-900 text-red-200 rounded text-[8px] cursor-pointer"
                >
                  {selectedLanguage === 'Bangla' ? 'কার্ড বের করুন' : 'Eject card'}
                </button>
              )}
            </div>

            {/* Cash Receipt output emitter */}
            <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-700 text-center">
              <span className="font-bold text-[9px] text-slate-350 block">{selectedLanguage === 'Bangla' ? 'রসিদ আউটপুট' : 'REC SLIP OUT'}</span>
              <div className="h-1 bg-black rounded mt-1 mb-1.5 relative" />
              {printedReceipt ? (
                <div className="relative animate-bounce">
                  <div className="bg-white text-slate-950 p-1 text-[8.5px] rounded-sm text-left shadow-lg scale-95 border-l-4 border-emerald-500 font-mono">
                    <div className="text-center font-bold border-b border-dashed border-slate-300 text-[8px] pb-1">COMMUNITY ATM</div>
                    <div className="space-y-0.5 pt-1">
                      <p>Txn: {printedReceipt.txnId}</p>
                      <p>Type: {printedReceipt.type}</p>
                      <p>Amt: {printedReceipt.currency === 'BDT' ? '৳' : '$'}{printedReceipt.amount} {printedReceipt.currency}</p>
                      <p className="font-bold border-t border-dashed border-slate-200 mt-1">Bal: {formatMoney(printedReceipt.balanceAfter)}</p>
                    </div>
                    <button 
                      onClick={() => setPrintedReceipt(null)}
                      className="mt-1 w-full bg-slate-900 text-white hover:bg-slate-800 text-[7.5px] py-0.5 rounded font-bold cursor-pointer"
                    >
                      {selectedLanguage === 'Bangla' ? 'রসিদ নিন [X]' : 'Take Slip [X]'}
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-[7.5px] text-slate-600 block py-1.5 italic">{selectedLanguage === 'Bangla' ? 'রসিদ নেই' : 'Waiting...'}</span>
              )}
            </div>

          </div>
        </div>

        {/* CASH OUTPUT DISPENSER DRAWER */}
        <div className="mt-3.5 pt-2 border-t border-slate-700">
          <div className="bg-slate-900 rounded-xl p-2 border border-slate-750 text-center">
            <span className="font-semibold text-[10px] text-slate-350 block mb-1 uppercase tracking-wider">{selectedLanguage === 'Bangla' ? 'ক্যাশ ডিসপেনসার ড্রয়ার' : 'CASH SHUTTER & DISPENSER'}</span>
            <div className={`h-10 rounded-lg border-2 relative transition-all duration-300 ${
              dispensedCash 
                ? 'bg-cyan-955 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.25)]' 
                : 'bg-black border-slate-850'
            } flex items-center justify-center overflow-hidden`}>
              
              {dispensedCash ? (
                <div className="flex items-center gap-3 animate-bounce z-10 font-sans">
                  <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-850 font-bold p-0.5 px-3 text-[10.5px] rounded shadow-md flex items-center gap-1 font-mono">
                    <span>{dispensedCash.symbol}{dispensedCash.amount.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setDispensedCash(null);
                      onLogSystemActivity(`Customer gathered banknotes from pay slot!`, 'success');
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-0.5 px-2 text-[8.5px] font-bold rounded uppercase tracking-wide cursor-pointer font-sans"
                  >
                    {selectedLanguage === 'Bangla' ? 'টাকা নিন' : 'Collect cash'}
                  </button>
                </div>
              ) : (
                <div className="text-[9px] text-slate-650 font-mono tracking-widest uppercase">
                  {selectedLanguage === 'Bangla' ? 'ডিসপেনসার বন্ধ রয়েছে' : 'SHUTTER DEACTIVATED'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ATM SIDEBAR WITH INTERACTIVE EDUCATION & SWITCH INFO */}
      <div className="w-full xl:w-72 bg-slate-900 border border-slate-805 rounded-2xl p-4 text-xs text-slate-300 flex flex-col justify-between">
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold border-b border-slate-800 pb-2 text-sm font-sans">
            <HelpCircle className="w-4 h-4" />
            <span>ATM Simulator Sandbox</span>
          </div>

          <div className="space-y-2.5">
            <p className="font-bold text-emerald-400 font-mono tracking-tight uppercase">📌 {selectedLanguage === 'Bangla' ? 'গ্রাহক তথ্য বিবরণ' : 'Demo Credentials (XML/TXT)'}:</p>
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-850 font-mono text-[10px] space-y-2">
              <div className="pb-1 border-b border-slate-900">
                <span className="text-white font-semibold">1. Standard User Asset:</span>
                <p>📍 Acc: <strong className="text-emerald-305 font-bold">1001</strong></p>
                <p>📍 PIN: <strong className="text-emerald-305 font-bold">1234</strong></p>
                <p className="text-[9px] text-zinc-500 mt-0.5">Name: Abidur Rahman</p>
              </div>
              <div>
                <span className="text-white font-semibold">2. Academic Test Asset:</span>
                <p>📍 Acc: <strong className="text-emerald-305 font-bold">1002</strong></p>
                <p>📍 PIN: <strong className="text-emerald-305 font-bold">8888</strong></p>
                <p className="text-[9px] text-zinc-500 mt-0.5 font-sans">Name: Sadia Islam (Taka-rich)</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-slate-850">
            <p className="font-bold text-teal-400 font-mono text-[11px] uppercase">⚡ Multi-Currency Logic:</p>
            <p className="leading-relaxed text-[10.5px] text-slate-400">
              The internal base accounts file stores values in standard **USD**. Sourcing currency converters switch formats live on-the-fly.
            </p>
            <div className="text-[9.5px] text-slate-450 pt-1.5 border-t border-slate-850/60 font-mono mt-1">
              • USD → Standard conversion ($)<br/>
              • BDT → Multiplied * 117.50 (৳)
            </div>
          </div>

          <div className="p-2 bg-indigo-950/30 border border-indigo-900/40 rounded text-slate-400 font-mono text-[9.5px]">
            <span className="font-bold text-indigo-300 block">💡 Test This Story Flow:</span>
            Change Language to **한국語/বাংলা** and Currency to **BDT (৳ Taka)** inside the top dropdown. Watch the entire GUI, available cash withdraw buttons, errors, statements, and inputs transform instantly!
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800/60 mt-4 text-[9px] text-slate-500 font-mono text-center">
          *Form code architecture maps directly to the C# Visual Studio Designer framework!
        </div>
      </div>
      
    </div>
  );
}
