import { AlertTriangle, User, Phone, Mail, FileText, Eye, Merge, XCircle, CheckCircle } from 'lucide-react';
import { Candidate } from '../lib/mockData';

interface DuplicateMatch {
  candidate: Candidate;
  matchType: 'exact' | 'similar';
  matchFields: string[];
  confidence: number;
}

interface DuplicateDetectorProps {
  newCandidate: {
    name: string;
    email: string;
    phone: string;
    passportNumber?: string;
  };
  existingCandidates: Candidate[];
  onCreateNew: () => void;
  onMerge: (existingId: string) => void;
  onCancel: () => void;
}

export function DuplicateDetector({
  newCandidate,
  existingCandidates,
  onCreateNew,
  onMerge,
  onCancel
}: DuplicateDetectorProps) {
  
  // Find potential duplicates
  const findDuplicates = (): DuplicateMatch[] => {
    const matches: DuplicateMatch[] = [];
    
    existingCandidates.forEach(candidate => {
      const matchFields: string[] = [];
      let matchType: 'exact' | 'similar' = 'similar';
      let confidence = 0;
      
      // Check exact email match
      if (newCandidate.email && candidate.email.toLowerCase() === newCandidate.email.toLowerCase()) {
        matchFields.push('Email');
        confidence += 40;
        matchType = 'exact';
      }
      
      // Check exact phone match
      const cleanPhone = (phone: string) => phone.replace(/[^0-9]/g, '');
      if (newCandidate.phone && cleanPhone(candidate.phone) === cleanPhone(newCandidate.phone)) {
        matchFields.push('Phone');
        confidence += 35;
        matchType = 'exact';
      }
      
      // Check passport number match
      if (newCandidate.passportNumber && candidate.cvUrl?.includes(newCandidate.passportNumber)) {
        matchFields.push('Passport Number');
        confidence += 30;
        matchType = 'exact';
      }
      
      // Check name similarity
      const nameSimilarity = calculateNameSimilarity(newCandidate.name, candidate.name);
      if (nameSimilarity > 0.8) {
        matchFields.push('Name');
        confidence += nameSimilarity * 25;
      }
      
      // If we have any matches, add to results
      if (matchFields.length > 0) {
        matches.push({
          candidate,
          matchType,
          matchFields,
          confidence: Math.min(confidence, 100)
        });
      }
    });
    
    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  };
  
  const duplicates = findDuplicates();
  const hasExactMatch = duplicates.some(d => d.matchType === 'exact');
  
  if (duplicates.length === 0) {
    // No duplicates, auto-proceed
    onCreateNew();
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Potential Duplicate Detected
              </h2>
              <p className="text-gray-700">
                Found <strong>{duplicates.length}</strong> existing candidate{duplicates.length > 1 ? 's' : ''} that may match this new CV.
                {hasExactMatch && (
                  <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                    Exact Match Found
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* New Candidate Info */}
        <div className="p-6 border-b border-gray-200 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            New CV Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 block mb-1">Name</span>
              <span className="font-medium text-gray-900">{newCandidate.name}</span>
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Email</span>
              <span className="font-medium text-gray-900">{newCandidate.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Phone</span>
              <span className="font-medium text-gray-900">{newCandidate.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Passport</span>
              <span className="font-medium text-gray-900">{newCandidate.passportNumber || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {/* Duplicate Matches */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Existing Candidates</h3>
          <div className="space-y-4">
            {duplicates.map((match) => (
              <div
                key={match.candidate.id}
                className={`border-2 rounded-lg p-4 ${
                  match.matchType === 'exact' ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {match.candidate.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{match.candidate.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          match.matchType === 'exact' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {match.matchType === 'exact' ? 'Exact Match' : 'Similar'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {match.candidate.position} • {match.candidate.nationality}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <Mail className="w-3 h-3" />
                          {match.candidate.email}
                        </div>
                        <div className="flex items-center gap-1 text-gray-700">
                          <Phone className="w-3 h-3" />
                          {match.candidate.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{Math.round(match.confidence)}%</div>
                    <div className="text-xs text-gray-600">Match</div>
                  </div>
                </div>
                
                {/* Match Details */}
                <div className="bg-white rounded p-3 mb-3">
                  <div className="text-xs font-medium text-gray-600 mb-2">Matching Fields:</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {match.matchFields.map((field) => (
                      <span
                        key={field}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Candidate Details */}
                <div className="grid grid-cols-3 gap-3 text-xs bg-white rounded p-3 mb-3">
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded font-medium ${
                      match.candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                      match.candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      match.candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {match.candidate.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Applied:</span>
                    <span className="ml-2 font-medium text-gray-900">{match.candidate.appliedDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Source:</span>
                    <span className="ml-2 font-medium text-gray-900">{match.candidate.source}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onMerge(match.candidate.id)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Merge className="w-4 h-4" />
                    Update Existing Profile
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    View Full Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasExactMatch ? (
                <strong className="text-red-600">⚠️ Exact match found - updating existing profile is recommended</strong>
              ) : (
                'Similar candidates found - review before proceeding'
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={onCreateNew}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Create New Anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple name similarity calculation (Levenshtein distance based)
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();
  
  if (n1 === n2) return 1.0;
  
  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  
  return 1 - (distance / maxLength);
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}
