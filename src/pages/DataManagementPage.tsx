import {
  useEffect,
  useState,
} from 'react';

import {
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from 'firebase/auth';

import { useAuth } from '../auth/AuthContext';
import { usePrivacy } from '../privacy/PrivacyContext';

import {
  buildUserExport,
  deleteAllUserFinancialData,
  deleteUserCollection,
  downloadJsonExport,
  purgeHistoricalExpensesBefore,
  type UserDataCollection,
} from '../privacy/dataRights';

import {
  DEFAULT_PRIVACY_SETTINGS,
  loadPrivacySettings,
  savePrivacySettings,
  type PrivacySettings,
} from '../privacy/settings';

const provider =
  new GoogleAuthProvider();

type PartialDeletionCollection =
  Extract<
    UserDataCollection,
    | 'salaryMonths'
    | 'payrollChecks'
    | 'properties'
    | 'realEstateProjects'
    | 'mortgages'
    | 'rentalOperations'
    | 'fiscalEvents'
    | 'taxLossCarryForwards'
  >;

export default function DataManagementPage() {
  const { user } =
    useAuth();

  const {
    setHideAmounts,
  } = usePrivacy();

  const [
    settings,
    setSettings,
  ] =
    useState<PrivacySettings>(
      DEFAULT_PRIVACY_SETTINGS,
    );

  const [
    phrase,
    setPhrase,
  ] = useState('');

  const [
    confirmed,
    setConfirmed,
  ] = useState(false);

  const [
    deleteAuth,
    setDeleteAuth,
  ] = useState(false);

  const [
    oldExpenseDate,
    setOldExpenseDate,
  ] = useState('');

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    busy,
    setBusy,
  ] = useState(false);

  useEffect(() => {
    if (user === null) {
      return;
    }

    let cancelled = false;

    const load =
      async (): Promise<void> => {
        try {
          const value =
            await loadPrivacySettings(
              user.uid,
            );

          if (cancelled) {
            return;
          }

          setSettings(value);

          setHideAmounts(
            value.hideAmountsByDefault,
          );
        } catch {
          if (!cancelled) {
            setMessage(
              'Préférences non chargées.',
            );
          }
        }
      };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    setHideAmounts,
    user,
  ]);

  const updateSettings =
    async (): Promise<void> => {
      if (user === null) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        await savePrivacySettings(
          user.uid,
          settings,
        );

        setHideAmounts(
          settings
            .hideAmountsByDefault,
        );

        setMessage(
          'Préférences enregistrées.',
        );
      } catch {
        setMessage(
          'Enregistrement impossible.',
        );
      } finally {
        setBusy(false);
      }
    };

  const exportData =
    async (): Promise<void> => {
      if (user === null) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        const data =
          await buildUserExport(
            user.uid,
          );

        downloadJsonExport(data);

        setMessage(
          'Export JSON généré localement.',
        );
      } catch {
        setMessage(
          'Export impossible.',
        );
      } finally {
        setBusy(false);
      }
    };

  const partial =
    async (
      collections:
        PartialDeletionCollection[],
      label: string,
    ): Promise<void> => {
      if (user === null) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        let total = 0;

        for (
          const name of
          collections
        ) {
          total +=
            await deleteUserCollection(
              user.uid,
              name,
            );
        }

        setMessage(
          `${label} : ${total} document(s) supprimé(s).`,
        );
      } catch {
        setMessage(
          'Suppression partielle impossible.',
        );
      } finally {
        setBusy(false);
      }
    };

  const purgeOldExpenses =
    async (): Promise<void> => {
      if (
        user === null ||
        oldExpenseDate === ''
      ) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        const count:
          number =
          await purgeHistoricalExpensesBefore(
            user.uid,
            oldExpenseDate,
          );

        setMessage(
          `${count} dépense(s) supprimée(s).`,
        );
      } catch {
        setMessage(
          'Purge impossible.',
        );
      } finally {
        setBusy(false);
      }
    };

  const deleteEverything =
    async (): Promise<void> => {
      if (
        user === null ||
        phrase !==
          'SUPPRIMER' ||
        !confirmed
      ) {
        return;
      }

      setBusy(true);
      setMessage(null);

      try {
        await reauthenticateWithPopup(
          user,
          provider,
        );

        const count =
          await deleteAllUserFinancialData(
            user.uid,
          );

        if (deleteAuth) {
          await deleteUser(user);
        }

        setMessage(
          `${count} document(s) financiers supprimé(s). ${
            deleteAuth
              ? 'Compte Auth supprimé.'
              : 'Compte Auth conservé.'
          } L’entrée d’allowlist doit être supprimée par un administrateur pour un effacement administratif complet.`,
        );
      } catch (error: unknown) {
        const detail =
          error instanceof Error
            ? error.message
            : null;

        setMessage(
          detail === null
            ? 'Suppression incomplète.'
            : `Suppression incomplète : ${detail}`,
        );
      } finally {
        setBusy(false);
      }
    };

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            CONFIDENTIALITÉ
            & DONNÉES
          </p>

          <h1>
            Mes données
          </h1>

          <p>
            Exporter,
            réduire la
            conservation ou
            supprimer. Les
            opérations
            destructives
            demandent une
            confirmation
            renforcée.
          </p>
        </div>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-heading">
            <h2>
              Préférences de
              confidentialité
            </h2>
          </div>

          <div className="settings-list">
            <label>
              <input
                type="checkbox"
                checked={
                  settings
                    .hideAmountsByDefault
                }
                onChange={(
                  event,
                ) =>
                  setSettings({
                    ...settings,

                    hideAmountsByDefault:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Masquer les
              montants par
              défaut
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  settings
                    .allowExternalAi
                }
                onChange={(
                  event,
                ) =>
                  setSettings({
                    ...settings,

                    allowExternalAi:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Autoriser
              l’analyse IA
              externe

              <strong>
                {settings
                  .allowExternalAi
                  ? 'OUI — fournisseur à configurer'
                  : 'NON'}
              </strong>
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  settings
                    .optionalAnalytics
                }
                onChange={(
                  event,
                ) =>
                  setSettings({
                    ...settings,

                    optionalAnalytics:
                      event
                        .target
                        .checked,
                  })
                }
              />

              Analytics
              facultatif

              <strong>
                {settings
                  .optionalAnalytics
                  ? 'OUI'
                  : 'NON'}
              </strong>
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  settings
                    .personalizedNews
                }
                onChange={(
                  event,
                ) =>
                  setSettings({
                    ...settings,

                    personalizedNews:
                      event
                        .target
                        .checked,
                  })
                }
              />

              News
              personnalisées
            </label>

            <label>
              Conservation
              historique
              (mois, vide =
              durée du compte)

              <input
                inputMode="numeric"
                value={
                  settings
                    .historyRetentionMonths ??
                  ''
                }
                onChange={(
                  event,
                ) => {
                  const raw =
                    event
                      .target
                      .value;

                  if (
                    raw === ''
                  ) {
                    setSettings({
                      ...settings,

                      historyRetentionMonths:
                        null,
                    });

                    return;
                  }

                  const parsed =
                    Number(raw);

                  if (
                    !Number.isFinite(
                      parsed,
                    )
                  ) {
                    return;
                  }

                  setSettings({
                    ...settings,

                    historyRetentionMonths:
                      Math.min(
                        240,
                        Math.max(
                          1,
                          parsed,
                        ),
                      ),
                  });
                }}
              />
            </label>
          </div>

          <button
            disabled={busy}
            onClick={() => {
              void updateSettings();
            }}
          >
            Enregistrer les
            préférences
          </button>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h2>
              Portabilité
            </h2>
          </div>

          <p>
            L’export JSON est
            assemblé par
            pagination depuis
            votre propre espace
            Firestore, puis
            téléchargé via une
            URL Blob temporaire
            dans le navigateur.
          </p>

          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              void exportData();
            }}
          >
            Exporter mes
            données
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>
            Suppression
            partielle
          </h2>

          <span className="muted">
            Irréversible
          </span>
        </div>

        <div className="button-row wrap">
          <button
            disabled={busy}
            onClick={() => {
              void partial(
                [
                  'salaryMonths',
                  'payrollChecks',
                ],
                'Historique salaire',
              );
            }}
          >
            Supprimer
            historique salaire
          </button>

          <button
            disabled={busy}
            onClick={() => {
              void partial(
                [
                  'properties',
                  'realEstateProjects',
                  'mortgages',
                  'rentalOperations',
                ],
                'Immobilier',
              );
            }}
          >
            Supprimer
            immobilier
          </button>

          <button
            disabled={busy}
            onClick={() => {
              void partial(
                [
                  'fiscalEvents',
                  'taxLossCarryForwards',
                ],
                'Fiscalité',
              );
            }}
          >
            Supprimer
            fiscalité
          </button>
        </div>

        <div className="inline-form">
          <label>
            Dépenses
            antérieures au

            <input
              type="date"
              value={
                oldExpenseDate
              }
              onChange={(
                event,
              ) =>
                setOldExpenseDate(
                  event
                    .target
                    .value,
                )
              }
            />
          </label>

          <button
            disabled={
              busy ||
              oldExpenseDate ===
                ''
            }
            onClick={() => {
              void purgeOldExpenses();
            }}
          >
            Supprimer les
            dépenses anciennes
          </button>
        </div>

        <p className="fine-print">
          Ne supprimez pas
          automatiquement des
          pièces ou historiques
          fiscaux potentiellement
          nécessaires sans
          vérifier vos obligations
          de conservation.
        </p>
      </section>

      <section className="panel danger-zone">
        <div className="panel-heading">
          <h2>
            Supprimer toutes
            mes données
          </h2>

          <span className="status-pill danger">
            ZONE
            IRRÉVERSIBLE
          </span>
        </div>

        <p>
          Tapez{' '}
          <strong>
            SUPPRIMER
          </strong>
          , cochez la
          confirmation, puis
          réauthentifiez-vous.
          Les sous-collections
          financières et le
          profil utilisateur
          sont effacés.
        </p>

        <label>
          Confirmation

          <input
            value={phrase}
            onChange={(
              event,
            ) =>
              setPhrase(
                event
                  .target
                  .value,
              )
            }
            autoComplete="off"
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              confirmed
            }
            onChange={(
              event,
            ) =>
              setConfirmed(
                event
                  .target
                  .checked,
              )
            }
          />

          Je comprends que
          cette opération est
          irréversible.
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              deleteAuth
            }
            onChange={(
              event,
            ) =>
              setDeleteAuth(
                event
                  .target
                  .checked,
              )
            }
          />

          Supprimer aussi mon
          compte Firebase
          Authentication.
        </label>

        <button
          className="danger-button"
          disabled={
            busy ||
            phrase !==
              'SUPPRIMER' ||
            !confirmed
          }
          onClick={() => {
            void deleteEverything();
          }}
        >
          Supprimer toutes mes
          données
        </button>

        <p className="fine-print">
          L’allowlist
          d’autorisation n’est
          volontairement pas
          modifiable depuis le
          client. Pour un
          effacement complet,
          l’administrateur doit
          aussi supprimer
          l’entrée{' '}
          <code>
            authorizedUsers/uid
          </code>
          . Ne rendez pas cette
          collection
          auto-modifiable pour
          simplifier ce workflow.
        </p>
      </section>

      {message !== null ? (
        <p
          className="notice"
          role="status"
        >
          {message}
        </p>
      ) : null}
    </>
  );
}