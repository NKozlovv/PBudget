import { Card } from '@/components/ui';
import { ResetForm } from '@/components/auth/ResetForm';

export const metadata = { title: 'Reset password · Theus' };

export default function ResetPage() {
  return (
    <Card className="p-7">
      <ResetForm />
    </Card>
  );
}
