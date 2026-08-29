import { useState, useEffect } from "react";
import { useClasses } from "../class/useClasses";
import { useStudents } from "../student/useStudents";
import { useAdmissions } from "../admission/useAdmission";
import { AttendanceStatus } from "./attendance.types";
import { useTakeAttendance } from "./useAttendance";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTeachers } from "../teachers/useTeachers";
import api from "@/lib/axios";



interface StudentAttendance{
    studentId: string;
    name: string;
    status:AttendanceStatus;
}

export default function MarkAttendance() {
    const {data:classes} = useClasses();
    const {data:students} = useStudents();
    const {role, user} = useAuth();
    const {data:admissions} = useAdmissions({}, role === "SCHOOL_ADMIN");
    const {mutate:submitAttendance,isPending} = useTakeAttendance();
    const { data: teachers } = useTeachers();

    const [assignedClassIds, setAssignedClassIds] = useState<Set<string>>(new Set());
    const [assignedSectionIds, setAssignedSectionIds] = useState<Set<string>>(new Set());
    const [classesLoaded, setClassesLoaded] = useState(false);

    const [classId,setClassId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [date,setDate] = useState(new Date().toISOString().split("T")[0]);

      const [attendanceList, setAttendanceList] = useState<StudentAttendance[]>([]);

      useEffect(() => {
        if (role !== "TEACHER" || !user?.id || classesLoaded) return;
        const loadAssigned = async () => {
          try {
            const res = await api.get("/teachers/me");
            const payload = res.data?.data ?? res.data;
            const sectionTeacher = payload?.sectionTeacher as Array<{ id: string; class?: { id: string } }> | undefined;
            const classIds = new Set<string>();
            const sectionIds = new Set<string>();
            sectionTeacher?.forEach((st) => {
              if (st.class?.id) classIds.add(st.class.id);
              if (st.id) sectionIds.add(st.id);
            });
            setAssignedClassIds(classIds);
            setAssignedSectionIds(sectionIds);
          } catch {
            /* ignore */
          } finally {
            setClassesLoaded(true);
          }
        };
        loadAssigned();
      }, [role, user?.id, classesLoaded]);

      const availableClasses = role === "TEACHER"
        ? (Array.isArray(classes) ? classes : []).filter((c) => assignedClassIds.has(c.id))
        : (Array.isArray(classes) ? classes : []);

      const availableSections = role === "TEACHER"
        ? (Array.isArray(classes) ? classes : []).find((cls) => cls.id === classId)?.sections?.filter((s) => assignedSectionIds.has(s.id)) ?? []
        : (Array.isArray(classes) ? classes : []).find((cls) => cls.id === classId)?.sections ?? [];

      // class selected korle oi class er students attendance list load hobe
      const handleClassChange = (selectedClassId:string)=>{
        setClassId(selectedClassId);
        const nextSectionId = availableSections[0]?.id ?? "";
        setSectionId(nextSectionId);

        const studentList = Array.isArray(students) ? students : [];
        const admissionList = Array.isArray(admissions) ? admissions : [];
        
        let classStudents = studentList.filter((s) => s.classId === selectedClassId);

        if (role === "SCHOOL_ADMIN") {
          const approvedEmails = new Set(
            admissionList
              .filter((a) => a.targetClassId === selectedClassId && a.status === "APPROVED" && a.studentEmail)
              .map((a) => a.studentEmail.toLowerCase())
          );
          classStudents = classStudents.filter((s) => s.email && approvedEmails.has(s.email.toLowerCase()));
        }

        classStudents.sort((a, b) => {
          const rollA = parseInt(a.rollNumber || "0", 10);
          const rollB = parseInt(b.rollNumber || "0", 10);
          return rollA - rollB;
        });

        setAttendanceList(
             classStudents.map((s) => ({
                studentId: s.id,
                name: s.name,
                status: "PRESENT" as AttendanceStatus,
             }))
        )
      }

      // single student er attendance status change korar function
      const handleStatusChange = (studentId:string,status:AttendanceStatus)=>{
        setAttendanceList((prevList) =>
            prevList.map((item) => (item.studentId === studentId ? { ...item, status } : item))
        );
      }
      // toghether submit korar function absent and Present 
      const handleMarkAll = (status:AttendanceStatus)=>{
        setAttendanceList((prevList) => prevList.map((item) => ({ ...item, status })));
      }
      //submit korar function
      const handleSubmit = () =>{
        if(!classId || !sectionId || !date) return toast.error("Please select class, section and date");
        if(role === "SCHOOL_ADMIN" && !teacherId) return toast.error("Please select a teacher");
        const payload = {
            classId,
            sectionId,
            date,
            entries: attendanceList.map((item) => ({
              studentId: item.studentId,
              status: item.status,
            })),
            ...(role === "SCHOOL_ADMIN" && teacherId ? { teacherId } : {}),
        };
        submitAttendance(payload,{
            onSuccess:()=>{
                toast.success("Attendance marked successfully");
            },
            onError:()=>{
                toast.error("Failed to mark attendance");
            }
        })
      }
      const statusColor ={
        PRESENT: "bg-green-100 text-green-700 border-green-300",
    ABSENT:  "bg-red-100 text-red-700 border-red-300",
    LATE:    "bg-yellow-100 text-yellow-700 border-yellow-300",
      }
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Take Attendance</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Select a class and date</p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Class</label>
          <select
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          >
            <option value="">Select class</option>
            {availableClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} — {(cls.sections ?? []).map((section) => section.name).join(", ")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          >
            <option value="">Select section</option>
            {availableSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} (max {section.maxCapacity})
              </option>
            ))}
          </select>
        </div>

        {role === "SCHOOL_ADMIN" && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
            >
              <option value="">Select teacher</option>
              {(Array.isArray(teachers) ? teachers : []).map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700"
          />
        </div>
      </div>

      {/* Attendance Table */}
      {attendanceList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">

          {/* Mark All Buttons */}
          <div className="flex gap-2 p-4 border-b dark:border-slate-700">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">Mark all as:</span>
            <button
              onClick={() => handleMarkAll("PRESENT")}
              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
            >
              All Present
            </button>
            <button
              onClick={() => handleMarkAll("ABSENT")}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
            >
              All Absent
            </button>
            <button
              onClick={() => handleMarkAll("LATE")}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200"
            >
              All Late
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Student name</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {attendanceList.map((item, index) => (
                <tr key={item.studentId} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-800 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(item.studentId, s)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                            item.status === s
                              ? statusColor[s]
                              : "bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-700"
                          }`}
                        >
                          {s === "PRESENT" ? "Present" : s === "ABSENT" ? "Absent" : "Late"}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Submit */}
          <div className="p-4 border-t dark:border-slate-700 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* No class selected */}
      {!classId && role === "TEACHER" && availableClasses.length === 0 && classesLoaded && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
              No class is assigned to you.
        </div>
      )}
      {!classId && !(role === "TEACHER" && availableClasses.length === 0 && classesLoaded) && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          Select a class
        </div>
      )}

      {/* Class selected but no students */}
      {classId && attendanceList.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          No students in this class
        </div>
      )}
    </div>
  );

}