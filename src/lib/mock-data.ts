
export interface Resource {
  id: string;
  name: string;
  type: 'Lecture Notes' | 'Textbook' | 'Research Paper' | 'Lab Equipment' | 'Software License' | 'Video Lecture';
  course: string;
  year: number;
  size?: string; // e.g., "2.5 MB", "N/A"
  description: string;
  imageUrl: string;
  keywords: string[]; // For searching
  dataAiHint: string;
}

export const mockResources: Resource[] = [
  {
    id: '1',
    name: 'Introduction to Quantum Physics Notes',
    type: 'Lecture Notes',
    course: 'PHY301',
    year: 2023,
    size: '1.2 MB',
    description: 'Comprehensive lecture notes covering the fundamentals of quantum physics.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'physics classroom',
    keywords: ['quantum', 'physics', 'notes', 'PHY301'],
  },
  {
    id: '2',
    name: 'Advanced Calculus Textbook',
    type: 'Textbook',
    course: 'MTH205',
    year: 2022,
    description: 'In-depth textbook for advanced calculus students, includes exercises and solutions.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'math textbook',
    keywords: ['calculus', 'math', 'textbook', 'MTH205'],
  },
  {
    id: '3',
    name: 'AI in Drug Discovery',
    type: 'Research Paper',
    course: 'CSC550',
    year: 2024,
    size: '850 KB',
    description: 'A peer-reviewed paper on the latest advancements in AI for pharmaceutical research.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'science research',
    keywords: ['ai', 'drug discovery', 'research', 'CSC550'],
  },
  {
    id: '4',
    name: 'Spectrophotometer XYZ Model',
    type: 'Lab Equipment',
    course: 'CHM410',
    year: 2021,
    description: 'High-precision spectrophotometer available for chemistry lab experiments.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'lab equipment',
    keywords: ['spectrophotometer', 'chemistry', 'lab', 'CHM410'],
  },
  {
    id: '5',
    name: 'CADMaster Pro License',
    type: 'Software License',
    course: 'ENG102',
    year: 2024,
    description: 'University-wide license for CADMaster Pro design software.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'software interface',
    keywords: ['cad', 'software', 'license', 'ENG102'],
  },
  {
    id: '6',
    name: 'Organic Chemistry Video Lectures',
    type: 'Video Lecture',
    course: 'CHM201',
    year: 2023,
    size: 'Series (Multiple GBs)',
    description: 'A series of video lectures covering all topics in Organic Chemistry CHM201.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'online lecture',
    keywords: ['organic chemistry', 'video', 'lecture', 'CHM201'],
  },
   {
    id: '7',
    name: 'Linear Algebra Problem Set',
    type: 'Lecture Notes',
    course: 'MTH101',
    year: 2024,
    size: '500 KB',
    description: 'A collection of challenging problems for Linear Algebra with detailed solutions.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'math problems',
    keywords: ['linear algebra', 'math', 'problems', 'MTH101'],
  },
  {
    id: '8',
    name: 'Robotics Design Handbook',
    type: 'Textbook',
    course: 'ROB400',
    year: 2022,
    description: 'Comprehensive guide to designing and building robots.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'robotics design',
    keywords: ['robotics', 'handbook', 'design', 'ROB400'],
  },
  {
    id: '9',
    name: 'Sustainable Energy Solutions',
    type: 'Research Paper',
    course: 'ENV500',
    year: 2023,
    size: '1.1 MB',
    description: 'Research on innovative sustainable energy technologies and policies.',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'renewable energy',
    keywords: ['sustainability', 'energy', 'research', 'ENV500'],
  },
];
