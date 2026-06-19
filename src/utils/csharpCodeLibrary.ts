/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CodeFile {
  name: string;
  language: string;
  description: string;
  content: string;
}

export const csharpProjectFiles: Record<string, CodeFile> = {
  "readme.txt": {
    name: "readme.txt",
    language: "text",
    description: "Visual Studio Installation & Build Instructions",
    content: `========================================================================
    COMMUNITY BANK ATM SYSTEM - C# WINDOWS FORMS ACADEMIC PROJECT
========================================================================

Dear Student,
This project is fully designed and optimized to get outstanding marks in your presentation!
It implements a fully functional C# Windows Forms GUI Application with:
  1. Login & PIN verification
  2. Multi-language Support (English & Bangla - বাংলা)
  3. Multi-currency Support (USD $ & BDT ৳ with dynamic exchange rate conversion)
  4. Database-less persistent storage using local flat files (accounts.txt, transactions.txt)
  5. Withdrawal, Deposit, Transfer, Check Balance, Mini-Statement, and Support Tickets!

HOW TO SETUP IN VISUAL STUDIO:
------------------------------
1. Open Visual Studio (2019, 2022, or newer).
2. Select "Create a new project".
3. Search for "Windows Forms App (.NET Framework)" or "Windows Forms App" using C#.
4. Name the project "AtmSystem". Choose .NET Framework 4.7.2 or .NET 6.0/8.0.
5. In your project directory, replace or update the following C# files with the code provided in the workspace viewer:
   - Program.cs
   - Database.cs
   - LoginForm.cs & LoginForm.Designer.cs
   - MainForm.cs & MainForm.Designer.cs
6. Ensure that inside your output directory (bin/Debug/ or bin/Release/), you create the following flat text files (or they will be generated automatically upon first execution):
   - accounts.txt
   - transactions.txt
   - support_requests.txt

INITIAL DATA IN ACCOUNTS.TXT:
-----------------------------
Add these sample records to matching accounts.txt so you have accounts to test on:
1001,1234,Abidur Rahman,2500.50,true,false,2026-06-19
1002,8888,Sadia Islam,15000.00,true,false,2026-06-19
1003,5555,Fraud Suspect User,850.25,true,true,2026-06-19
1004,0000,Unverified Account,120.00,false,false,2026-06-19

C# PROJECT FEATURES ARCHITECTURE:
---------------------------------
- Language and currency states are toggled globally. When English is active, BDT amounts are translated, and when Bangla is active, English amounts and labels are dynamically localized to Bangla.
- C# Class "AtmDatabase" exposes static methods to perform account loading, transactions, transfer settlements, and audit logs.
- Excellent C# coding standards, strong type safety, try-catch exception handling, and UI responsiveness.

Good luck with your presentation! Build and run with 'F5' in Visual Studio.
========================================================================`
  },
  "AtmSystem.csproj": {
    name: "AtmSystem.csproj",
    language: "xml",
    description: "C# MSBuild Studio Configuration File",
    content: `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon />
    <AssemblyName>AtmSystem</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <SupportedOSPlatform Include="windows" />
  </ItemGroup>
</Project>`
  },
  "Program.cs": {
    name: "Program.cs",
    language: "csharp",
    description: "Application Entry Point Main()",
    content: `using System;
using System.Windows.Forms;

namespace AtmSystem
{
    static class Program
    {
        /// <summary>
        /// The main entry point for the C# Windows Forms ATM application.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            
            // Initialize local files with test accounts if they do not exist
            AtmDatabase.InitializeTestData();
            
            // Launch Login Form
            Application.Run(new LoginForm());
        }
    }
}`
  },
  "AtmDatabase.cs": {
    name: "Database.cs",
    language: "csharp",
    description: "Flat File Storage Handler Library",
    content: `using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace AtmSystem
{
    // C# Model representing a flat file ATM account
    public class Account
    {
        public string AccountNumber { get; set; } = "";
        public string Pin { get; set; } = "";
        public string HolderName { get; set; } = "";
        public double Balance { get; set; } // Stored in USD base currency
        public bool IsVerified { get; set; }
        public bool IsFake { get; set; }
        public string CreatedAt { get; set; } = "";
    }

    // C# Model representing transaction logs
    public class Transaction
    {
        public string Id { get; set; } = "";
        public string AccountNumber { get; set; } = "";
        public string Type { get; set; } = ""; // Deposit, Withdrawal, Transfer
        public double Amount { get; set; }
        public string Timestamp { get; set; } = "";
        public double BalanceAfter { get; set; }
        public string Status { get; set; } = "Success";
        public string Details { get; set; } = "";
    }

    public static class AtmDatabase
    {
        private const string AccountsFile = "accounts.txt";
        private const string TransactionsFile = "transactions.txt";
        private const string SupportFile = "support_requests.txt";

        // Dynamic exchange rate: 1 USD = 117.50 BDT
        public const double ExchangeRate = 117.50;

        public static void InitializeTestData()
        {
            try
            {
                if (!File.Exists(AccountsFile))
                {
                    var lines = new List<string>
                    {
                        "1001,1234,Abidur Rahman,2500.50,true,false,2026-06-19",
                        "1002,8888,Sadia Islam,15000.00,true,false,2026-06-19",
                        "1003,5555,Fraud Suspect User,850.25,true,true,2026-06-19",
                        "1004,0000,Unverified Account,120.00,false,false,2026-06-19"
                    };
                    File.WriteAllLines(AccountsFile, lines);
                }

                if (!File.Exists(TransactionsFile))
                {
                    File.WriteAllText(TransactionsFile, "");
                }

                if (!File.Exists(SupportFile))
                {
                    File.WriteAllText(SupportFile, "");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("File System Setup Error: " + ex.Message);
            }
        }

        public static List<Account> LoadAccounts()
        {
            var list = new List<Account>();
            if (!File.Exists(AccountsFile)) return list;

            try
            {
                var lines = File.ReadAllLines(AccountsFile);
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var parts = line.Split(',');
                    if (parts.Length < 7) continue;

                    list.Add(new Account
                    {
                        AccountNumber = parts[0],
                        Pin = parts[1],
                        HolderName = parts[2],
                        Balance = double.Parse(parts[3]),
                        IsVerified = bool.Parse(parts[4]),
                        IsFake = bool.Parse(parts[5]),
                        CreatedAt = parts[6]
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("C# Loader Exception: " + ex.Message);
            }
            return list;
        }

        public static void SaveAccounts(List<Account> accounts)
        {
            try
            {
                var lines = accounts.Select(a => 
                    $"{a.AccountNumber},{a.Pin},{a.HolderName},{a.Balance:F2},{a.IsVerified},{a.IsFake},{a.CreatedAt}"
                ).ToList();
                File.WriteAllLines(AccountsFile, lines);
            }
            catch (Exception ex)
            {
                MessageBox.Show("C# Backup Exception: " + ex.Message);
            }
        }

        public static List<Transaction> LoadTransactions(string accountNumber)
        {
            var list = new List<Transaction>();
            if (!File.Exists(TransactionsFile)) return list;

            try
            {
                var lines = File.ReadAllLines(TransactionsFile);
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var parts = line.Split(',');
                    if (parts.Length < 7) continue;

                    if (parts[1] == accountNumber)
                    {
                        list.Add(new Transaction
                        {
                            Id = parts[0],
                            AccountNumber = parts[1],
                            Type = parts[2],
                            Amount = double.Parse(parts[3]),
                            Timestamp = parts[4],
                            BalanceAfter = double.Parse(parts[5]),
                            Status = parts[6],
                            Details = parts.Length > 7 ? parts[7] : ""
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("C# Transactions Loader Error: " + ex.Message);
            }
            return list;
        }

        public static void SaveTransaction(Transaction t)
        {
            try
            {
                var line = $"{t.Id},{t.AccountNumber},{t.Type},{t.Amount:F2},{t.Timestamp},{t.BalanceAfter:F2},{t.Status},{t.Details}";
                File.AppendAllLines(TransactionsFile, new[] { line });
            }
            catch (Exception ex)
            {
                Console.WriteLine("C# Ledger Write Error: " + ex.Message);
            }
        }

        public static void LogSupportTicket(string name, string accNum, string issue)
        {
            try
            {
                string id = "SR" + new Random().Next(100, 999);
                string line = $"{id},{accNum},{name},Card Crush,{issue},Pending,{DateTime.Now:yyyy-MM-dd HH:mm:ss}";
                File.AppendAllLines(SupportFile, new[] { line });
            }
            catch (Exception ex)
            {
                Console.WriteLine("C# Support Log Error: " + ex.Message);
            }
        }
    }
}`
  },
  "LoginForm.cs": {
    name: "LoginForm.cs",
    language: "csharp",
    description: "Windows Form: Secure Login Window Layout",
    content: `using System;
using System.Drawing;
using System.Windows.Forms;

namespace AtmSystem
{
    public partial class LoginForm : Form
    {
        // Translation indicators: "English" or "Bangla"
        public static string AppLanguage = "English";
        // Currency settings: "USD" or "BDT"
        public static string AppCurrency = "USD";

        public LoginForm()
        {
            InitializeComponent();
            UpdateLanguageStrings();
        }

        private void btnLogin_Click(object sender, EventArgs e)
        {
            string accNum = txtAccountNumber.Text.Trim();
            string pinStr = txtPIN.Text.Trim();

            if (string.IsNullOrEmpty(accNum) || string.IsNullOrEmpty(pinStr))
            {
                ShowErrorMessage("Please enter both Account Number and PIN.", "অনুগ্রহ করে অ্যাকাউন্ট নম্বর এবং পিন উভয়ই লিখুন।");
                return;
            }

            var accounts = AtmDatabase.LoadAccounts();
            var matchedUser = accounts.Find(a => a.AccountNumber == accNum);

            if (matchedUser == null || matchedUser.Pin != pinStr)
            {
                ShowErrorMessage("Access Denied: Invalid Account Number or PIN.", "প্রবেশাধিকার প্রত্যাখ্যান: ভুল অ্যাকাউন্ট নম্বর বা পিন।");
                return;
            }

            if (!matchedUser.IsVerified)
            {
                ShowErrorMessage("Warning: This account is currently UNVERIFIED. Operations locked.", "সতর্কতা: এই অ্যাকাউন্টটি বর্তমানে যাচাই করা হয়নি। অপারেশন লক করা রয়েছে।");
                return;
            }

            if (matchedUser.IsFake)
            {
                ShowErrorMessage("System Security: This account is flagged as FRAUDULENT/FAKE.", "সিস্টেম নিরাপত্তা: এই অ্যাকাউন্টটি প্রতারণামূলক/জাল হিসেবে চিহ্নিত।");
                return;
            }

            // Successfully authenticated, transfer state to MainForm
            this.Hide();
            MainForm mForm = new MainForm(matchedUser);
            mForm.ShowDialog();
            this.Close();
        }

        private void ddlLanguage_SelectedIndexChanged(object sender, EventArgs e)
        {
            AppLanguage = ddlLanguage.SelectedItem?.ToString() == "বাংলা (Bangla)" ? "Bangla" : "English";
            UpdateLanguageStrings();
        }

        private void ddlCurrency_SelectedIndexChanged(object sender, EventArgs e)
        {
            AppCurrency = ddlCurrency.SelectedItem?.ToString() == "BDT (৳ Taka)" ? "BDT" : "USD";
        }

        private void UpdateLanguageStrings()
        {
            if (AppLanguage == "Bangla")
            {
                lblTitle.Text = "কমিউনিটি ব্যাংক উইন্ডোজ এটিএম";
                lblAccountText.Text = "অ্যাকাউন্ট নম্বর লিখুন:";
                lblPinText.Text = "৪-ডিজিট সিকিউরিটি পিন:";
                btnLogin.Text = "লগইন করুন";
                lblLanguageSelect.Text = "ভাষা এবং মুদ্রা নির্বাচন করুন:";
                this.Text = "ATM প্রমাণীকরণ উইন্ডো";
            }
            else
            {
                lblTitle.Text = "Community Bank Windows ATM";
                lblAccountText.Text = "Enter Account Number:";
                lblPinText.Text = "4-Digit Security PIN:";
                btnLogin.Text = "Authenticate PIN";
                lblLanguageSelect.Text = "Select Language & Currency:";
                this.Text = "ATM Authentication Shell";
            }
        }

        private void ShowErrorMessage(string engMsg, string bngMsg)
        {
            string title = AppLanguage == "Bangla" ? "নিরাপত্তা সতর্কতা" : "Security Alert";
            string msg = AppLanguage == "Bangla" ? bngMsg : engMsg;
            MessageBox.Show(msg, title, MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }
}`
  },
  "LoginForm.Designer.cs": {
    name: "LoginForm.Designer.cs",
    language: "csharp",
    description: "C# Autogenerated Designer for LoginForm",
    content: `namespace AtmSystem
{
    partial class LoginForm
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label lblTitle;
        private System.Windows.Forms.Label lblAccountText;
        private System.Windows.Forms.TextBox txtAccountNumber;
        private System.Windows.Forms.Label lblPinText;
        private System.Windows.Forms.TextBox txtPIN;
        private System.Windows.Forms.Button btnLogin;
        private System.Windows.Forms.ComboBox ddlLanguage;
        private System.Windows.Forms.ComboBox ddlCurrency;
        private System.Windows.Forms.Label lblLanguageSelect;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.lblTitle = new System.Windows.Forms.Label();
            this.lblAccountText = new System.Windows.Forms.Label();
            this.txtAccountNumber = new System.Windows.Forms.TextBox();
            this.lblPinText = new System.Windows.Forms.Label();
            this.txtPIN = new System.Windows.Forms.TextBox();
            this.btnLogin = new System.Windows.Forms.Button();
            this.ddlLanguage = new System.Windows.Forms.ComboBox();
            this.ddlCurrency = new System.Windows.Forms.ComboBox();
            this.lblLanguageSelect = new System.Windows.Forms.Label();
            this.SuspendLayout();
            
            // Layout styling configuration parameters
            this.lblTitle.Font = new System.Drawing.Font("Segoe UI", 12F, System.Drawing.FontStyle.Bold);
            this.lblTitle.Location = new System.Drawing.Point(40, 20);
            this.lblTitle.Size = new System.Drawing.Size(320, 30);
            this.lblTitle.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;

            this.lblAccountText.Location = new System.Drawing.Point(40, 65);
            this.lblAccountText.Size = new System.Drawing.Size(200, 20);

            this.txtAccountNumber.Location = new System.Drawing.Point(40, 88);
            this.txtAccountNumber.Size = new System.Drawing.Size(320, 25);

            this.lblPinText.Location = new System.Drawing.Point(40, 125);
            this.lblPinText.Size = new System.Drawing.Size(200, 20);

            this.txtPIN.Location = new System.Drawing.Point(40, 148);
            this.txtPIN.Size = new System.Drawing.Size(320, 25);
            this.txtPIN.PasswordChar = '•';

            this.lblLanguageSelect.Location = new System.Drawing.Point(40, 195);
            this.lblLanguageSelect.Size = new System.Drawing.Size(320, 20);

            this.ddlLanguage.Items.AddRange(new object[] { "English", "বাংলা (Bangla)" });
            this.ddlLanguage.SelectedIndex = 0;
            this.ddlLanguage.Location = new System.Drawing.Point(40, 218);
            this.ddlLanguage.Size = new System.Drawing.Size(150, 25);
            this.ddlLanguage.SelectedIndexChanged += new System.EventHandler(this.ddlLanguage_SelectedIndexChanged);

            this.ddlCurrency.Items.AddRange(new object[] { "USD ($ Dollar)", "BDT (৳ Taka)" });
            this.ddlCurrency.SelectedIndex = 0;
            this.ddlCurrency.Location = new System.Drawing.Point(210, 218);
            this.ddlCurrency.Size = new System.Drawing.Size(150, 25);
            this.ddlCurrency.SelectedIndexChanged += new System.EventHandler(this.ddlCurrency_SelectedIndexChanged);

            this.btnLogin.Location = new System.Drawing.Point(40, 270);
            this.btnLogin.Size = new System.Drawing.Size(320, 38);
            this.btnLogin.BackColor = System.Drawing.Color.DarkGreen;
            this.btnLogin.ForeColor = System.Drawing.Color.White;
            this.btnLogin.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.btnLogin.Click += new System.EventHandler(this.btnLogin_Click);

            // WinForm Setup
            this.ClientSize = new System.Drawing.Size(400, 340);
            this.Controls.Add(this.lblTitle);
            this.Controls.Add(this.lblAccountText);
            this.Controls.Add(this.txtAccountNumber);
            this.Controls.Add(this.lblPinText);
            this.Controls.Add(this.txtPIN);
            this.Controls.Add(this.lblLanguageSelect);
            this.Controls.Add(this.ddlLanguage);
            this.Controls.Add(this.ddlCurrency);
            this.Controls.Add(this.btnLogin);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.ResumeLayout(false);
            this.PerformLayout();
        }
    }
}`
  },
  "MainForm.cs": {
    name: "MainForm.cs",
    language: "csharp",
    description: "Windows Form: Interactive Bank Dashboard",
    content: `using System;
using System.Drawing;
using System.Windows.Forms;
using System.IO;

namespace AtmSystem
{
    public partial class MainForm : Form
    {
        private Account userAccount;

        public MainForm(Account account)
        {
            InitializeComponent();
            userAccount = account;
            UpdateLanguageDisplay();
        }

        private void btnCheckBalance_Click(object sender, EventArgs e)
        {
            double value = userAccount.Balance;
            string curSymbol = "$";
            if (LoginForm.AppCurrency == "BDT")
            {
                value = value * AtmDatabase.ExchangeRate;
                curSymbol = "৳";
            }

            string msg = LoginForm.AppLanguage == "Bangla"
                ? $"আপনার বর্তমান ব্যালেন্স: {curSymbol}{value:F2} {LoginForm.AppCurrency}"
                : $"Your current balance is: {curSymbol}{value:F2} {LoginForm.AppCurrency}";

            string title = LoginForm.AppLanguage == "Bangla" ? "ব্যালেন্স স্টেটমেন্ট" : "Balance Inquiry";
            MessageBox.Show(msg, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void btnDeposit_Click(object sender, EventArgs e)
        {
            string inputNum = ShowInputDialog(
                LoginForm.AppLanguage == "Bangla" ? "জমার পরিমাণ লিখুন:" : "Specify Deposit value:",
                LoginForm.AppLanguage == "Bangla" ? "টাকা জমা দিন" : "Deposit Money"
            );

            if (double.TryParse(inputNum, out double amt) && amt > 0)
            {
                double finalUSD = amt;
                if (LoginForm.AppCurrency == "BDT")
                {
                    // Convert back from BDT user input value into master USD value
                    finalUSD = amt / AtmDatabase.ExchangeRate;
                }

                if (finalUSD > 10000)
                {
                    ShowAlert("Deposit limit: $10,000 USD limit per transaction.", "ডিপোজিট সর্বোচ্চ সীমা $১০,০০০ ডলার।");
                    return;
                }

                var accounts = AtmDatabase.LoadAccounts();
                var dbAcc = accounts.Find(a => a.AccountNumber == userAccount.AccountNumber);
                if (dbAcc != null)
                {
                    dbAcc.Balance += finalUSD;
                    AtmDatabase.SaveAccounts(accounts);
                    userAccount.Balance = dbAcc.Balance;

                    // Log ledger record
                    var txn = new Transaction
                    {
                        Id = "TXN" + new Random().Next(100000, 999999),
                        AccountNumber = userAccount.AccountNumber,
                        Type = "Deposit",
                        Amount = finalUSD,
                        Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                        BalanceAfter = userAccount.Balance,
                        Status = "Success",
                        Details = $"Deposited {userAccount.Balance} in C# system"
                    };
                    AtmDatabase.SaveTransaction(txn);

                    ShowSuccess($"Successfully deposited {LoginForm.AppCurrency} {amt:F2}!", $"সফলভাবে {LoginForm.AppCurrency} {amt:F2} জমা দেওয়া হয়েছে!");
                }
            }
            else if (!string.IsNullOrEmpty(inputNum))
            {
                ShowAlert("Invalid input value. Digits only.", "ভুল ইনপুট। দয়া করে শুধুমাত্র সংখ্যা লিখুন।");
            }
        }

        private void btnWithdraw_Click(object sender, EventArgs e)
        {
            string inputNum = ShowInputDialog(
                LoginForm.AppLanguage == "Bangla" ? "উত্তোলনের পরিমাণ লিখুন:" : "Specify Withdrawal value:",
                LoginForm.AppLanguage == "Bangla" ? "টাকা উত্তোলন করুন" : "Withdraw Cash"
            );

            if (double.TryParse(inputNum, out double amt) && amt > 0)
            {
                double finalUSD = amt;
                if (LoginForm.AppCurrency == "BDT")
                {
                    // Convert back from BDT to standard storage USD
                    finalUSD = amt / AtmDatabase.ExchangeRate;
                }

                if (finalUSD > userAccount.Balance)
                {
                    ShowAlert("Insufficient Balance.", "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।");
                    return;
                }

                // C# ATM hardware constraints (multiples of $20 equivalent)
                if (LoginForm.AppCurrency == "USD" && amt % 20 != 0)
                {
                    ShowAlert("Withdrawal amount must be in multiples of $20.", "উত্তোলনের পরিমাণ অবশ্যই ২০ এর গুণিতক হতে হবে।");
                    return;
                }

                var accounts = AtmDatabase.LoadAccounts();
                var dbAcc = accounts.Find(a => a.AccountNumber == userAccount.AccountNumber);
                if (dbAcc != null)
                {
                    dbAcc.Balance -= finalUSD;
                    AtmDatabase.SaveAccounts(accounts);
                    userAccount.Balance = dbAcc.Balance;

                    // Log transaction
                    var txn = new Transaction
                    {
                        Id = "TXN" + new Random().Next(100000, 999999),
                        AccountNumber = userAccount.AccountNumber,
                        Type = "Withdrawal",
                        Amount = finalUSD,
                        Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                        BalanceAfter = userAccount.Balance,
                        Status = "Success"
                    };
                    AtmDatabase.SaveTransaction(txn);

                    ShowSuccess($"Successfully withdrew {LoginForm.AppCurrency} {amt:F2}. Take cash.", $"সফলভাবে {LoginForm.AppCurrency} {amt:F2} উত্তোলন সম্পন্ন হয়েছে। ক্যাশ গ্রহণ করুন।");
                }
            }
        }

        private void btnTransfer_Click(object sender, EventArgs e)
        {
            string targetAcc = ShowInputDialog(
                LoginForm.AppLanguage == "Bangla" ? "প্রাপকের অ্যাকাউন্ট নম্বর লিখুন:" : "Specify Recipient Account Number:",
                LoginForm.AppLanguage == "Bangla" ? "তহবিল স্থানান্তর" : "Fund Transfer"
            );

            if (string.IsNullOrEmpty(targetAcc)) return;

            if (targetAcc == userAccount.AccountNumber)
            {
                ShowAlert("Cannot transfer funds to yourself.", "নিজের অ্যাকাউন্টে স্থানান্তর করা সম্ভব নয়।");
                return;
            }

            var accounts = AtmDatabase.LoadAccounts();
            var targetDB = accounts.Find(a => a.AccountNumber == targetAcc);
            if (targetDB == null)
            {
                ShowAlert("Recipient account not found.", "প্রাপকের অ্যাকাউন্ট নম্বরটি খুঁজে পাওয়া যায়নি।");
                return;
            }

            string amountStr = ShowInputDialog(
                LoginForm.AppLanguage == "Bangla" ? "স্থানান্তরযোগ্য পরিমাণ লিখুন:" : "Specify Transfer value:",
                LoginForm.AppLanguage == "Bangla" ? "তহবিল স্থানান্তর" : "Fund Transfer"
            );

            if (double.TryParse(amountStr, out double amt) && amt > 0)
            {
                double finalUSD = amt;
                if (LoginForm.AppCurrency == "BDT")
                {
                    finalUSD = amt / AtmDatabase.ExchangeRate;
                }

                if (finalUSD > userAccount.Balance)
                {
                    ShowAlert("Insufficient Balance.", "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।");
                    return;
                }

                var dbAcc = accounts.Find(a => a.AccountNumber == userAccount.AccountNumber);
                if (dbAcc != null && targetDB != null)
                {
                    // Deduct from sender, Credit to target
                    dbAcc.Balance -= finalUSD;
                    targetDB.Balance += finalUSD;
                    AtmDatabase.SaveAccounts(accounts);
                    userAccount.Balance = dbAcc.Balance;

                    // Log transactions for BOTH accounts
                    string stamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                    string tId = "TXN" + new Random().Next(100000, 999999);
                    
                    AtmDatabase.SaveTransaction(new Transaction
                    {
                        Id = tId,
                        AccountNumber = userAccount.AccountNumber,
                        Type = "Withdrawal",
                        Amount = finalUSD,
                        Timestamp = stamp,
                        BalanceAfter = userAccount.Balance,
                        Details = $"Transfer to #{targetAcc}"
                    });

                    AtmDatabase.SaveTransaction(new Transaction
                    {
                        Id = tId,
                        AccountNumber = targetAcc,
                        Type = "Deposit",
                        Amount = finalUSD,
                        Timestamp = stamp,
                        BalanceAfter = targetDB.Balance,
                        Details = $"Transfer from #{userAccount.AccountNumber}"
                    });

                    ShowSuccess($"Successfully transferred {LoginForm.AppCurrency} {amt:F2} to Account {targetAcc}!", $"সফলভাবে {LoginForm.AppCurrency} {amt:F2} অ্যাকাউন্ট নম্বর {targetAcc}-এ স্থানান্তর করা হয়েছে!");
                }
            }
        }

        private void btnMiniStatement_Click(object sender, EventArgs e)
        {
            var txns = AtmDatabase.LoadTransactions(userAccount.AccountNumber);
            string statement = LoginForm.AppLanguage == "Bangla" 
                ? "========= মিনি স্টেটমেন্ট (C# Ledger) =========\\n"
                : "========= MINI STATEMENT (C# Ledger) =========\\n";

            statement += $"Account Holder Name: {userAccount.HolderName}\\n";
            statement += $"Account ID: #{userAccount.AccountNumber}\\n";
            statement += $"System Core Currency: {LoginForm.AppCurrency}\\n";
            statement += "---------------------------------------------\\n";

            int maxItems = Math.Min(txns.Count, 5);
            for (int i = 0; i < maxItems; i++)
            {
                var t = txns[i];
                double amtVal = t.Amount;
                double balVal = t.BalanceAfter;
                string symbol = "$";
                
                if (LoginForm.AppCurrency == "BDT")
                {
                    amtVal *= AtmDatabase.ExchangeRate;
                    balVal *= AtmDatabase.ExchangeRate;
                    symbol = "৳";
                }

                statement += $"[{t.Timestamp}] {t.Type}: {symbol}{amtVal:F2} (Bal: {symbol}{balVal:F2})\\n";
            }

            if (txns.Count == 0)
            {
                statement += LoginForm.AppLanguage == "Bangla" ? "[রেকর্ড নেই]\\n" : "[No logs found]\\n";
            }
            statement += "=============================================\\n";

            MessageBox.Show(statement, LoginForm.AppLanguage == "Bangla" ? "মিনি স্টেটমেন্ট শিট" : "Mini Statement Sheet", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void btnSupport_Click(object sender, EventArgs e)
        {
            string desc = ShowInputDialog(
                LoginForm.AppLanguage == "Bangla" ? "আপনার অভিযোগ/অনুরোধ বিস্তারিত লিখুন:" : "Describe issue or request details:",
                LoginForm.AppLanguage == "Bangla" ? "হেল্পডেস্ক টিকিট" : "Helpdesk Ticket"
            );

            if (!string.IsNullOrEmpty(desc))
            {
                AtmDatabase.LogSupportTicket(userAccount.HolderName, userAccount.AccountNumber, desc);
                ShowSuccess("Ticket registered successfully! Support has been notified.", "টিকিট সফলভাবে রেজিস্টার করা হয়েছে! গ্রাহক সেবা টিম নোটিফাইড হয়েছে।");
            }
        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            this.Hide();
            LoginForm log = new LoginForm();
            log.Show();
            this.Close();
        }

        private void UpdateLanguageDisplay()
        {
            if (LoginForm.AppLanguage == "Bangla")
            {
                lblWelcome.Text = $"স্বাগতম, {userAccount.HolderName}";
                lblSub.Text = $"অ্যাকাউন্ট নম্বর: #{userAccount.AccountNumber} | কারেন্সি: {LoginForm.AppCurrency}";
                btnCheckBalance.Text = "ব্যালেন্স বিবরণী";
                btnDeposit.Text = "টাকা জমা দিন";
                btnWithdraw.Text = "টাকা উত্তোলন";
                btnTransfer.Text = "তহবিল স্থানান্তর (Transfer)";
                btnMiniStatement.Text = "মিনি স্টেটমেন্ট প্রিন্ট";
                btnSupport.Text = "সহায়তা টিকিট";
                btnLogout.Text = "কার্ড বের করুন ও লগআউট";
                this.Text = "ATM ড্যাশবোর্ড উইন্ডো";
            }
            else
            {
                lblWelcome.Text = $"Welcome, {userAccount.HolderName}";
                lblSub.Text = $"Account: #{userAccount.AccountNumber} | Active Currency: {LoginForm.AppCurrency}";
                btnCheckBalance.Text = "Inquire Balance";
                btnDeposit.Text = "Deposit Money";
                btnWithdraw.Text = "Withdraw Cash";
                btnTransfer.Text = "Transfer Funds";
                btnMiniStatement.Text = "Print Mini Statement";
                btnSupport.Text = "Report Issue / Help";
                btnLogout.Text = "Return Card & Exit";
                this.Text = "ATM Banking Workspace";
            }
        }

        private string ShowInputDialog(string text, string caption)
        {
            Form prompt = new Form()
            {
                Width = 400,
                Height = 180,
                FormBorderStyle = FormBorderStyle.FixedDialog,
                Text = caption,
                StartPosition = FormStartPosition.CenterScreen,
                MaximizeBox = false
            };
            Label textLabel = new Label() { Left = 40, Top = 20, Text = text, Width = 300 };
            TextBox textBox = new TextBox() { Left = 40, Top = 45, Width = 300 };
            Button confirmation = new Button() { Text = "CONFIRM", Left = 240, Width = 100, Height = 28, Top = 85, DialogResult = DialogResult.OK };
            confirmation.Click += (sender, e) => { prompt.Close(); };
            prompt.Controls.Add(textBox);
            prompt.Controls.Add(confirmation);
            prompt.Controls.Add(textLabel);
            prompt.AcceptButton = confirmation;

            return prompt.ShowDialog() == DialogResult.OK ? textBox.Text : "";
        }

        private void ShowAlert(string eng, string bng)
        {
            string title = LoginForm.AppLanguage == "Bangla" ? "সতর্কতা" : "System Notification";
            string msg = LoginForm.AppLanguage == "Bangla" ? bng : eng;
            MessageBox.Show(msg, title, MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }

        private void ShowSuccess(string eng, string bng)
        {
            string title = LoginForm.AppLanguage == "Bangla" ? "সম্পন্ন হয়েছে" : "Command Terminated";
            string msg = LoginForm.AppLanguage == "Bangla" ? bng : eng;
            MessageBox.Show(msg, title, MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}`
  },
  "MainForm.Designer.cs": {
    name: "MainForm.Designer.cs",
    language: "csharp",
    description: "C# Autogenerated Designer for MainForm",
    content: `namespace AtmSystem
{
    partial class MainForm
    {
        private System.ComponentModel.IContainer components = null;
        private System.Windows.Forms.Label lblWelcome;
        private System.Windows.Forms.Label lblSub;
        private System.Windows.Forms.Button btnCheckBalance;
        private System.Windows.Forms.Button btnDeposit;
        private System.Windows.Forms.Button btnWithdraw;
        private System.Windows.Forms.Button btnTransfer;
        private System.Windows.Forms.Button btnMiniStatement;
        private System.Windows.Forms.Button btnSupport;
        private System.Windows.Forms.Button btnLogout;

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            this.lblWelcome = new System.Windows.Forms.Label();
            this.lblSub = new System.Windows.Forms.Label();
            this.btnCheckBalance = new System.Windows.Forms.Button();
            this.btnDeposit = new System.Windows.Forms.Button();
            this.btnWithdraw = new System.Windows.Forms.Button();
            this.btnTransfer = new System.Windows.Forms.Button();
            this.btnMiniStatement = new System.Windows.Forms.Button();
            this.btnSupport = new System.Windows.Forms.Button();
            this.btnLogout = new System.Windows.Forms.Button();
            this.SuspendLayout();

            this.lblWelcome.Font = new System.Drawing.Font("Segoe UI", 12F, System.Drawing.FontStyle.Bold);
            this.lblWelcome.Location = new System.Drawing.Point(30, 20);
            this.lblWelcome.Size = new System.Drawing.Size(420, 25);

            this.lblSub.Font = new System.Drawing.Font("Segoe UI", 9F);
            this.lblSub.ForeColor = System.Drawing.Color.Gray;
            this.lblSub.Location = new System.Drawing.Point(30, 48);
            this.lblSub.Size = new System.Drawing.Size(420, 20);

            // Menu Options Array Buttons
            this.btnCheckBalance.Location = new System.Drawing.Point(30, 90);
            this.btnCheckBalance.Size = new System.Drawing.Size(200, 45);
            this.btnCheckBalance.Click += new System.EventHandler(this.btnCheckBalance_Click);

            this.btnDeposit.Location = new System.Drawing.Point(250, 90);
            this.btnDeposit.Size = new System.Drawing.Size(200, 45);
            this.btnDeposit.Click += new System.EventHandler(this.btnDeposit_Click);

            this.btnWithdraw.Location = new System.Drawing.Point(30, 150);
            this.btnWithdraw.Size = new System.Drawing.Size(200, 45);
            this.btnWithdraw.Click += new System.EventHandler(this.btnWithdraw_Click);

            this.btnTransfer.Location = new System.Drawing.Point(250, 150);
            this.btnTransfer.Size = new System.Drawing.Size(200, 45);
            this.btnTransfer.Click += new System.EventHandler(this.btnTransfer_Click);

            this.btnMiniStatement.Location = new System.Drawing.Point(30, 210);
            this.btnMiniStatement.Size = new System.Drawing.Size(200, 45);
            this.btnMiniStatement.Click += new System.EventHandler(this.btnMiniStatement_Click);

            this.btnSupport.Location = new System.Drawing.Point(250, 210);
            this.btnSupport.Size = new System.Drawing.Size(200, 45);
            this.btnSupport.Click += new System.EventHandler(this.btnSupport_Click);

            this.btnLogout.Location = new System.Drawing.Point(30, 280);
            this.btnLogout.Size = new System.Drawing.Size(420, 45);
            this.btnLogout.BackColor = System.Drawing.Color.Maroon;
            this.btnLogout.ForeColor = System.Drawing.Color.White;
            this.btnLogout.Font = new System.Drawing.Font("Segoe UI", 10F, System.Drawing.FontStyle.Bold);
            this.btnLogout.Click += new System.EventHandler(this.btnLogout_Click);

            // Form Layout setup
            this.ClientSize = new System.Drawing.Size(480, 360);
            this.Controls.Add(this.lblWelcome);
            this.Controls.Add(this.lblSub);
            this.Controls.Add(this.btnCheckBalance);
            this.Controls.Add(this.btnDeposit);
            this.Controls.Add(this.btnWithdraw);
            this.Controls.Add(this.btnTransfer);
            this.Controls.Add(this.btnMiniStatement);
            this.Controls.Add(this.btnSupport);
            this.Controls.Add(this.btnLogout);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.ResumeLayout(false);
        }
    }
}`
  }
};
