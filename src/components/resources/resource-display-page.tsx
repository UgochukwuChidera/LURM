
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Resource } from '@/lib/mock-data'; // Keep Resource interface
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client
import { ResourceCard } from './resource-card';
import { FilterControls } from './filter-controls';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, Loader2 } from 'lucide-react';

export function ResourceDisplayPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      // IMPORTANT: You need to create a 'resources' table in your Supabase project
      // with columns matching the Resource interface (id, name, type, course, year, size, description, imageUrl, keywords, dataAiHint).
      // Ensure RLS (Row Level Security) is set up appropriately for read access.
      const { data, error: dbError } = await supabase
        .from('resources')
        .select('*');

      if (dbError) {
        console.error('Supabase error occurred while fetching resources. Full error object:', dbError);
        console.error('Error message:', dbError.message);
        console.error('Error details:', dbError.details);
        console.error('Error hint:', dbError.hint);
        console.error('Error code:', dbError.code);

        let detailedErrorMessage = `Failed to load resources. Supabase error: "${dbError.message || 'No specific message provided by Supabase'}".`;
        if (dbError.code) detailedErrorMessage += ` (Code: ${dbError.code})`;
        if (dbError.details) detailedErrorMessage += ` Details: ${dbError.details}.`;
        if (dbError.hint) detailedErrorMessage += ` Hint: ${dbError.hint}.`;
        detailedErrorMessage += ` Common causes: 
1. The 'resources' table might not exist in your Supabase project. 
2. Column names in the table might not match the application's expectations. 
3. Row Level Security (RLS) might be enabled without a policy allowing read access. Please check your Supabase dashboard under Authentication > Policies for the 'resources' table.`;
        
        setError(detailedErrorMessage);
        setResources([]);
      } else {
        // Assuming the data from Supabase matches the Resource[] structure.
        // You might need to map the data if column names or types differ.
        setResources(data as Resource[]);
      }
      setIsLoading(false);
    };

    fetchResources();
  }, []);
  
  // These available* calculations should use the fetched resources
  const availableYears = useMemo(() => {
    if (!resources) return [];
    return [...new Set(resources.map(r => r.year))].sort((a,b) => b-a);
  }, [resources]);
  
  const availableTypes = useMemo(() => {
    if (!resources) return [];
    return [...new Set(resources.map(r => r.type))].sort();
  }, [resources]);

  const availableCourses = useMemo(() => {
    if (!resources) return [];
    return [...new Set(resources.map(r => r.course))].sort();
  }, [resources]);


  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter((resource) => {
      const matchesSearchTerm = searchTerm
        ? resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (resource.keywords && resource.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))) ||
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-2 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto my-8" />
        <p>Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <h1 className="font-headline text-3xl font-bold mb-8 text-primary">University Resources</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTitle className="font-headline">Error Loading Resources</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
        !error && ( // Only show "No Resources Found" if there isn't already an error message displayed
          <Alert className="mt-8">
            <Search className="h-4 w-4" />
            <AlertTitle className="font-headline">No Resources Found</AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or filters. If you've recently set up the database, ensure the 'resources' table is populated.
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}
