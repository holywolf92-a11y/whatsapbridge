import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Users, MapPin, CheckCircle, FileText, Eye, Download, Phone, Mail, Star, Link, Copy, Check } from 'lucide-react';
import { mockCandidates, Candidate } from '../lib/mockData';
import { generateProfileLink, generateCVShareLink, copyToClipboard } from '../lib/linkUtils';

interface FolderNode {
  id: string;
  name: string;
  type: 'profession' | 'smart-folder' | 'subfolder';
  icon: any;
  children?: FolderNode[];
  filter?: (candidates: Candidate[]) => Candidate[];
}

// Define the folder structure
const folderStructure: FolderNode[] = [
  {
    id: 'electricians',
    name: 'Electricians',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'electricians-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('electric'))
      },
      {
        id: 'electricians-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'electricians-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'electricians-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.country === 'Saudi Arabia'
            )
          },
          {
            id: 'electricians-qatar',
            name: 'Qatar',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.country === 'Qatar'
            )
          }
        ]
      },
      {
        id: 'electricians-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'electricians-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'electricians-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'electricians-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'electricians-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'electricians-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              c.passportAvailable
            )
          },
          {
            id: 'electricians-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('electric') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  {
    id: 'drivers',
    name: 'Drivers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'drivers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('driver'))
      },
      {
        id: 'drivers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'drivers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'drivers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'drivers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'drivers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'drivers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'drivers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'drivers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'drivers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.passportAvailable
            )
          },
          {
            id: 'drivers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  {
    id: 'plumbers',
    name: 'Plumbers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'plumbers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('plumb'))
      },
      {
        id: 'plumbers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'plumbers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'plumbers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'plumbers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'plumbers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'plumbers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'plumbers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'plumbers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'plumbers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              c.passportAvailable
            )
          },
          {
            id: 'plumbers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('plumb') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  {
    id: 'helpers',
    name: 'Helpers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'helpers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('helper'))
      },
      {
        id: 'helpers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'helpers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'helpers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'helpers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'helpers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'helpers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'helpers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'helpers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'helpers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              c.passportAvailable
            )
          },
          {
            id: 'helpers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('helper') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  }
];

export function CandidateBrowser() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['electricians']));
  const [selectedFolder, setSelectedFolder] = useState<FolderNode>(folderStructure[0].children![0]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const selectFolder = (folder: FolderNode) => {
    setSelectedFolder(folder);
    setSelectedCandidates(new Set());
  };

  const renderFolder = (folder: FolderNode, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder.id === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const Icon = folder.icon;

    const paddingLeft = level * 20 + 12;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors ${
            isSelected ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-700 font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (hasChildren && folder.type !== 'smart-folder') {
              toggleFolder(folder.id);
            } else {
              selectFolder(folder);
              if (hasChildren) {
                toggleFolder(folder.id);
              }
            }
          }}
        >
          {hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          
          {folder.type === 'profession' ? (
            isExpanded ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-blue-600" />
          ) : (
            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
          )}
          
          <span className={`text-sm ${folder.type === 'profession' ? 'font-semibold' : ''}`}>
            {folder.name}
          </span>

          {folder.filter && (
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {folder.filter(mockCandidates).length}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const displayedCandidates = selectedFolder.filter 
    ? selectedFolder.filter(mockCandidates) 
    : [];

  const toggleCandidateSelection = (id: string) => {
    const newSelected = new Set(selectedCandidates);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCandidates(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCandidates.size === displayedCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(displayedCandidates.map(c => c.id)));
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Sidebar - Folder Tree */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex-shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Candidate Browser
          </h2>
          <p className="text-xs text-blue-100 mt-1">Select a folder to view candidates</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {folderStructure.map(folder => renderFolder(folder))}
        </div>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Total Candidates:</span>
              <span className="font-semibold text-gray-900">{mockCandidates.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Showing:</span>
              <span className="font-semibold text-blue-600">{displayedCandidates.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Excel Table */}
      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedFolder.name}</h3>
              <p className="text-sm text-gray-600">{displayedCandidates.length} candidates</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCandidates.size > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedCandidates.size} selected
                </span>
              )}
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>

        {/* Excel-like Table */}
        <div className="flex-1 overflow-auto">
          {displayedCandidates.length > 0 ? (
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="border border-gray-300 p-2 text-left bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.size === displayedCandidates.length && displayedCandidates.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">ID</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Name</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Position</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Nationality</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Country</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Phone</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Email</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Experience</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Status</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">AI Score</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Applied</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Passport</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedCandidates.map((candidate, index) => (
                  <tr
                    key={candidate.id}
                    className={`hover:bg-blue-50 ${
                      selectedCandidates.has(candidate.id) ? 'bg-blue-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="border border-gray-300 p-2">
                      <input
                        type="checkbox"
                        checked={selectedCandidates.has(candidate.id)}
                        onChange={() => toggleCandidateSelection(candidate.id)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono text-gray-600">{candidate.id}</td>
                    <td className="border border-gray-300 p-2 text-sm font-medium text-gray-900">{candidate.name}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.position}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.nationality}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.country}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.phone}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.email}</td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700 text-center">{candidate.experience}y</td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        candidate.status === 'Applied' ? 'bg-blue-100 text-blue-700' :
                        candidate.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        candidate.status === 'Deployed' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {candidate.status}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2 text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{candidate.aiScore?.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.appliedDate}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {candidate.passportAvailable ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-red-600 text-xs">No</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex items-center gap-1 justify-center">
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          title="Call"
                        >
                          <Phone className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          title="Email"
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          title="Copy Profile Link"
                          onClick={async () => {
                            await copyToClipboard(generateProfileLink(candidate));
                            alert('Profile link copied!');
                          }}
                        >
                          <Link className="w-4 h-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-200 rounded" 
                          title="Copy CV Share Link"
                          onClick={async () => {
                            await copyToClipboard(generateCVShareLink(candidate));
                            alert('CV link copied!');
                          }}
                        >
                          <Copy className="w-4 h-4 text-purple-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No candidates in this folder</p>
                <p className="text-sm text-gray-400 mt-1">Try selecting a different folder</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}