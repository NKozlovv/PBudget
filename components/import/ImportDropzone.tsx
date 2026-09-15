'use client';

import { useState, useTransition, type DragEvent, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Mono, Num } from '@/components/ui';
import { importXlsxAction, type ImportSummary } from '@/app/actions/import';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLS_MIME = 'application/vnd.ms-excel';

export function ImportDropzone() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importYear, setImportYear] = useState<number>(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function pickFile(f: File | null) {
    setError(null);
    setSummary(null);
    if (!f) {
      setFile(null);
      return;
    }
    const ok =
      f.type === XLSX_MIME ||
      f.type === XLS_MIME ||
      f.name.toLowerCase().endsWith('.xlsx') ||
      f.name.toLowerCase().endsWith('.xls');
    if (!ok) {
      setError('That file does not look like an Excel workbook.');
      return;
    }
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    pickFile(f);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    pickFile(f);
  }

  function submit() {
    if (!file) return;
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('importYear', String(importYear));
      const res = await importXlsxAction(fd);
      if (res.ok) {
        setSummary(res.data);
        setFile(null);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={
          'relative rounded-2xl border-2 border-dashed transition-colors ' +
          (dragOver
            ? 'border-accent bg-accent-soft'
            : 'border-rule bg-bg-soft hover:bg-bg-panel/40')
        }
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onChange}
            disabled={pending}
            className="sr-only"
          />
          <Mono>
            {file ? 'File selected' : dragOver ? 'Drop the file' : 'Drop an .xlsx here'}
          </Mono>
          {file ? (
            <div className="text-[14px] text-ink">{file.name}</div>
          ) : (
            <div className="text-[14px] text-ink-soft">
              or <span className="text-accent underline-offset-2 hover:underline">browse</span>
            </div>
          )}
          <p className="mt-1 text-[12px] text-ink-mute max-w-md">
            Sheets named January – December · expense block in cols B–G · income block in cols
            I–L · accounts in “Accounts Balance”.
          </p>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Mono size="xs">Year</Mono>
        <input
          type="number"
          min={2000}
          max={2100}
          value={importYear}
          onChange={(e) => setImportYear(Number(e.target.value))}
          className="w-[100px] rounded-[10px] border border-rule bg-bg px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-accent"
          disabled={pending}
        />
        <span className="text-[12px] text-ink-mute">
          Used as the calendar year for income rows (no per-row date in the source).
        </span>
        <div className="ml-auto">
          <Button onClick={submit} disabled={!file || pending}>
            {pending ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-neg/40 bg-neg-soft px-5 py-4 text-[13px] text-neg" role="alert">
          {error}
        </div>
      ) : null}

      {summary ? <SummaryCard summary={summary} /> : null}
    </div>
  );
}

function SummaryCard({ summary }: { summary: ImportSummary }) {
  return (
    <div className="rounded-2xl border border-pos/40 bg-pos-soft px-6 py-5">
      <Mono tone="pos">Import complete</Mono>
      <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-6 sm:grid-cols-3">
        <Stat
          label="Transactions"
          value={summary.transactions.inserted}
          tone="pos"
          sub={`${summary.transactions.expense} expense · ${summary.transactions.income} income · ${summary.transactions.adjustment} adjustment`}
        />
        <Stat
          label="Accounts"
          value={summary.accounts.created}
          sub={`+ ${summary.accounts.reused} reused`}
        />
        <Stat label="Categories" value={summary.categories.expense + summary.categories.income} />
        <Stat label="Subcategories" value={summary.subcategories} />
        <Stat label="FX rates fetched" value={summary.fx.fetched} />
        <Stat label="Skipped rows" value={summary.dropped} tone={summary.dropped > 0 ? 'neg' : 'mute'} />
      </div>
      {summary.warnings.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1 border-t border-rule/60 pt-3 text-[12px] text-ink-soft">
          {summary.warnings.map((w, i) => (
            <li key={i}>· {w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: 'default' | 'pos' | 'neg' | 'mute';
}) {
  const numTone = tone === 'default' ? 'default' : tone;
  return (
    <div>
      <Mono size="xs">{label}</Mono>
      <div className="mt-1">
        <Num size={20} weight={600} tone={numTone}>
          {value}
        </Num>
      </div>
      {sub ? <p className="mt-0.5 text-[11px] text-ink-mute">{sub}</p> : null}
    </div>
  );
}
