export const RevenueChart = () => {
  return (
    <div className="h-full rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Revenue Growth</h3>
          <p className="text-xs text-muted-foreground">Monthly snapshot</p>
        </div>
      </div>
      <div className="h-56 rounded-xl bg-gradient-to-br from-amber-200/70 via-rose-200/60 to-emerald-200/60" />
    </div>
  );
};
