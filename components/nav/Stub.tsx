import { Card, Mono } from '@/components/ui';

/**
 * Placeholder body for routes whose real content lands in later chunks.
 */
export function Stub({ chunk, what }: { chunk: number; what: string }) {
  return (
    <Card className="mt-10 p-10">
      <div className="text-center">
        <Mono size="xs">in progress</Mono>
        <p className="mt-3 text-base text-ink-soft">
          Lands in <span className="text-accent font-medium">Chunk {chunk}</span>: {what}
        </p>
      </div>
    </Card>
  );
}
