import { PageHeader } from '@/components/ui/page-header';
import { RecurringInvoiceForm } from '@/components/features/RecurringInvoiceForm';
import { RecurringInvoiceList } from '@/components/features/RecurringInvoiceList';

export default function RecurringInvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Invoices"
        description="Automate invoice generation with recurring schedules"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecurringInvoiceForm />
        <div>
          <RecurringInvoiceList />
        </div>
      </div>
    </div>
  );
}
