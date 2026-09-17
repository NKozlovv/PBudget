import { PageHeader } from '@/components/nav/PageHeader';
import { Card, Mono } from '@/components/ui';
import { ImportDropzone } from '@/components/import/ImportDropzone';

export const metadata = { title: 'Import · Theus' };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import XLSX"
        meta="One-shot bulk import from the legacy Google Sheets export. Existing accounts and categories are reused, not duplicated."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-7">
          <ImportDropzone />
        </Card>

        <Card className="p-6">
          <Mono>How it works</Mono>
          <ol className="mt-4 flex flex-col gap-3 text-[13px] text-ink-soft leading-relaxed">
            <Step n={1}>
              The workbook is parsed in place — never uploaded anywhere except to your own
              Supabase project.
            </Step>
            <Step n={2}>
              Account names ending in <code className="text-ink">$</code> are imported as USD;
              everything else as EUR.
            </Step>
            <Step n={3}>
              Rows tagged <code className="text-ink">Account adjustment</code> are stored as
              transfers, not expenses or income — they don&apos;t inflate your totals.
            </Step>
            <Step n={4}>
              For every USD transaction, the historical USD→EUR rate is fetched from
              Frankfurter. Display values use these rates rather than today&apos;s rate.
            </Step>
            <Step n={5}>
              Re-running the import is safe — accounts and categories are matched by name; the
              same rows just create more transactions.
            </Step>
          </ol>
        </Card>
      </div>
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
