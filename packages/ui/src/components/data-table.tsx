import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { ShellCard } from "./card";

export function DataTable({
  columns,
  rows,
  className,
}: {
  columns: string[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <ShellCard className={cn("overflow-hidden p-0", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-tertiary)]"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={`row-${index}`}
                className="border-b border-[var(--border-subtle)] last:border-b-0"
              >
                {row.map((cell, cellIndex) => (
                  <td key={`cell-${cellIndex}`} className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ShellCard>
  );
}
