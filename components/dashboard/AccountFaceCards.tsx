import { fmtCurrency } from '@/lib/money';

export interface AccountFaceData {
  id: string;
  name: string;
  currency: string;
  native: number;
  received: number;
  spent: number;
}

const FACE_PRESETS = [
  { gradient: 'linear-gradient(135deg,#f9a8bd,#f2708f 55%,#e0517a)', ink: '#ffffff', inkMute: 'rgba(255,255,255,.85)' },
  { gradient: 'linear-gradient(135deg,#dfe4f2,#b9c2da 55%,#9aa6c6)', ink: '#1f2742', inkMute: 'rgba(31,39,66,.65)' },
  { gradient: 'linear-gradient(135deg,#2c3757,#1f2742 60%,#151a2d)', ink: '#ffffff', inkMute: 'rgba(255,255,255,.7)' },
  { gradient: 'linear-gradient(135deg,#7fe3d4,#1fb9a4 55%,#0f8f7d)', ink: '#ffffff', inkMute: 'rgba(255,255,255,.85)' },
] as const;

function faceFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return FACE_PRESETS[Math.abs(h) % FACE_PRESETS.length]!;
}

const METER_REFERENCE = 2000;

/**
 * Account cards — Block 3 of the Overview (design_handoff_theus_rehaul
 * README). Card faces sized to real plastic (ISO/IEC 7810 ID-1 ratio);
 * the mockup's sample last-4-digit numbers are illustrative only — this
 * app has no such field, so the masked line shows the account's real
 * currency instead of a fabricated number.
 */
export function AccountFaceCards({ accounts }: { accounts: AccountFaceData[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(188px,1fr))] gap-[18px]">
      {accounts.map((a) => {
        const face = faceFor(a.id);
        const receivedPct = Math.min(100, (a.received / METER_REFERENCE) * 100);
        const spentPct = Math.min(100, (a.spent / METER_REFERENCE) * 100);
        return (
          <div key={a.id} className="glass flex flex-col !rounded-[26px] p-4 px-4 pb-5">
            <div
              className="relative overflow-hidden p-[13px] px-[15px]"
              style={{
                boxSizing: 'border-box',
                aspectRatio: '1.586',
                borderRadius: 16,
                background: face.gradient,
                boxShadow: '0 12px 26px rgba(31,39,66,.20)',
              }}
            >
              <span
                aria-hidden
                className="absolute rounded-full"
                style={{ width: 160, height: 160, right: -30, top: -20, background: 'rgba(255,255,255,.14)' }}
              />
              <div className="relative flex h-full flex-col justify-between">
                <div
                  className="text-[11px] font-bold uppercase tracking-[0.1em]"
                  style={{ color: face.inkMute }}
                >
                  {a.currency}
                </div>
                <div className="flex items-center gap-0">
                  <span
                    className="min-w-0 flex-1 truncate text-[15px] font-bold"
                    style={{ color: face.ink }}
                  >
                    {a.name}
                  </span>
                  <span
                    aria-hidden
                    className="h-[15px] w-[15px] shrink-0 rounded-full"
                    style={{ background: 'rgba(255,255,255,.55)' }}
                  />
                  <span
                    aria-hidden
                    className="h-[15px] w-[15px] shrink-0 rounded-full"
                    style={{ background: 'rgba(255,255,255,.35)', marginLeft: -6 }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 px-[6px]">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-mute">
                Balance
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-[26px] font-extrabold -tracking-[0.03em] tabular-nums text-ink">
                  {fmtCurrency(a.native, a.currency, { noSymbol: true, decimals: 0 })}
                </span>
                <span className="text-[14px] font-bold text-ink-mute">{a.currency}</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-[14px]">
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-mute">Received</div>
                  <div className="mt-0.5 text-[15px] font-bold tabular-nums text-in">
                    {fmtCurrency(a.received, a.currency, { noSymbol: true, decimals: 0 })}
                  </div>
                  <div className="mt-1.5 h-[6px] rounded-full bg-white/80">
                    <div
                      className="meter h-full rounded-full"
                      style={{ width: `${receivedPct}%`, background: 'linear-gradient(90deg,#1fb9a4,#3da3ef)' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold text-ink-mute">Spent</div>
                  <div className="mt-0.5 text-[15px] font-bold tabular-nums text-out">
                    {fmtCurrency(a.spent, a.currency, { noSymbol: true, decimals: 0 })}
                  </div>
                  <div className="mt-1.5 h-[6px] rounded-full bg-white/80">
                    <div
                      className="meter h-full rounded-full"
                      style={{ width: `${spentPct}%`, background: 'linear-gradient(90deg,#f2708f,#f4a545)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
