import { useEffect, useState, useRef } from 'react';
import { apiClient, Candidate } from '../lib/apiClient';
import { 
  User, Briefcase, Calendar, FileText, 
  Globe, Download, Star, CheckCircle, XCircle, Loader,
  ArrowLeft, Share2, Copy, Shield, Award, MapPin, Languages
} from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  category: string;
  verification_status: string;
  document_type?: string;
  detected_category?: string;
}

export function PublicCandidateProfile() {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const employerCVRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Extract candidate ID from URL path: /profile/:id/:slug
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    console.log('[PublicCandidateProfile] Current path:', currentPath);
    
    const pathMatch = currentPath.match(/^\/profile\/([^\/]+)/);
    console.log('[PublicCandidateProfile] Path match:', pathMatch);
    
    const candidateId = pathMatch ? pathMatch[1] : null;
    console.log('[PublicCandidateProfile] Extracted candidate ID:', candidateId);

    if (!candidateId) {
      console.error('[PublicCandidateProfile] No candidate ID found in URL');
      setError('Invalid candidate ID in URL');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[PublicCandidateProfile] Fetching candidate:', candidateId);
        const data = await apiClient.getCandidate(candidateId);
        console.log('[PublicCandidateProfile] Candidate loaded:', data?.name);
        setCandidate(data);
        setError(null);

        // Fetch verified/approved documents
        setLoadingDocuments(true);
        try {
          const docs = await apiClient.listCandidateDocumentsNew(candidateId);
          console.log('[PublicCandidateProfile] All documents:', docs);
          // Filter only verified/approved documents AND exclude CV/resume documents
          // (CV should only be accessible via Employer-Safe CV download, not original CV)
          const verifiedDocs = docs.filter((doc: any) => {
            const isVerified = doc.verification_status === 'verified' || doc.verification_status === 'approved';
            if (!isVerified) return false;
            
            // Exclude CV/resume documents - these are classified and should not be downloadable
            const category = (doc.category || '').toLowerCase();
            const detectedCategory = (doc.detected_category || '').toLowerCase();
            const docType = (doc.document_type || '').toLowerCase();
            const fileName = (doc.file_name || '').toLowerCase();
            
            // IMPORTANT RULE: never show original CV on public profile link.
            // (Employer-safe CV is downloaded via separate button.)
            const isCV =
              category === 'cv_resume' ||
              category === 'cv' ||
              category === 'resume' ||
              detectedCategory === 'cv_resume' ||
              detectedCategory === 'cv' ||
              detectedCategory === 'resume' ||
              docType === 'cv' ||
              docType === 'resume' ||
              fileName.includes('cv') ||
              fileName.includes('resume');
            
            return !isCV; // Only include non-CV documents
          });
          console.log('[PublicCandidateProfile] Verified documents (excluding CV):', verifiedDocs);
          setDocuments(verifiedDocs);
          console.log('[PublicCandidateProfile] Documents loaded:', verifiedDocs.length);
        } catch (docError: any) {
          console.error('[PublicCandidateProfile] Failed to load documents:', docError);
          // Don't fail the whole page if documents fail
          setDocuments([]);
        } finally {
          setLoadingDocuments(false);
        }
      } catch (err: any) {
        console.error('[PublicCandidateProfile] Failed to load candidate:', err);
        if (err?.message?.includes('404') || err?.message?.includes('not found') || err?.message?.includes('PGRST116')) {
          setError('This candidate profile is not available or has been removed.');
        } else {
          setError(err?.message || 'Failed to load candidate profile. Please check the link and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyProfileLink = async () => {
    if (candidate && window.location.href) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Profile link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const handleDownloadCV = async () => {
    console.log('[PublicCandidateProfile] handleDownloadCV called - NEW SYSTEM');
    if (!candidate) {
      toast.error('Candidate information not available.');
      return;
    }
    
    try {
      setDownloadingCV(true);
      console.log('[PublicCandidateProfile] Calling backend CV generation API...');
      
      // Use backend CV generation service (cache enabled for performance)
      const result = await apiClient.generateCandidateCV(candidate.id, 'employer-safe', true);
      console.log('[PublicCandidateProfile] CV generation result:', result);
      
      if (result.cached) {
        toast.success('Downloading cached CV...');
      } else {
        toast.success('CV generated successfully! Downloading...');
      }
      
      // Download PDF from signed URL
      const response = await fetch(result.cv_url);
      if (!response.ok) {
        throw new Error(`Failed to download CV: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate.name || 'Candidate'}_Employer_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Employer CV downloaded successfully!');
    } catch (err: any) {
      console.error('[PublicCandidateProfile] Failed to download Employer CV:', err);
      
      // Provide specific error messages
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        toast.error('CV not found. Please ensure candidate information is complete.');
      } else if (err?.message?.includes('timeout') || err?.message?.includes('time')) {
        toast.error('CV generation timed out. Please try again.');
      } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(err?.message || 'Failed to download Employer CV. Please try again.');
      }
    } finally {
      setDownloadingCV(false);
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const result = await apiClient.getCandidateDocumentDownload(documentId);
      
      // Download the file
      const response = await fetch(result.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Document downloaded successfully!');
    } catch (err: any) {
      console.error('Failed to download document:', err);
      toast.error(err?.message || 'Failed to download document. Please try again.');
    }
  };

  const handleDownloadAll = async () => {
    if (documents.length === 0) {
      toast.error('No documents available to download');
      return;
    }

    try {
      setDownloadingAll(true);
      
      // Dynamic import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Download all documents and add to ZIP
      const downloadPromises = documents.map(async (doc) => {
        try {
          const result = await apiClient.getCandidateDocumentDownload(doc.id);
          const response = await fetch(result.download_url);
          const blob = await response.blob();
          zip.file(doc.file_name || `document_${doc.id}`, blob);
        } catch (err) {
          console.error(`Failed to download document ${doc.id}:`, err);
          // Continue with other documents even if one fails
        }
      });

      await Promise.all(downloadPromises);

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidate?.name || 'candidate'}_documents.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('All documents downloaded as ZIP!');
    } catch (err: any) {
      console.error('Failed to download all documents:', err);
      toast.error(err?.message || 'Failed to create ZIP file. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  };

  // Helper to parse skills string to array
  const parseSkills = (skills?: string): string[] => {
    if (!skills) return [];
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // If not JSON, split by comma or semicolon
      return skills.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg font-medium">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 max-w-md w-full text-center border-4 border-red-200">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The candidate profile you are looking for does not exist.'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </a>
        </div>
      </div>
    );
  }

  const profileLink = window.location.href;
  const skillsArray = parseSkills(candidate.skills);
  
  // Check if CV is available in documents
  const cvDocument = documents.find((doc) => 
    doc.category?.toLowerCase() === 'cv' || 
    doc.document_type?.toLowerCase() === 'cv' ||
    doc.category?.toLowerCase() === 'resume' ||
    doc.document_type?.toLowerCase() === 'resume'
  );
  const hasCV = !!cvDocument || candidate.cv_received;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header - Colorful */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 overflow-hidden">
                {candidate.profile_photo_signed_url ? (
                  <img 
                    src={candidate.profile_photo_signed_url} 
                    alt={candidate.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{candidate.name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{candidate.name || 'Candidate'}</h1>
                <p className="text-xs sm:text-sm text-blue-100 truncate">{candidate.candidate_code || 'No Code'}</p>
              </div>
            </div>
            <button
              onClick={copyProfileLink}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-semibold shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Colorful */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Employer CV Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Employer-Safe CV Section */}
            <div ref={employerCVRef} className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {/* CV Header Section - Colorful */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b-4 border-blue-600">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Employer-Safe CV</h2>
                    <p className="text-sm text-gray-600">Contact information protected</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadCV}
                  disabled={downloadingCV}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  <span>{downloadingCV ? 'Generating PDF...' : 'Download Employer CV'}</span>
                </button>
              </div>

              {/* Colorful CV Header */}
              <div className="text-center mb-8 pb-8 border-b-4 border-blue-600">
                <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl relative overflow-hidden">
                  {candidate.profile_photo_signed_url ? (
                    <img 
                      src={candidate.profile_photo_signed_url} 
                      alt={candidate.name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold">{candidate.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{candidate.name || 'Candidate'}</h1>
                <p className="text-xl text-gray-600 mb-4">{candidate.position || 'Professional'}</p>
                
                {/* Info badges - colorful */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {candidate.nationality && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border-2 border-blue-200">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{candidate.nationality}</span>
                    </div>
                  )}
                  {candidate.country_of_interest && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border-2 border-purple-200">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Seeking: {candidate.country_of_interest}</span>
                    </div>
                  )}
                  {candidate.experience_years && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full border-2 border-green-200">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{candidate.experience_years} Years Experience</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Colorful Contact Protection Notice */}
              <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-1">Contact Information Protected</h3>
                    <p className="text-sm text-yellow-800 mb-3">
                      For privacy and security, direct contact details have been removed from this CV. 
                      To connect with this candidate, please contact Falisha Manpower recruitment team.
                    </p>
                    <div className="p-3 bg-white rounded border border-yellow-300">
                      <p className="text-sm font-semibold text-gray-900">📧 Contact via Recruitment Agency:</p>
                      <p className="text-sm text-gray-700 mt-1">Email: support@falishajobs.com</p>
                      <p className="text-sm text-gray-700">Phone: +923303333335</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colorful Stats Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                  Professional Summary
                </h2>
                
                {/* Colorful Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {candidate.experience_years && (
                    <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">Experience</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{candidate.experience_years} Years</p>
                    </div>
                  )}
                  
                  {candidate.ai_score != null && typeof candidate.ai_score === 'number' && (
                    <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">AI Match Score</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">{candidate.ai_score.toFixed(1)}/10</p>
                    </div>
                  )}
                </div>
                
                {/* Professional Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
                  {candidate.professional_summary ? (
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{candidate.professional_summary}</p>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      Highly skilled <strong>{candidate.position || 'professional'}</strong> with <strong>{candidate.experience_years || 'extensive'}</strong> years of professional experience.
                      {skillsArray.length > 0 && ` Demonstrates strong expertise in ${skillsArray.slice(0, 3).join(', ')}, and more.`}
                      {candidate.country_of_interest && ` Seeking opportunities in ${candidate.country_of_interest} to contribute technical expertise and drive operational excellence.`}
                    </p>
                  )}
                </div>
              </div>

              {/* Colorful Skills Section */}
              {skillsArray.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" />
                    Core Skills & Competencies
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {skillsArray.map((skill, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 text-gray-800 font-medium text-center hover:shadow-md transition-shadow"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colorful Experience Section */}
              {candidate.position && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    Professional Experience
                  </h2>
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-600 pl-6 bg-gradient-to-r from-blue-50 to-transparent p-5 rounded-r-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{candidate.position}</h3>
                          <p className="text-gray-600">Various Companies</p>
                        </div>
                        {candidate.experience_years && (
                          <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium text-sm shadow-md">
                            {candidate.experience_years} years
                          </span>
                        )}
                      </div>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 mt-4">
                        {[
                          `Executed complex ${candidate.position.toLowerCase()} projects with high precision and quality`,
                          'Collaborated with cross-functional teams to deliver optimal solutions',
                          'Maintained strict adherence to safety protocols and industry standards',
                          `Demonstrated expertise in ${skillsArray.slice(0, 2).join(' and ')}`,
                          'Consistently exceeded performance targets and quality benchmarks'
                        ].map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Colorful Info Cards */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Additional Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {candidate.nationality && (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Nationality</span>
                      </div>
                      <p className="text-gray-700">{candidate.nationality}</p>
                    </div>
                  )}
                  {candidate.country_of_interest && (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Preferred Location</span>
                      </div>
                      <p className="text-gray-700">{candidate.country_of_interest}</p>
                    </div>
                  )}
                  {candidate.passport_received && (
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">Passport Status</span>
                      </div>
                      <p className="font-medium text-green-600">Available & Valid</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">Availability</span>
                    </div>
                    <p className="text-gray-700">Immediate</p>
                  </div>
                </div>
              </div>

              {/* Colorful Languages Section */}
              {candidate.languages && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-600 flex items-center gap-2">
                    <Languages className="w-6 h-6 text-blue-600" />
                    Languages
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-blue-200">
                    <p className="text-gray-700 leading-relaxed">{candidate.languages}</p>
                  </div>
                </div>
              )}

              {/* Colorful Footer Notice */}
              <div className="mt-12 pt-6 border-t-2 border-gray-300">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Protected by Falisha Manpower</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        This is an employer-safe CV generated by Falisha Manpower recruitment system. 
                        Contact information has been protected to prevent unauthorized direct contact and ensure 
                        proper recruitment procedures are followed.
                      </p>
                      <div className="mt-3 text-sm text-gray-600">
                        <p><strong>For more information or to arrange interviews:</strong></p>
                        <p>Contact Falisha Manpower at recruitment@falisha.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Status & Documents - Colorful */}
          <div className="space-y-6">
            {/* Status Card - Colorful */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <span>Status</span>
              </h2>
              <div className="space-y-3">
                {candidate.status && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">Application Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium ${
                        candidate.status === 'Applied' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        candidate.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        candidate.status === 'Deployed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {candidate.status}
                      </span>
                    </div>
                  </div>
                )}
                {candidate.ai_score != null && typeof candidate.ai_score === 'number' && (
                  <div>
                    <label className="text-xs font-medium text-gray-500">AI Score</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-gray-900 font-medium text-sm">{candidate.ai_score.toFixed(1)}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section - Colorful */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <span>Verified Documents</span>
                </h2>
                {documents.length > 0 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={downloadingAll}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingAll ? 'Creating ZIP...' : 'Download All'}
                  </button>
                )}
              </div>
              
              {loadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No verified documents available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {doc.file_name || `Document ${doc.category}`}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {doc.category || doc.document_type || 'Document'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadDocument(doc.id, doc.file_name || `document_${doc.id}`)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share Link - Colorful */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border-2 border-purple-200 shadow-lg">
              <p className="text-sm font-bold text-purple-900 mb-3">Share this profile</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={profileLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border-2 border-purple-200 rounded-lg text-sm text-gray-700 min-w-0 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={copyProfileLink}
                  className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0 shadow-md"
                  title="Copy link"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
