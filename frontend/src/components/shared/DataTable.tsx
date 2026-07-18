"use client"

import React, { useState, useMemo } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ColumnDef<T> {
  id: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  accessorFn?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  filterPlaceholder?: string
  cell?: (row: T) => React.ReactNode
  className?: string
  headerClassName?: string
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchPlaceholder?: string
  searchKey?: string
  emptyTitle?: string
  emptyDescription?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  actions?: (row: T) => React.ReactNode
  className?: string
}

type SortDirection = "asc" | "desc" | null

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Search...",
  emptyTitle = "No results",
  emptyDescription = "No data found matching your criteria.",
  pageSize = 10,
  onRowClick,
  actions,
  className,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(0)

  const filteredData = useMemo(() => {
    if (!search) return data
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    )
  }, [data, search])

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (aVal === bVal) return 0
      const comparison = String(aVal).localeCompare(String(bVal))
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
      )
      if (sortDirection === "desc") setSortColumn(null)
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(0)
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && (
                      <div className="flex flex-col">
                        <ArrowUpDown
                          className={cn(
                            "h-3 w-3 transition-colors",
                            sortColumn === col.id
                              ? "text-electric-blue"
                              : "text-muted-foreground/50"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="h-12 px-4 w-12" />}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="h-24 text-center"
                >
                  <p className="text-muted-foreground">{emptyTitle}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {emptyDescription}
                  </p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.id} className={cn("p-4 align-middle", col.className)}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorFn
                        ? col.accessorFn(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? "")
                        : null}
                    </td>
                  ))}
                  {actions && (
                    <td className="p-4 align-middle">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {currentPage * pageSize + 1}-
            {Math.min((currentPage + 1) * pageSize, sortedData.length)} of{" "}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages - 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
