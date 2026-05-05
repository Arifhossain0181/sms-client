import TeacherCard from "@/modules/teacher/TeacherCard";

interface Props {
  params: { id: string };
}

export default function TeacherDetailPage({ params }: Props) {
  return <TeacherCard id={params.id} />;
}