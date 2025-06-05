
import type { Resource } from '@/lib/mock-data';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, BookOpen, FlaskConical, MonitorPlay, Video, Database } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
}

const typeIcons: Record<Resource['type'], React.ElementType> = {
  'Lecture Notes': FileText,
  'Textbook': BookOpen,
  'Research Paper': FileText,
  'Lab Equipment': FlaskConical,
  'Software License': MonitorPlay,
  'Video Lecture': Video,
};


export function ResourceCard({ resource }: ResourceCardProps) {
  const TypeIcon = typeIcons[resource.type] || Database;

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="aspect-[3/2] relative w-full mb-3">
          <Image
            src={resource.imageUrl}
            alt={resource.name}
            layout="fill"
            objectFit="cover"
            className="bg-muted"
            data-ai-hint={resource.dataAiHint}
          />
        </div>
        <CardTitle className="font-headline text-lg">{resource.name}</CardTitle>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <TypeIcon className="w-4 h-4 mr-1.5 shrink-0" />
          {resource.type} - {resource.course}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-foreground/80 line-clamp-3">{resource.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2 items-center justify-between text-xs">
        <Badge variant="secondary" className="font-normal">{resource.year}</Badge>
        {resource.size && <Badge variant="outline" className="font-normal">{resource.size}</Badge>}
      </CardFooter>
    </Card>
  );
}
