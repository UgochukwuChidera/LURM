
import { UploadResourceClientPage } from '@/components/admin/upload-resource-client-page';
// import { પ્રકાર Metadata } from 'next';
import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'Upload New Resource - Admin',
  description: 'Add a new resource to the Landmark University Resource Hub.',
};

export default function UploadResourcePage() {
  return <UploadResourceClientPage />;
}
