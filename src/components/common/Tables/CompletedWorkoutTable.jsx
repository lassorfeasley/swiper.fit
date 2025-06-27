import React from "react";
import PropTypes from "prop-types";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import SetLogCell from "./SetLogCell";
import clsx from "clsx";

/**
 * Generic table that displays a completed workout. The component is intentionally
 * kept presentation-only; all data transformation (grouping sets by exercise)
 * should already be done by the parent before passing the `data` prop.
 */
const CompletedWorkoutTable = ({ data = [], onEditSet }) => {
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "exercise",
        header: () => <span className="text-left">Exercise</span>,
        cell: ({ getValue }) => (
          <span className="text-xs font-medium text-neutral-950 leading-none">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "section",
        header: () => <span className="text-left">Section</span>,
        cell: ({ getValue }) => (
          <span className="text-xs font-medium text-neutral-600 leading-none w-48">
            {getValue()}
          </span>
        ),
      },
      {
        id: "setLog",
        accessorKey: "setLog",
        header: () => <span className="block text-right">Set log</span>,
        // The raw value is an array of set objects
        cell: ({ getValue, row }) => (
          <SetLogCell
            exerciseId={row.original.id}
            sets={getValue() ?? []}
            onEdit={onEditSet}
          />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table className="w-full text-sm border-collapse">
      <thead className="hidden md:table-header-group bg-neutral-100 sticky top-0 z-10">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                scope="col"
                className="px-5 py-3 text-left font-semibold text-neutral-700 whitespace-nowrap"
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            className="flex flex-col gap-4 bg-white border-b border-neutral-300 p-5 last:border-none md:table-row md:p-0 md:gap-0"
          >
            {/* --- Mobile View --- */}
            <td className="w-full space-y-4 md:hidden">
              <div className="flex items-center justify-between self-stretch">
                <span className="font-vietnam text-lg font-medium leading-tight text-slate-600">
                  {row.original.exercise}
                </span>
                <span className="font-vietnam text-lg font-medium leading-tight text-slate-300">
                  {row.original.section}
                </span>
              </div>
              <SetLogCell
                exerciseId={row.original.id}
                sets={row.original.setLog ?? []}
                onEdit={onEditSet}
              />
            </td>

            {/* --- Desktop View --- */}
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className={clsx(
                  "hidden md:table-cell whitespace-nowrap px-5 py-3",
                  cell.column.id === "exercise" &&
                    "text-xs font-medium text-neutral-950 leading-none",
                  cell.column.id === "section" &&
                    "text-xs font-medium text-neutral-600 leading-none",
                  cell.column.id === "setLog" && "text-right"
                )}
              >
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

CompletedWorkoutTable.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      exercise: PropTypes.string.isRequired,
      section: PropTypes.string,
      setLog: PropTypes.arrayOf(PropTypes.object),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  onEditSet: PropTypes.func,
};

export default CompletedWorkoutTable; 