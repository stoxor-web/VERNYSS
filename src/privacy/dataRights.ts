import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type QuerySnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/config';

export const USER_DATA_COLLECTIONS = [
  'incomes',
  'salaryProfiles',
  'salaryMonths',
  'payrollChecks',
  'expenses',
  'budgets',
  'accounts',
  'investments',
  'automaticInvestments',
  'monthlySnapshots',
  'goals',
  'fiscalEvents',
  'taxLossCarryForwards',
  'properties',
  'realEstateProjects',
  'mortgages',
  'rentalOperations',
  'recommendations',
  'settings',
  'privacySettings',
] as const;

export type UserDataCollection =
  (typeof USER_DATA_COLLECTIONS)[number];

interface ExportedDocument {
  id: string;
  data: unknown;
}

/**
 * Transforme les valeurs Firestore en valeurs JSON sérialisables.
 *
 * Les Timestamp Firestore sont notamment convertis en dates ISO.
 */
function serialize(value: unknown): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serialize(item));
  }

  if (typeof value === 'object') {
    const possibleTimestamp = value as {
      toDate?: () => Date;
    };

    if (
      typeof possibleTimestamp.toDate === 'function'
    ) {
      return possibleTimestamp
        .toDate()
        .toISOString();
    }

    return Object.fromEntries(
      Object.entries(value).map(
        ([key, childValue]) => [
          key,
          serialize(childValue),
        ],
      ),
    );
  }

  return String(value);
}

/**
 * Exporte une sous-collection appartenant à l'utilisateur.
 *
 * La pagination évite de charger une quantité non bornée
 * de documents dans une seule requête.
 */
async function exportCollection(
  uid: string,
  name: UserDataCollection,
): Promise<ExportedDocument[]> {
  const output: ExportedDocument[] = [];

  let cursor: string | null = null;

  for (;;) {
    const constraints: QueryConstraint[] = [
      orderBy(documentId()),
    ];

    if (cursor !== null) {
      constraints.push(startAfter(cursor));
    }

    constraints.push(limit(250));

    const snapshot: QuerySnapshot<DocumentData> =
      await getDocs(
        query(
          collection(
            db,
            'users',
            uid,
            name,
          ),
          ...constraints,
        ),
      );

    for (const item of snapshot.docs) {
      output.push({
        id: item.id,
        data: serialize(item.data()),
      });
    }

    if (snapshot.size < 250) {
      break;
    }

    const lastDocument =
      snapshot.docs[snapshot.docs.length - 1];

    if (lastDocument === undefined) {
      break;
    }

    cursor = lastDocument.id;
  }

  return output;
}

/**
 * Construit un export RGPD JSON des données accessibles
 * à l'utilisateur courant.
 *
 * Aucun fichier n'est envoyé vers un serveur tiers.
 */
export async function buildUserExport(
  uid: string,
): Promise<Record<string, unknown>> {
  const rootDocument = await getDoc(
    doc(db, 'users', uid),
  );

  const exportedCollections =
    await Promise.all(
      USER_DATA_COLLECTIONS.map(
        async (name) =>
          [
            name,
            await exportCollection(uid, name),
          ] as const,
      ),
    );

  return {
    exportVersion: 1,
    generatedAt: new Date().toISOString(),
    userId: uid,

    profile: rootDocument.exists()
      ? serialize(rootDocument.data())
      : null,

    data: Object.fromEntries(
      exportedCollections,
    ),

    note:
      'Cet export contient uniquement les données accessibles au compte courant via les règles Firestore.',
  };
}

/**
 * Génère localement le fichier JSON de l'export.
 *
 * L'URL Blob est temporaire et révoquée immédiatement
 * après le déclenchement du téléchargement.
 */
export function downloadJsonExport(
  data: Record<string, unknown>,
): void {
  const content = JSON.stringify(
    data,
    null,
    2,
  );

  const blob = new Blob(
    [content],
    {
      type: 'application/json;charset=utf-8',
    },
  );

  const url =
    URL.createObjectURL(blob);

  try {
    const anchor =
      document.createElement('a');

    anchor.href = url;

    anchor.download =
      `vernyss-export-${
        new Date()
          .toISOString()
          .slice(0, 10)
      }.json`;

    anchor.rel = 'noopener';

    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Supprime tous les documents d'une sous-collection
 * utilisateur en lots bornés.
 *
 * Firestore limite les batchs à 500 opérations :
 * on reste volontairement sous cette limite.
 */
export async function deleteUserCollection(
  uid: string,
  name: UserDataCollection,
): Promise<number> {
  let deleted = 0;

  for (;;) {
    const snapshot: QuerySnapshot<DocumentData> =
      await getDocs(
        query(
          collection(
            db,
            'users',
            uid,
            name,
          ),
          limit(400),
        ),
      );

    if (snapshot.empty) {
      break;
    }

    const batch =
      writeBatch(db);

    for (const item of snapshot.docs) {
      batch.delete(item.ref);
    }

    await batch.commit();

    deleted += snapshot.size;
  }

  return deleted;
}

/**
 * Supprime les données financières connues de l'utilisateur.
 *
 * Important :
 * authorizedUsers/{uid} n'est volontairement PAS supprimé ici.
 * Cette collection d'autorisation est administrée séparément
 * et le client ne doit jamais pouvoir modifier ses propres droits.
 */
export async function deleteAllUserFinancialData(
  uid: string,
): Promise<number> {
  let totalDeleted = 0;

  for (
    const name of USER_DATA_COLLECTIONS
  ) {
    totalDeleted +=
      await deleteUserCollection(
        uid,
        name,
      );
  }

  await deleteDoc(
    doc(db, 'users', uid),
  );

  return totalDeleted;
}

/**
 * Supprime les dépenses antérieures à une date ISO YYYY-MM-DD.
 *
 * La sélection est effectuée directement côté Firestore afin
 * d'éviter de télécharger tout l'historique dans le navigateur.
 */
export async function purgeHistoricalExpensesBefore(
  uid: string,
  beforeIsoDate: string,
): Promise<number> {
  const isoDatePattern =
    /^\d{4}-\d{2}-\d{2}$/;

  if (
    !isoDatePattern.test(beforeIsoDate)
  ) {
    throw new RangeError(
      'Date de purge invalide.',
    );
  }

  const cutoffDate = new Date(
    `${beforeIsoDate}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(
      cutoffDate.getTime(),
    )
  ) {
    throw new RangeError(
      'Date de purge invalide.',
    );
  }

  const cutoffTimestamp =
    Timestamp.fromDate(cutoffDate);

  let deleted = 0;

  for (;;) {
    const snapshot: QuerySnapshot<DocumentData> =
      await getDocs(
        query(
          collection(
            db,
            'users',
            uid,
            'expenses',
          ),
          where(
            'occurredAt',
            '<',
            cutoffTimestamp,
          ),
          orderBy('occurredAt'),
          limit(400),
        ),
      );

    if (snapshot.empty) {
      break;
    }

    const batch =
      writeBatch(db);

    for (const item of snapshot.docs) {
      batch.delete(item.ref);
    }

    await batch.commit();

    deleted += snapshot.size;
  }

  return deleted;
}

/**
 * Supprime uniquement l'adresse facultative d'un bien immobilier.
 */
export async function removeOptionalAddress(
  uid: string,
  propertyId: string,
): Promise<void> {
  if (
    propertyId.trim().length === 0
  ) {
    throw new RangeError(
      'Identifiant du bien invalide.',
    );
  }

  await updateDoc(
    doc(
      db,
      'users',
      uid,
      'properties',
      propertyId,
    ),
    {
      address: deleteField(),
      updatedAt: serverTimestamp(),
    },
  );
}

/**
 * Génère un CSV local à partir de documents Firestore.
 */
export function exportCsv(
  rows: readonly DocumentData[],
): string {
  if (rows.length === 0) {
    return '';
  }

  const keys = [
    ...new Set(
      rows.flatMap(
        (row) => Object.keys(row),
      ),
    ),
  ].sort();

  const escapeCsvValue = (
    value: unknown,
  ): string => {
    const serialized =
      serialize(value);

    const text =
      typeof serialized === 'string'
        ? serialized
        : JSON.stringify(
            serialized ?? '',
          );

    return `"${text.replaceAll(
      '"',
      '""',
    )}"`;
  };

  const header = keys
    .map((key) =>
      escapeCsvValue(key),
    )
    .join(',');

  const body = rows.map(
    (row) =>
      keys
        .map((key) =>
          escapeCsvValue(
            row[key],
          ),
        )
        .join(','),
  );

  return [
    header,
    ...body,
  ].join('\n');
}