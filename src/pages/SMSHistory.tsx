import SMSLayout from '@/components/layout/SMSLayout';
import SMSLogTable from '@/components/sms/SMSLogTable';

export default function SMSHistory() {
  return (
    <SMSLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">SMS History</h1>
          <p className="text-muted-foreground mt-1">
            View your sent SMS messages and their details
          </p>
        </div>

        <SMSLogTable />
      </div>
    </SMSLayout>
  );
}
