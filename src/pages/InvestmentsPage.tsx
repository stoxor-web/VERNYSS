import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useAuth } from '../auth/AuthContext';
import { Money } from '../components/Money';

import {
  addUserDocument,
  listUserDocuments,
} from '../database/userRepository';

interface PositionView {
  id: string;
  envelope: string;
  name: string;
  ticker: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
  realizedGain: number;
  dividends: number;
  fees: number;
}

interface InvestmentForm {
  envelope: string;
  name: string;
  ticker: string;
  quantity: string;
  averageCost: string;
  currentValue: string;
  realizedGain: string;
  dividends: string;
  fees: string;
}

const initialForm:
  InvestmentForm = {
    envelope: 'PEA',
    name: '',
    ticker: '',
    quantity: '',
    averageCost: '',
    currentValue: '',
    realizedGain: '0',
    dividends: '0',
    fees: '0',
  };

const numericFields = [
  'quantity',
  'averageCost',
  'currentValue',
  'realizedGain',
  'dividends',
  'fees',
] as const;

const numericLabels:
  Record<
    (typeof numericFields)[number],
    string
  > = {
    quantity: 'Quantité',
    averageCost: 'PRU €',
    currentValue:
      'Valeur actuelle €',
    realizedGain:
      'Plus-value réalisée €',
    dividends: 'Dividendes €',
    fees: 'Frais €',
  };

function parseNumber(
  value: string,
): number {
  return Number(
    value.replace(',', '.'),
  );
}

export default function InvestmentsPage() {
  const { user } =
    useAuth();

  const [
    positions,
    setPositions,
  ] =
    useState<
      PositionView[]
    >([]);

  const [
    form,
    setForm,
  ] =
    useState<InvestmentForm>(
      initialForm,
    );

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
            'investments',
            200,
          );

        setPositions(
          docs.map(
            ({
              id,
              data,
            }) => ({
              id,

              envelope:
                String(
                  data[
                    'envelope'
                  ] ??
                    '',
                ),

              name:
                String(
                  data[
                    'name'
                  ] ??
                    '',
                ),

              ticker:
                String(
                  data[
                    'ticker'
                  ] ??
                    '',
                ),

              quantity:
                Number(
                  data[
                    'quantity'
                  ] ??
                    0,
                ),

              averageCost:
                Number(
                  data[
                    'averageCost'
                  ] ??
                    0,
                ),

              currentValue:
                Number(
                  data[
                    'currentValue'
                  ] ??
                    0,
                ),

              realizedGain:
                Number(
                  data[
                    'realizedGain'
                  ] ??
                    0,
                ),

              dividends:
                Number(
                  data[
                    'dividends'
                  ] ??
                    0,
                ),

              fees:
                Number(
                  data[
                    'fees'
                  ] ??
                    0,
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
          'Chargement impossible.',
        );
      },
    );
  }, [load]);

  const submit =
    async (): Promise<void> => {
      if (
        user === null
      ) {
        return;
      }

      const values = {
        quantity:
          parseNumber(
            form.quantity,
          ),

        averageCost:
          parseNumber(
            form.averageCost,
          ),

        currentValue:
          parseNumber(
            form.currentValue,
          ),

        realizedGain:
          parseNumber(
            form.realizedGain,
          ),

        dividends:
          parseNumber(
            form.dividends,
          ),

        fees:
          parseNumber(
            form.fees,
          ),
      };

      const invalidNumber =
        Object.values(
          values,
        ).some(
          (value) =>
            !Number.isFinite(
              value,
            ),
        );

      if (
        form.name
          .trim()
          .length === 0 ||
        invalidNumber ||
        values.quantity < 0 ||
        values.averageCost <
          0 ||
        values.currentValue <
          0 ||
        values.dividends <
          0 ||
        values.fees < 0
      ) {
        setMessage(
          'Position invalide.',
        );

        return;
      }

      await addUserDocument(
        user.uid,
        'investments',
        {
          envelope:
            form.envelope,

          name:
            form.name.trim(),

          ticker:
            form.ticker.trim(),

          ...values,
        },
      );

      setMessage(
        'Position enregistrée.',
      );

      setForm({
        ...initialForm,
        envelope:
          form.envelope,
      });

      await load();
    };

  const marketValue =
    positions.reduce(
      (sum, item) =>
        sum +
        item.currentValue,
      0,
    );

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            INVESTISSEMENTS
          </p>

          <h1>
            PEA & CTO :
            versements ≠
            performance.
          </h1>

          <p>
            La fiscalité porte
            sur les événements
            réalisés selon les
            règles applicables ;
            les plus-values
            latentes restent
            distinctes.
          </p>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>
              Ajouter une
              position
            </h2>
          </div>

          <div className="form-grid">
            <label>
              Enveloppe

              <select
                value={
                  form.envelope
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    envelope:
                      event
                        .target
                        .value,
                  })
                }
              >
                <option>
                  PEA
                </option>

                <option>
                  CTO
                </option>
              </select>
            </label>

            <label>
              Nom

              <input
                maxLength={
                  160
                }
                value={
                  form.name
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,
                    name:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Ticker

              <input
                maxLength={
                  32
                }
                value={
                  form.ticker
                }
                onChange={(
                  event,
                ) =>
                  setForm({
                    ...form,

                    ticker:
                      event
                        .target
                        .value,
                  })
                }
              />
            </label>

            {numericFields.map(
              (key) => (
                <label
                  key={key}
                >
                  {
                    numericLabels[
                      key
                    ]
                  }

                  <input
                    inputMode="decimal"
                    value={
                      form[
                        key
                      ]
                    }
                    onChange={(
                      event,
                    ) =>
                      setForm({
                        ...form,

                        [key]:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                </label>
              ),
            )}
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
              Positions
            </h2>

            <Money
              value={
                marketValue
              }
            />
          </div>

          {positions.length ===
          0 ? (
            <p className="muted">
              Aucune position
              enregistrée.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      Enveloppe
                    </th>

                    <th>
                      Titre
                    </th>

                    <th>
                      Quantité
                    </th>

                    <th>
                      Valeur
                    </th>

                    <th>
                      Latent
                      indicatif
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {positions.map(
                    (
                      position,
                    ) => {
                      const cost =
                        position.quantity *
                        position.averageCost;

                      const latent =
                        position.currentValue -
                        cost;

                      return (
                        <tr
                          key={
                            position.id
                          }
                        >
                          <td>
                            {
                              position.envelope
                            }
                          </td>

                          <td>
                            {
                              position.name
                            }

                            {position.ticker
                              ? ` · ${position.ticker}`
                              : ''}
                          </td>

                          <td>
                            {
                              position.quantity
                            }
                          </td>

                          <td>
                            <Money
                              value={
                                position.currentValue
                              }
                            />
                          </td>

                          <td>
                            <Money
                              value={
                                latent
                              }
                              signed
                            />
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="notice">
        Allocation cible : à
        construire en tenant
        compte de la liquidité,
        de l’horizon, d’un
        projet immobilier, de
        la réserve de sécurité,
        de la dette et du
        risque — pas
        uniquement d’un
        rendement attendu.
      </section>
    </>
  );
}