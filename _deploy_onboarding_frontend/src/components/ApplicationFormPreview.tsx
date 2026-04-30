import { X } from 'lucide-react';
import { PublicApplicationForm } from './PublicApplicationForm';

interface ApplicationFormPreviewProps {
  onClose: () => void;
}

export function ApplicationFormPreview({ onClose }: ApplicationFormPreviewProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen relative">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Close Preview"
        >
          <X className="w-6 h-6" />
        </button>
        <PublicApplicationForm />
      </div>
    </div>
  );
}
