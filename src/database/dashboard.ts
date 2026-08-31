import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface DashboardSummary {
  assets: number;
  debts: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyAutomaticInvestments: number;
  salaryExpected: number | null;
  salaryActual: number | null;
}

function numberField(data: Record<string, unknown>, key: string): number {
  const value = data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export async function loadDashboardSummary(uid: string): Promise<DashboardSummary> {
  const [accounts, incomes, expenses, automaticInvestments, salaryChecks] = await Promise.all([
    getDocs(query(collection(db, 'users', uid, 'accounts'), limit(100))),
    getDocs(query(collection(db, 'users', uid, 'incomes'), orderBy('receivedAt', 'desc'), limit(100))),
    getDocs(query(collection(db, 'users', uid, 'expenses'), orderBy('occurredAt', 'desc'), limit(200))),
    getDocs(query(collection(db, 'users', uid, 'automaticInvestments'), limit(100))),
    getDocs(query(collection(db, 'users', uid, 'payrollChecks'), orderBy('createdAt', 'desc'), limit(1)))
  ]);
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const inCurrentMonth = (value: unknown) => {
    const maybeTimestamp = value as { toDate?: () => Date } | undefined;
    const date = maybeTimestamp?.toDate?.();
    return date !== undefined && date.getFullYear() === year && date.getMonth() === month;
  };
  let assets = 0;
  let debts = 0;
  for (const item of accounts.docs) {
    const data = item.data();
    const balance = numberField(data, 'balance');
    if (balance >= 0) assets += balance;
    else debts += Math.abs(balance);
  }
  const monthlyIncome = incomes.docs.filter((item) => inCurrentMonth(item.data()['receivedAt'])).reduce((sum, item) => sum + numberField(item.data(), 'amount'), 0);
  const monthlyExpenses = expenses.docs.filter((item) => inCurrentMonth(item.data()['occurredAt'])).reduce((sum, item) => sum + numberField(item.data(), 'amount'), 0);
  const monthlyAutomaticInvestments = automaticInvestments.docs.filter((item) => item.data()['active'] === true).reduce((sum, item) => sum + numberField(item.data(), 'amount'), 0);
  const latestSalary = salaryChecks.docs[0]?.data();
  return {
    assets,
    debts,
    netWorth: assets - debts,
    monthlyIncome,
    monthlyExpenses,
    monthlyAutomaticInvestments,
    salaryExpected: latestSalary === undefined ? null : numberField(latestSalary, 'expectedNet'),
    salaryActual: latestSalary === undefined ? null : numberField(latestSalary, 'actualNet')
  };
}
