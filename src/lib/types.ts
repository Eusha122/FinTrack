export interface Transaction {
  id: string;
  user_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  note: string | null;
  account: 'cash' | 'bank';
  target_account: 'cash' | 'bank' | null;
  date: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id?: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string | null;
  account: 'cash' | 'bank';
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run: string;
  is_active: boolean;
  created_at: string;
}

export interface AccountBalances {
  cash: number;
  bank: number;
  total: number;
}

export interface MonthlyData {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  categories: Record<string, number>;
  cashSpent: number;
  bankSpent: number;
}

export interface ParsedInput {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note: string;
}
