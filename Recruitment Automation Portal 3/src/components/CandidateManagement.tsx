import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Download, Upload, Phone, Mail, MapPin, Briefcase, Calendar, Star, Eye, Send, Edit, User, Globe, CheckCircle, FileText, Camera, Award, Shield, MessageSquare, XCircle, AlertTriangle, Sparkles, Grid, List, MoreHorizontal, File, Image as ImageIcon, Link2, Copy } from 'lucide-react';
import { CandidateDetailsModal } from './CandidateDetailsModal';
import { CVGenerator } from './CVGenerator';
import { BulkCVGenerator } from './BulkCVGenerator';
import { EmployerSafeCV } from './EmployerSafeCV';
import { ShareLinksModal } from './ShareLinksModal';
import { mockCandidates, Candidate } from '../lib/mockData';
import { generateProfileLink, copyToClipboard } from '../lib/linkUtils';

// Helper function to get document counts for a candidate
const getDocumentStats = (candidateId: string) => {
  const allDocs: Record<string, any[]> = {
    '1': [
      { category: 'CV', status: 'verified' },
      { category: 'Passport', status: 'verified' },
      { category: 'Certificate', status: 'verified' }
    ],
    'AUTO-001': [
      { category: 'CV', status: 'verified' }
    ],
    '2': [
      { category: 'Medical', status: 'expired' }
    ],
    'AUTO-002': [
      { category: 'CV', status: 'pending' }
    ],
    '3': [
      { category: 'Photo', status: 'verified' }
    ]
  };
  
  const docs = allDocs[candidateId] || [];
  return {
    total: docs.length,
    cv: docs.filter(d => d.category === 'CV').length > 0,
    passport: docs.filter(d => d.category === 'Passport').length > 0,
    certificate: docs.filter(d => d.category === 'Certificate').length > 0,
    photo: docs.filter(d => d.category === 'Photo').length > 0,
    medical: docs.filter(d => d.category === 'Medical').length > 0,
    hasExpired: docs.some(d => d.status === 'expired')
  };
};

interface CandidateManagementProps {
  initialProfessionFilter?: string;
}

export function CandidateManagement({ initialProfessionFilter = 'all' }: CandidateManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [professionFilter, setProfessionFilter] = useState<string>(initialProfessionFilter);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [cvCandidate, setCvCandidate] = useState<Candidate | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showBulkCV, setShowBulkCV] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [employerCVCandidate, setEmployerCVCandidate] = useState<Candidate | null>(null);
  const [shareLinksCandidate, setShareLinksCandidate] = useState<Candidate | null>(null);

  // Update profession filter when prop changes
  useEffect(() => {
    setProfessionFilter(initialProfessionFilter);
  }, [initialProfessionFilter]);

  const filteredCandidates = mockCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter;
    const matchesCountry = countryFilter === 'all' || candidate.country === countryFilter;
    const matchesProfession = professionFilter === 'all' || candidate.position === professionFilter;
    return matchesSearch && matchesStatus && matchesCountry && matchesProfession;
  });

  const countries = Array.from(new Set(mockCandidates.map(c => c.country)));
  const professions = Array.from(new Set(mockCandidates.map(c => c.position))).sort();

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl">Candidates</h1>
            <p className="text-gray-600 mt-1">Manage your candidate pipeline</p>
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" />
            Add New Candidate
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90">Total Candidates</div>
            <div className="text-3xl mt-2">{mockCandidates.length}</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90">Total Professions</div>
            <div className="text-3xl mt-2">{professions.length}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90">Pending Review</div>
            <div className="text-3xl mt-2">{mockCandidates.filter(c => c.status === 'Pending').length}</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90">Deployed</div>
            <div className="text-3xl mt-2">{mockCandidates.filter(c => c.status === 'Deployed').length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="text-sm opacity-90">New This Week</div>
            <div className="text-3xl mt-2">{mockCandidates.filter(c => c.status === 'Applied').length}</div>
          </div>
        </div>

        {/* Profession Stats */}
        {professionFilter !== 'all' && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Selected Profession</p>
                  <p className="text-xl font-bold text-indigo-900">{professionFilter}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-900">{filteredCandidates.length}</div>
                  <div className="text-xs text-gray-600">Candidates</div>
                </div>
                <button
                  onClick={() => setProfessionFilter('all')}
                  className="px-4 py-2 bg-white border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Country Filter - First */}
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          
          {/* Status Filter - Second */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Pending">Pending</option>
            <option value="Deployed">Deployed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Search Bar - Third, takes 2 columns */}
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidates by name, position, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* View Toggle - Last */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Grid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedCandidates.size > 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedCandidates.size} candidate{selectedCandidates.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedCandidates(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkCV(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                Generate CVs
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                <Send className="w-4 h-4" />
                Send Email
              </button>
              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            Showing <strong>{filteredCandidates.length}</strong> of <strong>{mockCandidates.length}</strong> candidates
          </p>
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {selectedCandidates.size === filteredCandidates.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Candidates Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`bg-white rounded-xl border-2 transition-all hover:shadow-2xl ${
                selectedCandidates.has(candidate.id) ? 'border-blue-500 shadow-lg' : 'border-gray-200'
              }`}
            >
              {/* Card Header with Profile Picture */}
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 h-32 rounded-t-xl">
                <div className="absolute -bottom-16 left-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl">
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600">
                        {candidate.name[0]}
                      </div>
                    </div>
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={() => toggleSelection(candidate.id)}
                    className="w-6 h-6 text-blue-600 rounded cursor-pointer bg-white border-2 border-white shadow-lg"
                  />
                </div>
              </div>

              {/* Card Content */}
              <div className="pt-20 p-6">
                {/* Name and Title */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-semibold text-gray-900">{candidate.name}</h3>
                    {candidate.autoExtracted && candidate.needsReview && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Review
                      </span>
                    )}
                    {candidate.autoExtracted && !candidate.needsReview && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Auto
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="w-5 h-5" />
                    <span className="text-lg">{candidate.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">{candidate.nationality}</span>
                    <span className="text-gray-400">→</span>
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium text-blue-600">{candidate.country}</span>
                  </div>
                </div>

                {/* Status and Score Row */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 ${
                    candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                    candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {candidate.status}
                  </span>
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-gray-900">{candidate.aiScore?.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">/10</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium">{candidate.experience}y exp</span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="text-gray-900 font-medium truncate">{candidate.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-gray-900 font-medium truncate">{candidate.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Applied Date</div>
                      <div className="text-gray-900 font-medium">{candidate.appliedDate}</div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Top Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 4).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 4 && (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        +{candidate.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Documents - Smart Display */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Documents</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        getDocumentStats(candidate.id).total === 0 ? 'bg-red-100 text-red-700' :
                        getDocumentStats(candidate.id).hasExpired ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {getDocumentStats(candidate.id).total} files
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2">
                    {/* CV */}
                    <div className={`relative group cursor-pointer ${
                      getDocumentStats(candidate.id).cv ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
                      <FileText className={`w-5 h-5 mb-1 ${
                        getDocumentStats(candidate.id).cv ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">CV</span>
                      {getDocumentStats(candidate.id).cv && (
                        <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1" />
                      )}
                      {!getDocumentStats(candidate.id).cv && (
                        <XCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
                      )}
                    </div>

                    {/* Passport */}
                    <div className={`relative group cursor-pointer ${
                      getDocumentStats(candidate.id).passport ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
                      <File className={`w-5 h-5 mb-1 ${
                        getDocumentStats(candidate.id).passport ? 'text-purple-600' : 'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">Passport</span>
                      {getDocumentStats(candidate.id).passport && (
                        <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1" />
                      )}
                      {!getDocumentStats(candidate.id).passport && (
                        <XCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
                      )}
                    </div>

                    {/* Certificate */}
                    <div className={`relative group cursor-pointer ${
                      getDocumentStats(candidate.id).certificate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
                      <Award className={`w-5 h-5 mb-1 ${
                        getDocumentStats(candidate.id).certificate ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">Cert</span>
                      {getDocumentStats(candidate.id).certificate && (
                        <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1" />
                      )}
                      {!getDocumentStats(candidate.id).certificate && (
                        <XCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
                      )}
                    </div>

                    {/* Photo */}
                    <div className={`relative group cursor-pointer ${
                      getDocumentStats(candidate.id).photo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
                      <ImageIcon className={`w-5 h-5 mb-1 ${
                        getDocumentStats(candidate.id).photo ? 'text-pink-600' : 'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">Photo</span>
                      {getDocumentStats(candidate.id).photo && (
                        <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1" />
                      )}
                      {!getDocumentStats(candidate.id).photo && (
                        <XCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
                      )}
                    </div>

                    {/* Medical */}
                    <div className={`relative group cursor-pointer ${
                      getDocumentStats(candidate.id).medical ? 
                        getDocumentStats(candidate.id).hasExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    } border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all hover:shadow-md`}>
                      <File className={`w-5 h-5 mb-1 ${
                        getDocumentStats(candidate.id).medical ? 
                          getDocumentStats(candidate.id).hasExpired ? 'text-red-600' : 'text-green-600' 
                          : 'text-gray-400'
                      }`} />
                      <span className="text-xs font-medium text-gray-700">Medical</span>
                      {getDocumentStats(candidate.id).medical && (
                        getDocumentStats(candidate.id).hasExpired ? (
                          <AlertTriangle className="w-3 h-3 text-red-600 absolute top-1 right-1" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-green-600 absolute top-1 right-1" />
                        )
                      )}
                      {!getDocumentStats(candidate.id).medical && (
                        <XCircle className="w-3 h-3 text-red-400 absolute top-1 right-1" />
                      )}
                    </div>
                  </div>

                  {/* Document Status Message */}
                  {getDocumentStats(candidate.id).total === 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      No documents uploaded yet
                    </div>
                  )}
                  {getDocumentStats(candidate.id).hasExpired && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      Some documents have expired
                    </div>
                  )}
                  {getDocumentStats(candidate.id).total > 0 && !getDocumentStats(candidate.id).hasExpired && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-3 h-3" />
                      All documents are valid
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Source</div>
                    <div className="text-sm font-medium text-gray-900">{candidate.source}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Passport</div>
                    <div className="flex items-center gap-1">
                      {candidate.passportAvailable ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Available</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-700">Not Available</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedCandidate(candidate)}
                      className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                    >
                      <Eye className="w-5 h-5" />
                      View Full Profile
                    </button>
                    <button
                      onClick={() => setEmployerCVCandidate(candidate)}
                      className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl"
                    >
                      <Shield className="w-5 h-5" />
                      Employer CV
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    <button className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-sm">
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden xl:inline">WhatsApp</span>
                    </button>
                    <button className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="hidden xl:inline">Email</span>
                    </button>
                    <button 
                      onClick={() => setShareLinksCandidate(candidate)}
                      className="px-3 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium border border-purple-200"
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="hidden xl:inline">Share</span>
                    </button>
                    <button className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-sm">
                      <Edit className="w-4 h-4" />
                      <span className="hidden xl:inline">Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Candidate
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Country of Interest
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    AI Score
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-600">
                    Quick Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className={`hover:bg-gray-50 ${selectedCandidates.has(candidate.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => toggleSelection(candidate.id)}
                        className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {candidate.name[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{candidate.name}</p>
                          <p className="text-sm text-gray-500">{candidate.nationality}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{candidate.position}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{candidate.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{candidate.experience} years</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                        candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-semibold">{candidate.aiScore?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => setCvCandidate(candidate)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                        >
                          <Shield className="w-4 h-4" />
                          CV
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredCandidates.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedCandidate && (
        <CandidateDetailsModal
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      {cvCandidate && (
        <CVGenerator
          candidate={cvCandidate}
          onClose={() => setCvCandidate(null)}
        />
      )}

      {showBulkCV && (
        <BulkCVGenerator
          candidates={Array.from(selectedCandidates).map(id => mockCandidates.find(c => c.id === id) as Candidate)}
          onClose={() => setShowBulkCV(false)}
        />
      )}

      {employerCVCandidate && (
        <EmployerSafeCV
          candidate={employerCVCandidate}
          onClose={() => setEmployerCVCandidate(null)}
        />
      )}

      {shareLinksCandidate && (
        <ShareLinksModal
          candidate={shareLinksCandidate}
          onClose={() => setShareLinksCandidate(null)}
        />
      )}
    </div>
  );
}