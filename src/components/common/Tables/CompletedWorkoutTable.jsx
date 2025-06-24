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
    <div className="overflow-x-auto rounded-md border border-neutral-200 m-[20px] max-w-[1200px]">
      <table className="w-full text-sm">
        <thead className="bg-neutral-100 sticky top-0 z-10">
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
            <tr key={row.id} className="bg-white border-b border-neutral-300 last:border-none">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={clsx("px-5 py-3 align-top whitespace-nowrap", cell.column.id === "setLog" && "text-right")}>
                  {flexRender(
                    cell.column.columnDef.cell ?? cell.column.columnDef.header,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  onEditSet: PropTypes.func.isRequired,
};

export default CompletedWorkoutTable; 