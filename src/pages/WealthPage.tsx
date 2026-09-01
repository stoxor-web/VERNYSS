import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import { Money } from '../components/Money';

import {
  addUserDocument,
  deleteUserDocument,
  listUserDocuments,
  updateUserDocument,
} from '../database/userRepository';

type AccountKind =
  | 'cash'
  | 'pea'
  | 'cto'
  | 'pel'
  | 'livretA'
  | 'livretJeune'
  | 'realEstate'
  | 'other';

type IncomeKind =
  | 'salary'
  | 'electedAllowance'
  | 'selfEmployed'
  | 'rental'
  | 'exceptional'
  | 'other';

interface AccountView {
  id: string;
  kind: AccountKind;
  name: string;
  balance: number;
  liquid: boolean;
}

interface IncomeView {
  id: string;
  kind: IncomeKind;
  label: string;
  amount: number;
  receivedAt: Date | null;
  recurring: boolean;
}

interface GoalView {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  priority: number;
}

const accountLabels:
  Record<
    AccountKind,
    string
  > = {
    cash:
      'Compte / espèces',

    pea:
      'PEA',

    cto:
      'CTO',

    pel:
      'PEL',

    livretA:
      'Livret A',

    livretJeune:
      'Livret Jeune',

    realEstate:
      'Immobilier',

    other:
      'Autre actif / dette',
  };

const incomeLabels:
  Record<
    IncomeKind,
    string
  > = {
    salary:
      'Salaire',

    electedAllowance:
      'Indemnité élective',

    selfEmployed:
      'Indépendant',

    rental:
      'Revenu locatif',

    exceptional:
      'Exceptionnel',

    other:
      'Autre',
  };

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

function parseNumber(
  value: string,
): number {
  return Number(
    value
      .replace(',', '.')
      .trim(),
  );
}

export default function WealthPage() {
  const { user } =
    useAuth();

  const [
    accounts,
    setAccounts,
  ] =
    useState<AccountView[]>(
      [],
    );

  const [
    incomes,
    setIncomes,
  ] =
    useState<IncomeView[]>(
      [],
    );

  const [
    goals,
    setGoals,
  ] =
    useState<GoalView[]>(
      [],
    );

  const [
    balanceDrafts,
    setBalanceDrafts,
  ] = useState<
    Record<string, string>
  >({});

  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    accountForm,
    setAccountForm,
  ] = useState({
    kind:
      'cash' as AccountKind,

    name: '',
    balance: '',
    liquid: true,
  });

  const [
    incomeForm,
    setIncomeForm,
  ] = useState({
    kind:
      'salary' as IncomeKind,

    label: '',
    amount: '',

    receivedAt:
      new Date()
        .toISOString()
        .slice(0, 10),

    recurring: true,
  });

  const [
    goalForm,
    setGoalForm,
  ] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    priority: '5',
  });

  const load =
    useCallback(
      async (): Promise<void> => {
        if (
          user === null
        ) {
          return;
        }

        const [
          accountDocs,
          incomeDocs,
          goalDocs,
        ] =
          await Promise.all([
            listUserDocuments(
              user.uid,
              'accounts',
              100,
            ),

            listUserDocuments(
              user.uid,
              'incomes',
              200,
            ),

            listUserDocuments(
              user.uid,
              'goals',
              100,
            ),
          ]);

        const nextAccounts:
          AccountView[] =
          accountDocs.map(
            ({
              id,
              data,
            }) => ({
              id,

              kind:
                String(
                  data[
                    'kind'
                  ] ??
                    'other',
                ) as AccountKind,

              name:
                String(
                  data[
                    'name'
                  ] ??
                    '',
                ),

              balance:
                Number(
                  data[
                    'balance'
                  ] ??
                    0,
                ),

              liquid:
                data[
                  'liquid'
                ] === true,
            }),
          );

        const nextIncomes:
          IncomeView[] =
          incomeDocs
            .map(
              ({
                id,
                data,
              }) => ({
                id,

                kind:
                  String(
                    data[
                      'kind'
                    ] ??
                      'other',
                  ) as IncomeKind,

                label:
                  String(
                    data[
                      'label'
                    ] ??
                      '',
                  ),

                amount:
                  Number(
                    data[
                      'amount'
                    ] ??
                      0,
                  ),

                receivedAt:
                  dateFromFirestore(
                    data[
                      'receivedAt'
                    ],
                  ),

                recurring:
                  data[
                    'recurring'
                  ] === true,
              }),
            )
            .sort(
              (a, b) =>
                (b.receivedAt
                  ?.getTime() ??
                  0) -
                (a.receivedAt
                  ?.getTime() ??
                  0),
            );

        const nextGoals:
          GoalView[] =
          goalDocs
            .map(
              ({
                id,
                data,
              }) => {
                const date =
                  dateFromFirestore(
                    data[
                      'targetDate'
                    ],
                  );

                return {
                  id,

                  name:
                    String(
                      data[
                        'name'
                      ] ??
                        '',
                    ),

                  targetAmount:
                    Number(
                      data[
                        'targetAmount'
                      ] ??
                        0,
                    ),

                  currentAmount:
                    Number(
                      data[
                        'currentAmount'
                      ] ??
                        0,
                    ),

                  targetDate:
                    date
                      ?.toISOString()
                      .slice(
                        0,
                        10,
                      ) ??
                    null,

                  priority:
                    Number(
                      data[
                        'priority'
                      ] ??
                        0,
                    ),
                };
              },
            )
            .sort(
              (a, b) =>
                b.priority -
                a.priority,
            );

        setAccounts(
          nextAccounts,
        );

        setIncomes(
          nextIncomes,
        );

        setGoals(
          nextGoals,
        );

        setBalanceDrafts(
          Object.fromEntries(
            nextAccounts.map(
              (account) => [
                account.id,
                String(
                  account.balance,
                ),
              ],
            ),
          ),
        );
      },
      [user],
    );

  useEffect(() => {
    void load().catch(
      () => {
        setMessage(
          'Impossible de charger la gestion patrimoniale.',
        );
      },
    );
  }, [load]);

  const totals =
    useMemo(() => {
      const assets =
        accounts
          .filter(
            (item) =>
              item.balance >=
              0,
          )
          .reduce(
            (sum, item) =>
              sum +
              item.balance,
            0,
          );

      const debts =
        accounts
          .filter(
            (item) =>
              item.balance <
              0,
          )
          .reduce(
            (sum, item) =>
              sum +
              Math.abs(
                item.balance,
              ),
            0,
          );

      const liquid =
        accounts
          .filter(
            (item) =>
              item.balance >
                0 &&
              item.liquid,
          )
          .reduce(
            (sum, item) =>
              sum +
              item.balance,
            0,
          );

      return {
        assets,
        debts,
        liquid,
        net:
          assets - debts,
      };
    }, [accounts]);

  const currentMonthIncome =
    useMemo(() => {
      const now =
        new Date();

      return incomes
        .filter(
          (item) =>
            item.receivedAt !==
              null &&
            item.receivedAt
              .getFullYear() ===
              now.getFullYear() &&
            item.receivedAt
              .getMonth() ===
              now.getMonth(),
        )
        .reduce(
          (sum, item) =>
            sum +
            item.amount,
          0,
        );
    }, [incomes]);

  const addAccount =
    async (): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const balance =
        parseNumber(
          accountForm.balance,
        );

      if (
        accountForm.name
          .trim()
          .length === 0 ||
        !Number.isFinite(
          balance,
        )
      ) {
        setMessage(
          'Nom et solde valide requis.',
        );

        return;
      }

      await addUserDocument(
        user.uid,
        'accounts',
        {
          kind:
            accountForm.kind,

          name:
            accountForm.name.trim(),

          balance,

          liquid:
            accountForm.liquid,
        },
      );

      setAccountForm(
        (current) => ({
          ...current,
          name: '',
          balance: '',
        }),
      );

      setMessage(
        'Compte ajouté au bilan.',
      );

      await load();
    };

  const updateBalance =
    async (
      account: AccountView,
    ): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const nextBalance =
        parseNumber(
          balanceDrafts[
            account.id
          ] ??
            '',
        );

      if (
        !Number.isFinite(
          nextBalance,
        )
      ) {
        setMessage(
          'Solde invalide.',
        );

        return;
      }

      await updateUserDocument(
        user.uid,
        'accounts',
        account.id,
        {
          balance:
            nextBalance,
        },
      );

      setMessage(
        `${account.name} actualisé.`,
      );

      await load();
    };

  const removeAccount =
    async (
      account: AccountView,
    ): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      if (
        !window.confirm(
          `Supprimer « ${account.name} » du bilan ?`,
        )
      ) {
        return;
      }

      await deleteUserDocument(
        user.uid,
        'accounts',
        account.id,
      );

      setMessage(
        'Compte supprimé.',
      );

      await load();
    };

  const addIncome =
    async (): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const amount =
        parseNumber(
          incomeForm.amount,
        );

      const receivedAt =
        new Date(
          `${incomeForm.receivedAt}T12:00:00`,
        );

      if (
        incomeForm.label
          .trim()
          .length === 0 ||
        !Number.isFinite(
          amount,
        ) ||
        amount < 0 ||
        incomeForm
          .receivedAt
          .length === 0 ||
        Number.isNaN(
          receivedAt.getTime(),
        )
      ) {
        setMessage(
          'Libellé, montant et date de revenu valides requis.',
        );

        return;
      }

      await addUserDocument(
        user.uid,
        'incomes',
        {
          kind:
            incomeForm.kind,

          label:
            incomeForm.label.trim(),

          amount,
          receivedAt,

          recurring:
            incomeForm.recurring,
        },
      );

      setIncomeForm(
        (current) => ({
          ...current,
          label: '',
          amount: '',
        }),
      );

      setMessage(
        'Revenu enregistré.',
      );

      await load();
    };

  const removeIncome =
    async (
      income: IncomeView,
    ): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      if (
        !window.confirm(
          `Supprimer le revenu « ${income.label} » ?`,
        )
      ) {
        return;
      }

      await deleteUserDocument(
        user.uid,
        'incomes',
        income.id,
      );

      setMessage(
        'Revenu supprimé.',
      );

      await load();
    };

  const addGoal =
    async (): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const targetAmount =
        parseNumber(
          goalForm.targetAmount,
        );

      const currentAmount =
        parseNumber(
          goalForm.currentAmount,
        );

      const priority =
        Number.parseInt(
          goalForm.priority,
          10,
        );

      const targetDate =
        goalForm.targetDate
          .length > 0
          ? new Date(
              `${goalForm.targetDate}T12:00:00`,
            )
          : null;

      if (
        goalForm.name
          .trim()
          .length === 0 ||
        !Number.isFinite(
          targetAmount,
        ) ||
        targetAmount <= 0 ||
        !Number.isFinite(
          currentAmount,
        ) ||
        currentAmount < 0 ||
        currentAmount >
          targetAmount ||
        !Number.isInteger(
          priority,
        ) ||
        priority < 0 ||
        priority > 10 ||
        (
          targetDate !==
            null &&
          Number.isNaN(
            targetDate.getTime(),
          )
        )
      ) {
        setMessage(
          'Objectif invalide : vérifiez les montants, la date et la priorité.',
        );

        return;
      }

      await addUserDocument(
        user.uid,
        'goals',
        {
          name:
            goalForm.name.trim(),

          targetAmount,
          currentAmount,
          priority,

          ...(targetDate !==
          null
            ? {
                targetDate,
              }
            : {}),
        },
      );

      setGoalForm({
        name: '',
        targetAmount: '',
        currentAmount: '0',
        targetDate: '',
        priority: '5',
      });

      setMessage(
        'Objectif financier créé.',
      );

      await load();
    };

  const removeGoal =
    async (
      goal: GoalView,
    ): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      if (
        !window.confirm(
          `Supprimer l’objectif « ${goal.name} » ?`,
        )
      ) {
        return;
      }

      await deleteUserDocument(
        user.uid,
        'goals',
        goal.id,
      );

      setMessage(
        'Objectif supprimé.',
      );

      await load();
    };

  return (
    <>
      <section className="page-heading wealth-heading">
        <div>
          <p className="eyebrow">
            GESTION
            PATRIMONIALE
          </p>

          <h1>
            Construire un
            bilan financier
            exploitable.
          </h1>

          <p>
            Les comptes
            constituent la
            source du
            patrimoine. Les
            revenus alimentent
            les flux. Les
            objectifs donnent
            une destination au
            capital.
          </p>
        </div>
      </section>

      {message !== null ? (
        <p
          className="finance-status"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <section className="wealth-summary">
        <div>
          <span>
            Actifs
          </span>

          <strong>
            <Money
              value={
                totals.assets
              }
            />
          </strong>
        </div>

        <div>
          <span>
            Dettes
          </span>

          <strong>
            <Money
              value={
                totals.debts
              }
            />
          </strong>
        </div>

        <div>
          <span>
            Liquidités
          </span>

          <strong>
            <Money
              value={
                totals.liquid
              }
            />
          </strong>
        </div>

        <div className="wealth-summary-net">
          <span>
            Patrimoine net
          </span>

          <strong>
            <Money
              value={
                totals.net
              }
            />
          </strong>
        </div>
      </section>

      <section className="wealth-management-grid">
        <article className="panel wealth-form-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                BILAN
              </p>

              <h2>
                Ajouter un
                compte ou un
                actif
              </h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Type

              <select
                value={
                  accountForm.kind
                }
                onChange={(
                  event,
                ) =>
                  setAccountForm({
                    ...accountForm,

                    kind:
                      event
                        .target
                        .value as AccountKind,
                  })
                }
              >
                {(
                  Object.keys(
                    accountLabels,
                  ) as AccountKind[]
                ).map(
                  (kind) => (
                    <option
                      value={
                        kind
                      }
                      key={
                        kind
                      }
                    >
                      {
                        accountLabels[
                          kind
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Nom

              <input
                maxLength={
                  120
                }
                placeholder="Ex. Compte courant principal"
                value={
                  accountForm.name
                }
                onChange={(
                  event,
                ) =>
                  setAccountForm({
                    ...accountForm,

                    name:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Solde / valeur €

              <input
                inputMode="decimal"
                placeholder="Les dettes peuvent être négatives"
                value={
                  accountForm.balance
                }
                onChange={(
                  event,
                ) =>
                  setAccountForm({
                    ...accountForm,

                    balance:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label className="wealth-checkbox">
              <input
                type="checkbox"
                checked={
                  accountForm.liquid
                }
                onChange={(
                  event,
                ) =>
                  setAccountForm({
                    ...accountForm,

                    liquid:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Mobilisable
              rapidement
            </label>
          </div>

          <button
            className="primary"
            onClick={() => {
              void addAccount().catch(
                () =>
                  setMessage(
                    'Ajout du compte impossible.',
                  ),
              );
            }}
          >
            Ajouter au bilan
          </button>
        </article>

        <article className="panel accounts-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                COMPTES
              </p>

              <h2>
                Valeurs de
                référence
              </h2>
            </div>

            <span className="muted">
              {accounts.length}
            </span>
          </div>

          {accounts.length ===
          0 ? (
            <p className="muted">
              Aucun compte
              déclaré.
            </p>
          ) : (
            <div className="managed-list">
              {accounts
                .slice()
                .sort(
                  (a, b) =>
                    Math.abs(
                      b.balance,
                    ) -
                    Math.abs(
                      a.balance,
                    ),
                )
                .map(
                  (
                    account,
                  ) => (
                    <div
                      className="managed-row"
                      key={
                        account.id
                      }
                    >
                      <div className="managed-identity">
                        <strong>
                          {
                            account.name
                          }
                        </strong>

                        <span>
                          {
                            accountLabels[
                              account
                                .kind
                            ]
                          }{' '}
                          ·{' '}
                          {account.liquid
                            ? 'liquide'
                            : 'long terme'}
                        </span>
                      </div>

                      <div className="managed-balance">
                        <input
                          aria-label={`Solde ${account.name}`}
                          inputMode="decimal"
                          value={
                            balanceDrafts[
                              account
                                .id
                            ] ??
                            ''
                          }
                          onChange={(
                            event,
                          ) =>
                            setBalanceDrafts(
                              {
                                ...balanceDrafts,

                                [account.id]:
                                  event
                                    .target
                                    .value,
                              },
                            )
                          }
                        />

                        <button
                          onClick={() => {
                            void updateBalance(
                              account,
                            ).catch(
                              () =>
                                setMessage(
                                  'Mise à jour impossible.',
                                ),
                            );
                          }}
                        >
                          Actualiser
                        </button>

                        <button
                          className="ghost-danger"
                          onClick={() => {
                            void removeAccount(
                              account,
                            ).catch(
                              () =>
                                setMessage(
                                  'Suppression impossible.',
                                ),
                            );
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ),
                )}
            </div>
          )}
        </article>
      </section>

      <section className="wealth-management-grid">
        <article className="panel wealth-form-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                FLUX ENTRANTS
              </p>

              <h2>
                Enregistrer
                un revenu
              </h2>
            </div>

            <Money
              value={
                currentMonthIncome
              }
            />
          </div>

          <div className="form-grid">
            <label>
              Nature

              <select
                value={
                  incomeForm.kind
                }
                onChange={(
                  event,
                ) =>
                  setIncomeForm({
                    ...incomeForm,

                    kind:
                      event
                        .target
                        .value as IncomeKind,
                  })
                }
              >
                {(
                  Object.keys(
                    incomeLabels,
                  ) as IncomeKind[]
                ).map(
                  (kind) => (
                    <option
                      value={
                        kind
                      }
                      key={
                        kind
                      }
                    >
                      {
                        incomeLabels[
                          kind
                        ]
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Libellé

              <input
                maxLength={
                  160
                }
                placeholder="Ex. Salaire août"
                value={
                  incomeForm.label
                }
                onChange={(
                  event,
                ) =>
                  setIncomeForm({
                    ...incomeForm,

                    label:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Montant €

              <input
                inputMode="decimal"
                value={
                  incomeForm.amount
                }
                onChange={(
                  event,
                ) =>
                  setIncomeForm({
                    ...incomeForm,

                    amount:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Date

              <input
                type="date"
                value={
                  incomeForm.receivedAt
                }
                onChange={(
                  event,
                ) =>
                  setIncomeForm({
                    ...incomeForm,

                    receivedAt:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>
          </div>

          <label className="wealth-checkbox">
            <input
              type="checkbox"
              checked={
                incomeForm.recurring
              }
              onChange={(
                event,
              ) =>
                setIncomeForm({
                  ...incomeForm,

                  recurring:
                    event
                      .target
                      .checked,
                })
              }
            />

            Revenu récurrent
          </label>

          <button
            className="primary"
            onClick={() => {
              void addIncome().catch(
                () =>
                  setMessage(
                    'Ajout du revenu impossible.',
                  ),
              );
            }}
          >
            Enregistrer le
            revenu
          </button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                JOURNAL
              </p>

              <h2>
                Derniers
                revenus
              </h2>
            </div>

            <span className="muted">
              {incomes.length}
            </span>
          </div>

          {incomes.length ===
          0 ? (
            <p className="muted">
              Aucun revenu
              enregistré.
            </p>
          ) : (
            <div className="income-ledger">
              {incomes
                .slice(0, 8)
                .map(
                  (
                    income,
                  ) => (
                    <div
                      className="income-row"
                      key={
                        income.id
                      }
                    >
                      <div>
                        <strong>
                          {
                            income.label
                          }
                        </strong>

                        <span>
                          {income
                            .receivedAt
                            ?.toLocaleDateString(
                              'fr-FR',
                            ) ??
                            '—'}{' '}
                          ·{' '}
                          {
                            incomeLabels[
                              income
                                .kind
                            ]
                          }
                          {income.recurring
                            ? ' · récurrent'
                            : ''}
                        </span>
                      </div>

                      <Money
                        value={
                          income.amount
                        }
                      />

                      <button
                        className="ghost-danger"
                        onClick={() => {
                          void removeIncome(
                            income,
                          ).catch(
                            () =>
                              setMessage(
                                'Suppression impossible.',
                              ),
                          );
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ),
                )}
            </div>
          )}
        </article>
      </section>

      <section className="wealth-management-grid">
        <article className="panel wealth-form-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                CAPITAL
                AFFECTÉ
              </p>

              <h2>
                Créer un
                objectif
              </h2>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Objectif

              <input
                maxLength={
                  160
                }
                placeholder="Ex. Réserve de sécurité"
                value={
                  goalForm.name
                }
                onChange={(
                  event,
                ) =>
                  setGoalForm({
                    ...goalForm,

                    name:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Cible €

              <input
                inputMode="decimal"
                value={
                  goalForm.targetAmount
                }
                onChange={(
                  event,
                ) =>
                  setGoalForm({
                    ...goalForm,

                    targetAmount:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Déjà affecté €

              <input
                inputMode="decimal"
                value={
                  goalForm.currentAmount
                }
                onChange={(
                  event,
                ) =>
                  setGoalForm({
                    ...goalForm,

                    currentAmount:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Échéance

              <input
                type="date"
                value={
                  goalForm.targetDate
                }
                onChange={(
                  event,
                ) =>
                  setGoalForm({
                    ...goalForm,

                    targetDate:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Priorité · 0 à 10

              <input
                inputMode="numeric"
                value={
                  goalForm.priority
                }
                onChange={(
                  event,
                ) =>
                  setGoalForm({
                    ...goalForm,

                    priority:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>
          </div>

          <button
            className="primary"
            onClick={() => {
              void addGoal().catch(
                () =>
                  setMessage(
                    'Création de l’objectif impossible.',
                  ),
              );
            }}
          >
            Créer l’objectif
          </button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">
                OBJECTIFS
              </p>

              <h2>
                Progression
                du capital
              </h2>
            </div>

            <span className="muted">
              {goals.length}
            </span>
          </div>

          {goals.length ===
          0 ? (
            <p className="muted">
              Aucun objectif
              défini.
            </p>
          ) : (
            <div className="goal-manager">
              {goals.map(
                (goal) => {
                  const progress =
                    goal.targetAmount >
                    0
                      ? Math.min(
                          goal.currentAmount /
                            goal.targetAmount,
                          1,
                        )
                      : 0;

                  return (
                    <div
                      className="goal-manager-row"
                      key={
                        goal.id
                      }
                    >
                      <div className="goal-manager-head">
                        <div>
                          <strong>
                            {
                              goal.name
                            }
                          </strong>

                          <span>
                            Priorité{' '}
                            {
                              goal.priority
                            }
                            /10
                            {goal.targetDate
                              ? ` · ${new Date(
                                  `${goal.targetDate}T12:00:00`,
                                ).toLocaleDateString(
                                  'fr-FR',
                                )}`
                              : ''}
                          </span>
                        </div>

                        <span>
                          <Money
                            value={
                              goal.currentAmount
                            }
                          />{' '}
                          /{' '}
                          <Money
                            value={
                              goal.targetAmount
                            }
                          />
                        </span>
                      </div>

                      <div className="goal-progress">
                        <span
                          style={{
                            width: `${progress * 100}%`,
                          }}
                        />
                      </div>

                      <button
                        className="ghost-danger goal-delete"
                        onClick={() => {
                          void removeGoal(
                            goal,
                          ).catch(
                            () =>
                              setMessage(
                                'Suppression impossible.',
                              ),
                          );
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </article>
      </section>

      <p className="fine-print finance-footnote">
        VERNYSS ne se
        connecte pas
        automatiquement à
        votre banque dans
        cette version : les
        soldes et valeurs
        restent déclaratifs.
        Cette séparation évite
        d’introduire un
        agrégateur bancaire ou
        des accès
        supplémentaires sans
        consentement explicite.
      </p>
    </>
  );
}