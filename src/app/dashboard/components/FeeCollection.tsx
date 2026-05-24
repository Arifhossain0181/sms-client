interface FeeCollectionProps {
  collected: number;
  outstanding: number;
  overdueCount: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(value);

export const FeeCollection = ({ collected, outstanding, overdueCount }: FeeCollectionProps) => {
  return (
    <div className="h-full rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <h3 className="text-lg font-semibold mb-4">Fee Collection</h3>
      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Collected</span>
          <span className="text-foreground font-semibold">৳ {formatCurrency(collected)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Outstanding</span>
          <span className="text-foreground font-semibold">৳ {formatCurrency(outstanding)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Overdue</span>
          <span className="text-foreground font-semibold">{overdueCount}</span>
        </div>
      </div>
    </div>
  );
};
