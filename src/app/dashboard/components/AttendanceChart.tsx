export const AttendanceChart = () => {
  return (
    <div className="h-full rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Attendance Trends</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
      </div>
      <div className="h-48 rounded-xl bg-gradient-to-r from-emerald-200/60 via-sky-200/60 to-indigo-200/60" />
    </div>
  );
};
