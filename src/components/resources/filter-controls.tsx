
"use client";

import type React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedCourse: string;
  setSelectedCourse: (course: string) => void;
  onResetFilters: () => void;
  availableYears: number[];
  availableTypes: string[];
  availableCourses: string[];
}

export function FilterControls({
  searchTerm,
  setSearchTerm,
  selectedYear,
  setSelectedYear,
  selectedType,
  setSelectedType,
  selectedCourse,
  setSelectedCourse,
  onResetFilters,
  availableYears,
  availableTypes,
  availableCourses,
}: FilterControlsProps) {
  return (
    <div className="mb-6 p-4 border bg-card shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="searchTerm" className="font-body">Search by Name/Keyword</Label>
          <Input
            id="searchTerm"
            type="text"
            placeholder="e.g., Physics, PHY301, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="yearFilter" className="font-body">Filter by Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger id="yearFilter" className="w-full mt-1">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="typeFilter" className="font-body">Filter by Type</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger id="typeFilter" className="w-full mt-1">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {availableTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="courseFilter" className="font-body">Filter by Course</Label>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger id="courseFilter" className="w-full mt-1">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="ghost" onClick={onResetFilters} className="font-body">
          <X className="mr-2 h-4 w-4" /> Reset Filters
        </Button>
      </div>
    </div>
  );
}
