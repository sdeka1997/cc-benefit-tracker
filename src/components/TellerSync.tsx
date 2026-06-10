import { useState, useEffect } from 'react';
import { useTellerConnect } from 'teller-connect-react';
import { httpsCallable } from '../firebase';
import { functions, db } from '../firebase';
import { doc, onSnapshot } from '../firebase';
import { RefreshCw } from 'lucide-react';
import type { TellerAccount } from '../types/index';

const storeTellerEnrollment = httpsCallable(functions, 'storeTellerEnrollment');
const getTellerTransactions  = httpsCallable(functions, 'getTellerTransactions');
const selectTellerAccount    = httpsCallable(functions, 'selectTellerAccount');
const disconnectTeller       = httpsCallable(functions, 'disconnectTeller');

const TELLER_APP_ID = 'app_pr4hc80mpvbhp573su000';

interface TellerSyncProps {
  uid: string;
  onTransactionsFetched: (transactions: unknown[]) => Promise<void>;
}

export function TellerSync({ uid, onTransactionsFetched }: TellerSyncProps) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [institution, setInstitution] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<TellerAccount[] | null>(null);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<{ error?: string; info?: string } | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', uid), snap => {
      const teller = snap.data()?.teller;
      setConnected(!!teller?.accessToken);
      setInstitution(teller?.institutionName || '');
      setSelectedAccountIds(teller?.selectedAccountIds || []);
      setSelectedAccountNames(teller?.selectedAccountNames || []);
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (connected && selectedAccountIds.length === 0) {
      handleFetchAccounts();
    }
  }, [connected]);

  const { open, ready } = useTellerConnect({
    applicationId: TELLER_APP_ID,
    environment: 'development',
    onSuccess: async (enrollment: { accessToken: string; institution?: { name: string } }) => {
      const accessToken = enrollment.accessToken;
      const institutionName = enrollment.institution?.name || '';
      setSaving(true);
      try {
        await storeTellerEnrollment({ accessToken, institutionName });
      } catch (err: unknown) {
        setStatus({ error: `Failed to save connection: ${(err as Error).message}` });
      } finally {
        setSaving(false);
      }
    },
    onExit: () => {},
  });

  async function handleFetchAccounts() {
    setSyncing(true);
    setStatus(null);
    try {
      const result = await getTellerTransactions({}) as { data: { accounts: TellerAccount[] } };
      const fetchedAccounts = result.data.accounts;
      if (fetchedAccounts.length === 0) {
        setAccounts([]);
        return;
      }
      if (fetchedAccounts.length === 1) {
        await selectTellerAccount({
          accountIds: [fetchedAccounts[0].id],
          accountNames: [fetchedAccounts[0].name],
        });
      } else {
        setAccounts(fetchedAccounts);
        setPickerSelection(new Set(fetchedAccounts.map(a => a.id)));
      }
    } catch (err: unknown) {
      setStatus({ error: (err as Error).message });
    } finally {
      setSyncing(false);
    }
  }

  async function handleConfirmAccounts() {
    if (!accounts) return;
    const chosen = accounts.filter(a => pickerSelection.has(a.id));
    if (chosen.length === 0) return;
    await selectTellerAccount({
      accountIds: chosen.map(a => a.id),
      accountNames: chosen.map(a => a.name),
    });
    setAccounts(null);
  }

  async function handleSync() {
    setSyncing(true);
    setStatus(null);
    try {
      const result = await getTellerTransactions({}) as { data: { transactions: unknown[] } };
      const { transactions } = result.data;
      await onTransactionsFetched(transactions);
    } catch (err: unknown) {
      setStatus({ error: (err as Error).message });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectTeller();
      setAccounts(null);
    } catch (err: unknown) {
      setStatus({ error: (err as Error).message });
    } finally {
      setDisconnecting(false);
    }
  }

  if (connected === null || saving) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <RefreshCw size={24} className="spin" color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Bank Connection</h3>

      {!connected ? (
        <>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Connect your credit cards to automatically surface transactions that may match your benefits.
          </p>
          <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span>Read-only access — we can never move money or make changes</span>
            <span>Powered by Teller, a bank-grade financial data provider</span>
            <span>Only credit card accounts are fetched</span>
          </div>
          {status?.error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', color: '#b91c1c' }}>
              {status.error}
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={() => open()}
            disabled={!ready}
          >
            Connect Credit Cards
          </button>
        </>
      ) : (
        <>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#14532d' }}>{institution || 'Bank'} connected</div>
              {selectedAccountNames.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>{selectedAccountNames.join(' · ')}</div>
              )}
            </div>
          </div>

          {status?.error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', color: '#b91c1c' }}>
              {status.error}
            </div>
          )}
          {status?.info && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', color: '#1e40af' }}>
              {status.info}
            </div>
          )}

          {accounts !== null && (
            accounts.length === 0 ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius)', padding: '0.75rem', fontSize: '0.875rem', color: '#92400e' }}>
                No credit card accounts found.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Select accounts to sync:</p>
                {accounts.map(a => (
                  <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: `1px solid ${pickerSelection.has(a.id) ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={pickerSelection.has(a.id)}
                      onChange={e => {
                        const next = new Set(pickerSelection);
                        e.target.checked ? next.add(a.id) : next.delete(a.id);
                        setPickerSelection(next);
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.name}</span>
                    {a.last4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>···· {a.last4}</span>}
                  </label>
                ))}
                <button
                  className="btn btn-primary"
                  onClick={handleConfirmAccounts}
                  disabled={pickerSelection.size === 0}
                >
                  Confirm Selection
                </button>
              </div>
            )
          )}

          {accounts === null && selectedAccountIds.length === 0 && syncing && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <RefreshCw size={20} className="spin" color="var(--text-muted)" />
            </div>
          )}

          {accounts === null && selectedAccountIds.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleSync}
              disabled={syncing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {syncing ? <><RefreshCw size={16} className="spin" /> Syncing…</> : 'Sync Transactions'}
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { setAccounts(null); handleFetchAccounts(); }}
              disabled={syncing}
              style={{ flex: 1, background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', padding: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              Change Accounts
            </button>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              style={{ flex: 1, background: 'none', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '0.5rem', fontSize: '0.875rem', color: '#b91c1c', cursor: 'pointer' }}
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
