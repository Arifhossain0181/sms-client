interface AdmissionItem {
  id: string;
  name: string;
  grade: string;
  status: string;
}

interface RecentAdmissionsProps {
  items: AdmissionItem[];
  isLoading?: boolean;
}

export const RecentAdmissions = ({ items, isLoading }: RecentAdmissionsProps) => {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Admissions</h3>
        <button className="text-xs font-semibold text-primary">View all</button>
      </div>
      <div className="space-y-3 text-sm">
        {isLoading && (
          <p className="text-xs text-muted-foreground">Loading admissions...</p>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">No admissions yet.</p>
        )}
        {!isLoading && items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.grade}</p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
