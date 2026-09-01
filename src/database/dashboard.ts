import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase/config';

export interface DashboardAccount {
  id: string;
  kind: string;
  name: string;
  balance: number;
  liquid: boolean;
}

export interface DashboardGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  priority: number;
}

export interface DashboardSnapshot {
  period: string;
  grossAssets: number;
  debts: number;
  netWorth: number;
  income: number;
  expenses: number;
  investments: number;
}

export interface AllocationSlice {
  key:
    | 'liquidity'
    | 'markets'
    | 'realEstate'
    | 'longTerm';
  label: string;
  value: number;
}

export interface DashboardSummary {
  assets: number;
  debts: number;
  netWorth: number;

  liquidAssets: number;
  illiquidAssets: number;

  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyAutomaticInvestments: number;
  monthlyCashFlow: number;
  monthlySavingsRate: number | null;

  runwayMonths: number | null;
  debtToAssetRatio: number | null;

  investedMarketValue: number;
  investmentCost: number;
  unrealizedInvestmentGain: number;

  goalsTarget: number;
  goalsCurrent: number;

  salaryExpected: number | null;
  salaryActual: number | null;

  accounts: DashboardAccount[];
  goals: DashboardGoal[];
  snapshots: DashboardSnapshot[];
  allocation: AllocationSlice[];
}

function numberField(
  data: Record<string, unknown>,
  key: string,
): number {
  const value = data[key];

  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : 0;
}

function dateFromFirestore(
  value: unknown,
): Date | null {
  const timestamp =
    value as {
      toDate?: () => Date;
    } | undefined;

  return (
    timestamp?.toDate?.() ??
    (value instanceof Date
      ? value
      : null)
  );
}

function isCurrentMonth(
  value: unknown,
  now = new Date(),
): boolean {
  const date =
    dateFromFirestore(value);

  return (
    date !== null &&
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth()
  );
}

function currentPeriod(
  now = new Date(),
): string {
  return `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}`;
}

function allocationFor(
  accounts: DashboardAccount[],
): AllocationSlice[] {
  const buckets: Record<
    AllocationSlice['key'],
    number
  > = {
    liquidity: 0,
    markets: 0,
    realEstate: 0,
    longTerm: 0,
  };

  for (const account of accounts) {
    if (account.balance <= 0) {
      continue;
    }

    if (
      account.kind === 'pea' ||
      account.kind === 'cto'
    ) {
      buckets.markets +=
        account.balance;

      continue;
    }

    if (
      account.kind ===
      'realEstate'
    ) {
      buckets.realEstate +=
        account.balance;

      continue;
    }

    if (account.liquid) {
      buckets.liquidity +=
        account.balance;

      continue;
    }

    buckets.longTerm +=
      account.balance;
  }

  return [
    {
      key: 'liquidity',
      label: 'Liquidités',
      value: buckets.liquidity,
    },
    {
      key: 'markets',
      label: 'Marchés',
      value: buckets.markets,
    },
    {
      key: 'realEstate',
      label: 'Immobilier',
      value: buckets.realEstate,
    },
    {
      key: 'longTerm',
      label: 'Long terme',
      value: buckets.longTerm,
    },
  ];
}

export async function loadDashboardSummary(
  uid: string,
): Promise<DashboardSummary> {
  const [
    accountsSnapshot,
    incomesSnapshot,
    expensesSnapshot,
    automaticInvestmentsSnapshot,
    salaryChecksSnapshot,
    investmentsSnapshot,
    goalsSnapshot,
    snapshotsSnapshot,
  ] = await Promise.all([
    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'accounts',
        ),
        limit(100),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'incomes',
        ),
        orderBy(
          'receivedAt',
          'desc',
        ),
        limit(100),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'expenses',
        ),
        orderBy(
          'occurredAt',
          'desc',
        ),
        limit(200),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'automaticInvestments',
        ),
        limit(100),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'payrollChecks',
        ),
        orderBy(
          'createdAt',
          'desc',
        ),
        limit(1),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'investments',
        ),
        limit(200),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'goals',
        ),
        limit(100),
      ),
    ),

    getDocs(
      query(
        collection(
          db,
          'users',
          uid,
          'monthlySnapshots',
        ),
        orderBy(
          'period',
          'desc',
        ),
        limit(12),
      ),
    ),
  ]);

  const accounts:
    DashboardAccount[] =
    accountsSnapshot.docs.map(
      (item) => {
        const data =
          item.data();

        return {
          id: item.id,
          kind: String(
            data['kind'] ??
              'other',
          ),
          name: String(
            data['name'] ??
              '',
          ),
          balance: numberField(
            data,
            'balance',
          ),
          liquid:
            data['liquid'] ===
            true,
        };
      },
    );

  let assets = 0;
  let debts = 0;
  let liquidAssets = 0;

  for (const account of accounts) {
    if (account.balance >= 0) {
      assets += account.balance;

      if (account.liquid) {
        liquidAssets +=
          account.balance;
      }
    } else {
      debts += Math.abs(
        account.balance,
      );
    }
  }

  const monthlyIncome =
    incomesSnapshot.docs
      .filter((item) =>
        isCurrentMonth(
          item.data()[
            'receivedAt'
          ],
        ),
      )
      .reduce(
        (sum, item) =>
          sum +
          numberField(
            item.data(),
            'amount',
          ),
        0,
      );

  const monthlyExpenses =
    expensesSnapshot.docs
      .filter((item) =>
        isCurrentMonth(
          item.data()[
            'occurredAt'
          ],
        ),
      )
      .reduce(
        (sum, item) =>
          sum +
          numberField(
            item.data(),
            'amount',
          ),
        0,
      );

  const monthlyAutomaticInvestments =
    automaticInvestmentsSnapshot.docs
      .filter(
        (item) =>
          item.data()[
            'active'
          ] === true,
      )
      .reduce(
        (sum, item) => {
          const data =
            item.data();

          const amount =
            numberField(
              data,
              'amount',
            );

          const rawFrequency:
            unknown =
            data['frequency'];

          if (
            rawFrequency ===
            'weekly'
          ) {
            return (
              sum +
              (amount * 52) /
                12
            );
          }

          if (
            rawFrequency ===
            'quarterly'
          ) {
            return (
              sum +
              amount / 3
            );
          }

          return sum + amount;
        },
        0,
      );

  const monthlyCashFlow =
    monthlyIncome -
    monthlyExpenses -
    monthlyAutomaticInvestments;

  const monthlySavingsRate =
    monthlyIncome > 0
      ? monthlyCashFlow /
        monthlyIncome
      : null;

  const runwayMonths =
    monthlyExpenses > 0
      ? liquidAssets /
        monthlyExpenses
      : null;

  const debtToAssetRatio =
    assets > 0
      ? debts / assets
      : null;

  let investedMarketValue = 0;
  let investmentCost = 0;

  for (
    const item of
    investmentsSnapshot.docs
  ) {
    const data =
      item.data();

    investedMarketValue +=
      numberField(
        data,
        'currentValue',
      );

    investmentCost +=
      numberField(
        data,
        'quantity',
      ) *
      numberField(
        data,
        'averageCost',
      );
  }

  const goals: DashboardGoal[] =
    goalsSnapshot.docs
      .map((item) => {
        const data =
          item.data();

        const targetDate =
          dateFromFirestore(
            data['targetDate'],
          );

        return {
          id: item.id,

          name: String(
            data['name'] ??
              '',
          ),

          targetAmount:
            numberField(
              data,
              'targetAmount',
            ),

          currentAmount:
            numberField(
              data,
              'currentAmount',
            ),

          targetDate:
            targetDate
              ?.toISOString()
              .slice(0, 10) ??
            null,

          priority:
            Math.max(
              0,
              Math.min(
                10,
                Math.round(
                  numberField(
                    data,
                    'priority',
                  ),
                ),
              ),
            ),
        };
      })
      .sort(
        (a, b) =>
          b.priority -
          a.priority,
      );

  const goalsTarget =
    goals.reduce(
      (sum, item) =>
        sum +
        item.targetAmount,
      0,
    );

  const goalsCurrent =
    goals.reduce(
      (sum, item) =>
        sum +
        item.currentAmount,
      0,
    );

  const snapshots:
    DashboardSnapshot[] =
    snapshotsSnapshot.docs
      .map((item) => {
        const data =
          item.data();

        return {
          period: String(
            data['period'] ??
              '',
          ),

          grossAssets:
            numberField(
              data,
              'grossAssets',
            ),

          debts:
            numberField(
              data,
              'debts',
            ),

          netWorth:
            numberField(
              data,
              'netWorth',
            ),

          income:
            numberField(
              data,
              'income',
            ),

          expenses:
            numberField(
              data,
              'expenses',
            ),

          investments:
            numberField(
              data,
              'investments',
            ),
        };
      })
      .reverse();

  const latestSalary =
    salaryChecksSnapshot
      .docs[0]
      ?.data();

  return {
    assets,
    debts,
    netWorth:
      assets - debts,

    liquidAssets,

    illiquidAssets:
      Math.max(
        0,
        assets -
          liquidAssets,
      ),

    monthlyIncome,
    monthlyExpenses,
    monthlyAutomaticInvestments,
    monthlyCashFlow,
    monthlySavingsRate,

    runwayMonths,
    debtToAssetRatio,

    investedMarketValue,
    investmentCost,

    unrealizedInvestmentGain:
      investedMarketValue -
      investmentCost,

    goalsTarget,
    goalsCurrent,

    salaryExpected:
      latestSalary ===
      undefined
        ? null
        : numberField(
            latestSalary,
            'expectedNet',
          ),

    salaryActual:
      latestSalary ===
      undefined
        ? null
        : numberField(
            latestSalary,
            'actualNet',
          ),

    accounts,
    goals,
    snapshots,

    allocation:
      allocationFor(accounts),
  };
}

export async function saveMonthlySnapshot(
  uid: string,
  summary: DashboardSummary,
): Promise<string> {
  const period =
    currentPeriod();

  const reference = doc(
    db,
    'users',
    uid,
    'monthlySnapshots',
    period,
  );

  const existing =
    await getDoc(reference);

  const payload = {
    period,

    grossAssets:
      summary.assets,

    debts:
      summary.debts,

    netWorth:
      summary.netWorth,

    income:
      summary.monthlyIncome,

    expenses:
      summary.monthlyExpenses,

    investments:
      summary
        .monthlyAutomaticInvestments,
  };

  if (existing.exists()) {
    await updateDoc(
      reference,
      {
        ...payload,
        updatedAt:
          serverTimestamp(),
      },
    );
  } else {
    await setDoc(
      reference,
      {
        ...payload,
        createdAt:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
        schemaVersion: 1,
      },
    );
  }

  return period;
}