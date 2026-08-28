import StudentCard from "@/app/modules/student/StudentCard";

interface Props {
  params: { id: string };
}

export default function StudentDetailPage({ params }: Props) {
  return <StudentCard id={params.id} />;
}