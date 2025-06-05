
"use client";

import { useState, useMemo, useEffect } from 'react';
import { mockResources, type Resource } from '@/lib/mock-data';
import { ResourceCard } from './resource-card';
import { FilterControls } from './filter-controls';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search } from 'lucide-react';

export function ResourceDisplayPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [useRegex, setUseRegex] = useState(false); // Not implemented in UI yet for simplicity

  useEffect(() => {
    // Simulate fetching data
    setResources(mockResources);
  }, []);
  
  const availableYears = useMemo(() => [...new Set(mockResources.map(r => r.year))].sort((a,b) => b-a), []);
  const availableTypes = useMemo(() => [...new Set(mockResources.map(r => r.type))].sort(), []);
  const availableCourses = useMemo(() => [...new Set(mockResources.map(r => r.course))].sort(), []);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearchTerm = searchTerm
        ? resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesYear = selectedYear ? resource.year.toString() === selectedYear : true;
      const matchesType = selectedType ? resource.type === selectedType : true;
      const matchesCourse = selectedCourse ? resource.course === selectedCourse : true;
      
      return matchesSearchTerm && matchesYear && matchesType && matchesCourse;
    });
  }, [resources, searchTerm, selectedYear, selectedType, selectedCourse]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedCourse('');
  };

  return (
    <div className="container mx-auto py-2">
      <h1 className="font-headline text-3xl font-bold mb-8 text-primary">University Resources</h1>
      
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        onResetFilters={resetFilters}
        availableYears={availableYears}
        availableTypes={availableTypes}
        availableCourses={availableCourses}
      />

      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <Alert className="mt-8">
          <Search className="h-4 w-4" />
          <AlertTitle className="font-headline">No Resources Found</AlertTitle>
          <AlertDescription>
            Try adjusting your search terms or filters.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
