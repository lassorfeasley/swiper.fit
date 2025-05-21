export const ProgramSelection = ({
  programs,
  programsLoading,
  onProgramSelect,
}) => (
  <div className="min-h-screen flex flex-col">
    <div className="p-6 text-2xl font-bold">Select a program</div>
    {programsLoading ? (
      <div className="p-6">Loading...</div>
    ) : (
      <div className="flex flex-col gap-4 p-4">
        {programs.map((program) => (
          <button
            key={program.id}
            className="bg-[#353942] text-white rounded-2xl p-6 flex justify-between items-center text-left shadow-md"
            onClick={() => onProgramSelect(program)}
          >
            <div>
              <div className="text-xl font-bold">{program.name}</div>
              <div className="text-base text-gray-300">
                {program.exerciseCount || "?"} exercises
              </div>
            </div>
            <span className="text-2xl">+</span>
          </button>
        ))}
      </div>
    )}
  </div>
);
