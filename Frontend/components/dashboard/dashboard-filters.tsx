"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { cn } from "@/lib/utils"

interface DashboardFiltersProps {
  fromDate: Date | undefined
  toDate: Date | undefined
  sourceFilter: string
  platformFilter: string
  categoryFilter: string
  setFromDate: (date: Date | undefined) => void
  setToDate: (date: Date | undefined) => void
  setSourceFilter: (value: string) => void
  setPlatformFilter: (value: string) => void
  setCategoryFilter: (value: string) => void
  onReset: () => void
}

export function DashboardFilters({
  fromDate,
  toDate,
  sourceFilter,
  platformFilter,
  categoryFilter,
  setFromDate,
  setToDate,
  setSourceFilter,
  setPlatformFilter,
  setCategoryFilter,
  onReset
}: DashboardFiltersProps) {
  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-base font-semibold text-[#1a365d]">Filters</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date From */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 px-3 text-sm",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Date To */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 px-3 text-sm",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Source Filter */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Source</label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">Tiktok</SelectItem>
                <SelectItem value="whatsapp">Whatsapp</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="youtube">Youtube</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Platform Filter */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Platform</label>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="shopee">Shopee</SelectItem>
                <SelectItem value="tokopedia">Tokopedia</SelectItem>
                <SelectItem value="lazada">Lazada</SelectItem>
                <SelectItem value="tiktok_shop">Tiktok Shop</SelectItem>
                <SelectItem value="blibli">Blibli</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Category Filter */}
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Fashion">Fashion</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Beauty">Beauty</SelectItem>
                <SelectItem value="Home">Home</SelectItem>
                <SelectItem value="Food">Food</SelectItem>
                <SelectItem value="Others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-xs h-8"
          >
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
