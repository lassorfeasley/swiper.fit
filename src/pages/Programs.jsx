import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MdAdd } from "react-icons/md";

const HEADER_HEIGHT = 96; // px

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrograms() {
      setLoading(true);
      // Fetch all programs
      const { data: programsData, error } = await supabase
        .from("programs")
        .select("id, name");
      if (error) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // For each program, fetch the number of exercises
      const programsWithCounts = await Promise.all(
        programsData.map(async (program) => {
          const { count, error: countError } = await supabase
            .from("program_exercises")
            .select("id", { count: "exact", head: true })
            .eq("program_id", program.id);
          return {
            ...program,
            exerciseCount: countError ? 0 : count,
          };
        })
      );
      setPrograms(programsWithCounts);
      setLoading(false);
    }
    fetchPrograms();
  }, []);

  return (
    <div className="min-h-screen pb-32">
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 w-full bg-white z-40 flex flex-col"
        style={{ height: HEADER_HEIGHT, boxShadow: "0 1px 0 #e5e7eb" }}
      >
        <h1 className="text-3xl font-bold px-4 pt-8 pb-2">Programs</h1>
        <hr className="border-gray-300 mx-0" />
      </div>
      {/* Scrollable Content */}
      <div className="pt-[104px] space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="flex items-center justify-between bg-[#353942] rounded-3xl px-3 py-6 text-white shadow-md w-full"
            >
              <div>
                <div className="text-2xl font-bold">{program.name}</div>
                <div className="text-lg text-gray-200">
                  {program.exerciseCount} exercises
                </div>
              </div>
              <button className="bg-white bg-opacity-0 hover:bg-opacity-20 rounded-full p-2 transition">
                <MdAdd size={28} className="text-white" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Programs;
