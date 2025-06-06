
export interface Resource {
  id: string;
  name: string;
  type: 'Lecture Notes' | 'Textbook' | 'Research Paper' | 'Lab Equipment' | 'Software License' | 'Video Lecture' | 'Other'; // Added 'Other'
  course: string;
  year: number;
  description: string;
  keywords: string[];
  // Fields for uploaded file
  fileUrl?: string; // URL from Supabase Storage
  fileName?: string; // Original name of the uploaded file
  fileMimeType?: string; // MIME type of the file
  fileSizeBytes?: number; // Size of the file in bytes

  // Timestamps and uploader (assuming these are in your DB schema based on previous SQL)
  created_at?: string;
  updated_at?: string;
  uploader_id?: string;
}

// Mock data needs to be updated to reflect the new structure if you're still using it for initial testing.
// For brevity, I'm omitting the full mockResources update here, but you'd remove imageUrl/dataAiHint
// and potentially add fileUrl, fileName, etc. for some mock items.
export const mockResources: Resource[] = [
  {
    id: '1',
    name: 'Introduction to Quantum Physics Notes',
    type: 'Lecture Notes',
    course: 'PHY301',
    year: 2023,
    description: 'Comprehensive lecture notes covering the fundamentals of quantum physics.',
    keywords: ['quantum', 'physics', 'notes', 'PHY301'],
    fileName: 'PHY301_Quantum_Intro.pdf',
    fileMimeType: 'application/pdf',
    fileSizeBytes: 1200000, // 1.2 MB
    fileUrl: 'https://placehold.co/downloadable/PHY301_Quantum_Intro.pdf' // Placeholder
  },
  {
    id: '2',
    name: 'Advanced Calculus Textbook (Digital Copy)',
    type: 'Textbook',
    course: 'MTH205',
    year: 2022,
    description: 'In-depth textbook for advanced calculus students, includes exercises and solutions.',
    keywords: ['calculus', 'math', 'textbook', 'MTH205'],
    fileName: 'AdvCalc_Textbook.epub',
    fileMimeType: 'application/epub+zip',
    fileSizeBytes: 5500000,
    fileUrl: 'https://placehold.co/downloadable/AdvCalc_Textbook.epub' // Placeholder
  },
  {
    id: '4',
    name: 'Spectrophotometer XYZ Model Manual', // Changed to reflect a file
    type: 'Lab Equipment', // Type remains, but now associated with a manual perhaps
    course: 'CHM410',
    year: 2021,
    description: 'User manual for the High-precision spectrophotometer available for chemistry lab experiments.',
    keywords: ['spectrophotometer', 'chemistry', 'lab', 'CHM410', 'manual'],
    fileName: 'SpectroXYZ_Manual.pdf',
    fileMimeType: 'application/pdf',
    fileSizeBytes: 850000
  },
  // ... other resources, ensure they follow the new structure
];
