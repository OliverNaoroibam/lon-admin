import Header from '@/components/header';
import { KPICards } from './kpi-cards';
import { RecentActivity } from './recent-activity';
import { PendingActions } from './pending-actions';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-8">
        {/* KPI Cards */}
        <KPICards />

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
          {/* Pending Actions */}
          <div className="lg:col-span-2">
            <PendingActions />
          </div>
          {/* Recent Activity */}
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>
        </div>
      </div>
    </>
  );
}
