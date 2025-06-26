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
    <div className="overflow-x-auto rounded-md border border-neutral-200 bg-white my-[20px] mx-auto max-w-[1200px]">
      <table className="w-full text-sm">
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
              className="flex flex-col gap-2 px-5 py-3 bg-white border-b border-neutral-300 last:border-none md:table-row md:gap-0 md:px-0 md:py-0 md:bg-transparent"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={clsx(
                    "block sm:table-cell whitespace-nowrap", // become block on mobile
                    cell.column.id === "exercise" &&
                      "flex-1 w-48 text-base font-medium text-neutral-950 leading-tight md:px-5 md:py-3 md:text-xs md:leading-none",
                    cell.column.id === "section" &&
                      "w-48 text-xs font-medium text-neutral-600 leading-none md:px-5 md:py-3",
                    cell.column.id === "setLog" &&
                      "inline-flex items-center gap-3 flex-nowrap md:ml-auto md:table-cell md:text-right md:px-5 md:py-3"
                  )}
                >
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
  onEditSet: PropTypes.func,
};

export default CompletedWorkoutTable; 