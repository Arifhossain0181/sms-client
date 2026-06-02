import TeacherCard from "@/app/modules/teachers/teachercard";

interface Props {
  params: { id: string };
}

export default function TeacherDetailPage({ params }: Props) {
  return <TeacherCard id={params.id} />;
}