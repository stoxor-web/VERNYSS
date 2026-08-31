import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type DocumentData,
  type Query,
  type QueryConstraint,
  type QuerySnapshot,
} from 'firebase/firestore';

import { db } from '../firebase/config';

const PAGE_SIZE = 100;

export interface UserDocument {
  id: string;
  data: DocumentData;
}

export async function addUserDocument(
  uid: string,
  collectionName: string,
  data: DocumentData,
): Promise<string> {
  const collectionReference = collection(
    db,
    'users',
    uid,
    collectionName,
  );

  const created = await addDoc(collectionReference, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: 1,
  });

  return created.id;
}

export async function updateUserDocument(
  uid: string,
  collectionName: string,
  id: string,
  data: DocumentData,
): Promise<void> {
  const safeData: DocumentData = {
    ...data,
  };

  // Ces champs sont contrôlés par l'application
  // et ne doivent pas être modifiés via cette fonction.
  delete safeData.createdAt;
  delete safeData.schemaVersion;

  const documentReference = doc(
    db,
    'users',
    uid,
    collectionName,
    id,
  );

  await updateDoc(documentReference, {
    ...safeData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUserDocument(
  uid: string,
  collectionName: string,
  id: string,
): Promise<void> {
  const documentReference = doc(
    db,
    'users',
    uid,
    collectionName,
    id,
  );

  await deleteDoc(documentReference);
}

export async function listUserDocuments(
  uid: string,
  collectionName: string,
  maxDocuments = 500,
): Promise<UserDocument[]> {
  const output: UserDocument[] = [];

  let lastId: string | null = null;

  while (output.length < maxDocuments) {
    const remaining = Math.min(
      PAGE_SIZE,
      maxDocuments - output.length,
    );

    const constraints: QueryConstraint[] = [
      orderBy(documentId()),
    ];

    if (lastId !== null) {
      constraints.push(startAfter(lastId));
    }

    constraints.push(limit(remaining));

    const collectionReference = collection(
      db,
      'users',
      uid,
      collectionName,
    );

    const pageQuery: Query<DocumentData> = query(
      collectionReference,
      ...constraints,
    );

    const page: QuerySnapshot<DocumentData> =
      await getDocs(pageQuery);

    for (const item of page.docs) {
      output.push({
        id: item.id,
        data: item.data(),
      });
    }

    if (page.size < remaining) {
      break;
    }

    const lastDocument =
      page.docs[page.docs.length - 1];

    if (lastDocument === undefined) {
      break;
    }

    lastId = lastDocument.id;
  }

  return output;
}