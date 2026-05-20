import AIFinancialInsights from "../../components/AIFinancialInsights";
import ChurnRadarPanel from "../../components/ChurnRadarPanel";

export default function ReportsPage() {
  return (
    <main className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <AIFinancialInsights />
        <ChurnRadarPanel />
      </section>

      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Detailed reports
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Use the widgets above for quick insights; export CSV for deep
          analysis.
        </p>
      </section>
    </main>
  );
}
