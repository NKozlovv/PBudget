'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import { addLotAction, deleteLotAction } from '@/app/actions/investing';
import { eur, niceDate } from '@/lib/investing/format';
import type { Lot } from '@/lib/investing/calc';

export type LotModalMode = 'buy' | 'open' | 'history';

export function LotModal({
  budgetId,
  lots,
  mode,
  onModeChange,
  onClose,
  today,
  suggestedPrice,
}: {
  budgetId: string;
  lots: Lot[];
  mode: LotModalMode;
  onModeChange: (m: LotModalMode) => void;
  onClose: () => void;
  today: string;
  /** Latest market price, to pre-fill the buy form. */
  suggestedPrice: number | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState(suggestedPrice ? suggestedPrice.toFixed(3) : '');
  const [fee, setFee] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const hasOpen = lots.some((l) => l.type === 'open');
  const total = (parseFloat(shares) || 0) * (parseFloat(price) || 0) + (parseFloat(fee) || 0);

  async function submit() {
    setError(null);
    setFlash(null);
    setPending(true);
    const res = await addLotAction({
      budget_id: budgetId,
      type: mode === 'open' ? 'open' : 'buy',
      date,
      shares: parseFloat(shares),
      price: parseFloat(price),
      fee: parseFloat(fee || '0'),
    });
    setPending(false);
    if (!res.ok) return setError(res.error);
    setFlash(
      (mode === 'open' ? 'Opening position saved: ' : 'Buy logged: ') +
        shares +
        ' shares at ' +
        eur(parseFloat(price), 3) +
        '.',
    );
    setShares('');
    setFee('1');
    router.refresh();
  }

  async function remove(id: string) {
    if (confirmId !== id) return setConfirmId(id);
    setConfirmId(null);
    const res = await deleteLotAction({ budget_id: budgetId, id });
    if (res.ok) router.refresh();
    else setError(res.error);
  }

  const tab = (k: LotModalMode, text: string) => (
    <button
      key={k}
      type="button"
      onClick={() => {
        setError(null);
        setFlash(null);
        setConfirmId(null);
        onModeChange(k);
      }}
      className={cn(
        'whitespace-nowrap rounded-full px-3 py-[7px] text-[12.5px] font-bold transition-colors',
        mode === k
          ? 'bg-[linear-gradient(180deg,#5a6be8,#4152d6)] text-white [box-shadow:0_8px_18px_-8px_rgba(74,92,224,.6)]'
          : 'text-ink-soft hover:bg-white/60',
      )}
    >
      {text}
    </button>
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} title="WEBN position" description="Every buy adds to your position and your cost basis.">
      <div className="flex flex-col gap-4">
        <div className="flex w-fit gap-1 rounded-full bg-white/60 p-1">
          {tab('buy', 'New buy')}
          {tab('open', 'Existing position')}
          {tab('history', 'History')}
        </div>

        {mode !== 'history' ? (
          <>
            <div className="text-[13px] font-semibold text-ink-soft">
              {mode === 'open'
                ? hasOpen
                  ? 'An opening position is already saved. Remove it in History to replace it.'
                  : 'Enter what you already hold: total shares and your average buy price.'
                : 'Log the buy as it appears in IB: shares, price per share, and the commission.'}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={mode === 'open' ? 'As of' : 'Buy date'}>
                {({ id }) => <Input id={id} type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />}
              </Field>
              <Field label="Shares">
                {({ id }) => (
                  <Input id={id} type="number" min={0} step={0.0001} placeholder="0" value={shares} onChange={(e) => setShares(e.target.value)} />
                )}
              </Field>
              <Field label={mode === 'open' ? 'Average price (€)' : 'Price per share (€)'}>
                {({ id }) => (
                  <Input id={id} type="number" min={0} step={0.001} placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                )}
              </Field>
              <Field label="Fees (€)">
                {({ id }) => (
                  <Input id={id} type="number" min={0} step={0.01} placeholder="0.00" value={fee} onChange={(e) => setFee(e.target.value)} />
                )}
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-white/60 px-3.5 py-3">
              <span className="text-[12.5px] font-semibold text-ink-soft">Total cost</span>
              <span className="text-[16px] font-extrabold tabular-nums">{eur(total)}</span>
            </div>
            {error ? <p className="rounded-[14px] bg-coral/15 px-3 py-2.5 text-[13px] font-bold text-neg" role="alert">{error}</p> : null}
            {flash ? <p className="rounded-[14px] bg-teal/15 px-3 py-2.5 text-[13px] font-bold text-pos">{flash}</p> : null}
            <Button onClick={submit} disabled={pending} className="!py-[13px]">
              {pending ? 'Saving…' : mode === 'open' ? 'Save opening position' : 'Log buy'}
            </Button>
          </>
        ) : (
          <div className="flex max-h-[420px] flex-col gap-0.5 overflow-y-auto">
            {lots.length === 0 ? (
              <div className="py-6 text-center text-[13px] font-medium text-ink-mute">No transactions yet.</div>
            ) : null}
            {[...lots].reverse().map((l) => {
              const conf = confirmId === l.id;
              return (
                <div
                  key={l.id}
                  className={cn(
                    'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[14px] px-3 py-2.5',
                    conf && 'bg-coral/15',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="whitespace-nowrap text-[13.5px] font-bold">{niceDate(l.date)}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10.5px] font-bold',
                          l.type === 'open' ? 'bg-indigo/15 text-indigo-dark' : 'bg-white/80 text-ink-soft',
                        )}
                      >
                        {l.type === 'open' ? 'Opening' : 'Buy'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] font-semibold tabular-nums text-ink-mute">
                      {l.shares} × {eur(l.price, 3)} = {eur(l.shares * l.price + l.fee)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.id)}
                    className={cn(
                      'whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11.5px] font-bold',
                      conf ? 'bg-[#e0568a] text-white' : 'bg-white/70 text-ink-mute hover:bg-white',
                    )}
                  >
                    {conf ? 'Confirm' : 'Remove'}
                  </button>
                </div>
              );
            })}
            {error ? <p className="mt-2 text-[13px] font-bold text-neg" role="alert">{error}</p> : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
