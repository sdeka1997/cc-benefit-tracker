import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, serverTimestamp, writeBatch } from '../firebase';
import { db } from '../firebase';
import type { PendingTransaction } from '../types/index';

export function usePendingTransactions(uid: string | undefined) {
  const [pending, setPending] = useState<PendingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const existingTellerIds = useRef(new Set<string>());

  useEffect(() => {
    if (!uid) {
      setPending([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', uid, 'pendingTransactions'));
    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs.map(d => ({ ...d.data(), id: d.id } as PendingTransaction));
        docs.sort((a, b) => b.date.localeCompare(a.date));
        existingTellerIds.current = new Set(docs.map(d => d.tellerTxId));
        setPending(docs);
        setLoading(false);
      },
      err => {
        console.error('Pending transactions error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid]);

  async function addPending(tx: Omit<PendingTransaction, 'id'>) {
    if (!uid) return;
    // Skip if already in the pending queue
    if (existingTellerIds.current.has(tx.tellerTxId)) return;
    await addDoc(collection(db, 'users', uid, 'pendingTransactions'), {
      ...tx,
      addedAt: serverTimestamp(),
    });
  }

  async function addPendingBatch(txs: Omit<PendingTransaction, 'id'>[]) {
    if (!uid) return;
    const batch = writeBatch(db);
    for (const tx of txs) {
      if (existingTellerIds.current.has(tx.tellerTxId)) continue;
      const ref = doc(collection(db, 'users', uid, 'pendingTransactions'));
      batch.set(ref, { ...tx, addedAt: serverTimestamp() });
    }
    await batch.commit();
  }

  async function dismissPending(id: string) {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'pendingTransactions', id));
  }

  async function clearAllPending() {
    if (!uid) return;
    const batch = writeBatch(db);
    pending.forEach(p => batch.delete(doc(db, 'users', uid, 'pendingTransactions', p.id)));
    await batch.commit();
  }

  return {
    pending,
    loading,
    existingTellerIds: existingTellerIds.current,
    addPending,
    addPendingBatch,
    dismissPending,
    clearAllPending,
  };
}
