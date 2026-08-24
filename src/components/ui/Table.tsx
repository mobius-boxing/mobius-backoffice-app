import React, { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface Column<T = any> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function Table<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="animate-pulse">
          <div className="h-4 gd-skel w-full mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 gd-skel w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('gd-table-wrap overflow-x-auto', className)}>
      <table className="gd-table min-w-full">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cn('text-left', column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="gd-table-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn('whitespace-nowrap', column.className)}
                  >
                    {column.accessor(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
