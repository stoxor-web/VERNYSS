import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  detectRecurring,
  type TransactionLike,
} from '../budget/recurring';

import { useAuth } from '../auth/AuthContext';

import { Money } from '../components/Money';

import {
  addUserDocument,
  listUserDocuments,
} from '../database/userRepository';

interface ExpenseView {
  id: string;
  label: string;
  amount: number;
  category: string;
  occurredAt: Date | null;
}

function dateFromFirestore(
  value: unknown,
): Date | null {
  const candidate =
    value as {
      toDate?: () => Date;
    } | undefined;

  return (
    candidate?.toDate?.() ??
    (value instanceof Date
      ? value
      : null)
  );
}

export default function BudgetPage() {
  const { user } =
    useAuth();

  const [
    items,
    setItems,
  ] =
    useState<ExpenseView[]>(
      [],
    );

  const [
    form,
    setForm,
  ] = useState({
    label: '',
    amount: '',
    category:
      'Essentiel',

    date:
      new Date()
        .toISOString()
        .slice(0, 10),

    essential: true,
    fixed: false,
  });

  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(null);

  const load =
    useCallback(
      async (): Promise<void> => {
        if (
          user === null
        ) {
          return;
        }

        const docs =
          await listUserDocuments(
            user.uid,
            'expenses',
            200,
          );

        setItems(
          docs.map(
            ({
              id,
              data,
            }) => ({
              id,

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

              category:
                String(
                  data[
                    'category'
                  ] ??
                    '',
                ),

              occurredAt:
                dateFromFirestore(
                  data[
                    'occurredAt'
                  ],
                ),
            }),
          ),
        );
      },
      [user],
    );

  useEffect(() => {
    void load().catch(
      () => {
        setMessage(
          'Impossible de charger les dépenses.',
        );
      },
    );
  }, [load]);

  const recurring =
    useMemo(() => {
      const tx:
        TransactionLike[] =
        items
          .filter(
            (item) =>
              item.occurredAt !==
              null,
          )
          .map(
            (item) => ({
              id: item.id,
              label:
                item.label,
              amount:
                item.amount,

              date:
                item.occurredAt
                  ?.toISOString()
                  .slice(
                    0,
                    10,
                  ) ??
                '',
            }),
          );

      return detectRecurring(
        tx,
      );
    }, [items]);

  const submit =
    async (): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const amount =
        Number(
          form.amount.replace(
            ',',
            '.',
          ),
        );

      const occurredAt =
        new Date(
          `${form.date}T12:00:00`,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount < 0 ||
        form.label
          .trim()
          .length === 0 ||
        Number.isNaN(
          occurredAt.getTime(),
        )
      ) {
        setMessage(
          'Libellé, montant et date valides requis.',
        );

        return;
      }

      await addUserDocument(
        user.uid,
        'expenses',
        {
          label:
            form.label.trim(),

          amount,

          category:
            form.category,

          occurredAt,

          essential:
            form.essential,

          fixed:
            form.fixed,
        },
      );

      setForm(
        (current) => ({
          ...current,
          label: '',
          amount: '',
        }),
      );

      setMessage(
        'Dépense enregistrée.',
      );

      await load();
    };

  const total =
    items.reduce(
      (sum, item) =>
        sum + item.amount,
      0,
    );

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            BUDGET
          </p>

          <h1>
            Dépenses, budgets
            et récurrences.
          </h1>

          <p>
            Les écritures restent
            séparées par UID et les
            requêtes sont bornées.
          </p>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>
              Ajouter une dépense
            </h2>

            <span className="muted">
              Validation frontend
              + Rules
            </span>
          </div>

          <div className="form-grid">
            <label>
              Libellé

              <input
                value={
                  form.label
                }
                maxLength={
                  180
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
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
                  form.amount
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    amount:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Catégorie

              <input
                value={
                  form.category
                }
                maxLength={
                  80
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    category:
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
                  form.date
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    date:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>
          </div>

          <div className="check-row">
            <label>
              <input
                type="checkbox"
                checked={
                  form.essential
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    essential:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Essentiel
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.fixed
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    fixed:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Fixe
            </label>
          </div>

          <button
            className="primary"
            onClick={() => {
              void submit().catch(
                () =>
                  setMessage(
                    'Enregistrement refusé ou indisponible.',
                  ),
              );
            }}
          >
            Enregistrer
          </button>

          {message !== null ? (
            <p role="status">
              {message}
            </p>
          ) : null}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>
              Historique chargé
            </h2>

            <Money
              value={total}
            />
          </div>

          {items.length === 0 ? (
            <p className="muted">
              Aucune dépense.
              Aucun zéro
              artificiel n’est
              tracé.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Date
                    </th>
                    <th>
                      Libellé
                    </th>
                    <th>
                      Catégorie
                    </th>
                    <th>
                      Montant
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items
                    .slice(
                      0,
                      30,
                    )
                    .map(
                      (
                        item,
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                        >
                          <td>
                            {item
                              .occurredAt
                              ?.toLocaleDateString(
                                'fr-FR',
                              ) ??
                              '—'}
                          </td>

                          <td>
                            {
                              item.label
                            }
                          </td>

                          <td>
                            {
                              item.category
                            }
                          </td>

                          <td>
                            <Money
                              value={
                                item.amount
                              }
                            />
                          </td>
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>
            Dépenses récurrentes
            détectées
          </h2>

          <span className="muted">
            Heuristique
            explicable
          </span>
        </div>

        {recurring.length ===
        0 ? (
          <p className="muted">
            Pas assez
            d’occurrences
            comparables.
          </p>
        ) : (
          recurring
            .slice(0, 10)
            .map(
              (signal) => (
                <div
                  className="ledger-row"
                  key={
                    signal
                      .normalizedLabel
                  }
                >
                  <span>
                    {
                      signal.normalizedLabel
                    }{' '}
                    ·{' '}
                    {
                      signal.occurrences
                    }{' '}
                    occurrences{' '}
                    {Math.abs(
                      signal
                        .amountChangeRatio,
                    ) >
                    0.15
                      ? '· variation à vérifier'
                      : ''}
                  </span>

                  <Money
                    value={
                      signal
                        .latestAmount
                    }
                  />
                </div>
              ),
            )
        )}
      </section>
    </>
  );
}