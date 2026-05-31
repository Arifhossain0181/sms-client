interface UpcomingExamItem {
  id: string;
  title: string;
  date: string;
}

interface UpcomingExamsProps {
  items: UpcomingExamItem[];
  isLoading?: boolean;
}

export const UpcomingExams = ({ items, isLoading }: UpcomingExamsProps) => {
  return (
    <div className="h-full rounded-2xl border border-border/60 bg-card/80 p-6 shadow-soft">
      <h3 className="text-lg font-semibold mb-4">Upcoming Exams</h3>
      <div className="space-y-3 text-sm">
        {isLoading && <p className="text-xs text-muted-foreground">Loading exams...</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-xs text-muted-foreground">No upcoming exams.</p>
        )}
        {!isLoading && items.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between">
            <span className="text-foreground font-medium">{exam.title}</span>
            <span className="text-xs text-muted-foreground">{exam.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
