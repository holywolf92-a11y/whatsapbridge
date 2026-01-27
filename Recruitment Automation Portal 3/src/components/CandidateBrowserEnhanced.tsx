import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Users, MapPin, CheckCircle, FileText, Eye, Download, Phone, Mail, Star, Link, Copy, ExternalLink, Play, Linkedin, MessageCircle, Calendar, DollarSign, Globe, Shield, Car, Languages } from 'lucide-react';
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
          },
          {
            id: 'drivers-qatar',
            name: 'Qatar',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.country === 'Qatar'
            )
          },
          {
            id: 'drivers-kosovo',
            name: 'Kosovo',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('driver') && 
              c.country === 'Kosovo'
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
    id: 'heavy-drivers',
    name: 'Heavy Drivers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'heavy-drivers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('heavy driver'))
      },
      {
        id: 'heavy-drivers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'heavy-drivers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'heavy-drivers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.country === 'Saudi Arabia'
            )
          },
          {
            id: 'heavy-drivers-qatar',
            name: 'Qatar',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.country === 'Qatar'
            )
          }
        ]
      },
      {
        id: 'heavy-drivers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'heavy-drivers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'heavy-drivers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'heavy-drivers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'heavy-drivers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'heavy-drivers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              c.passportAvailable
            )
          },
          {
            id: 'heavy-drivers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('heavy driver') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  {
    id: 'light-drivers',
    name: 'Light Drivers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'light-drivers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('light driver'))
      },
      {
        id: 'light-drivers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'light-drivers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'light-drivers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.country === 'Saudi Arabia'
            )
          },
          {
            id: 'light-drivers-kosovo',
            name: 'Kosovo',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.country === 'Kosovo'
            )
          }
        ]
      },
      {
        id: 'light-drivers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'light-drivers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'light-drivers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'light-drivers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'light-drivers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'light-drivers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
              c.passportAvailable
            )
          },
          {
            id: 'light-drivers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('light driver') && 
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
  },
  // Add Beauticians folder
  {
    id: 'beauticians',
    name: 'Beauticians',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'beauticians-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('beautician'))
      },
      {
        id: 'beauticians-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'beauticians-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'beauticians-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.country === 'Saudi Arabia'
            )
          },
          {
            id: 'beauticians-serbia',
            name: 'Serbia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.country === 'Serbia'
            )
          },
          {
            id: 'beauticians-kosovo',
            name: 'Kosovo',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.country === 'Kosovo'
            )
          }
        ]
      },
      {
        id: 'beauticians-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'beauticians-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'beauticians-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'beauticians-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'beauticians-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'beauticians-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              c.passportAvailable
            )
          },
          {
            id: 'beauticians-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('beautician') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Housemaid folder
  {
    id: 'housemaids',
    name: 'Housemaids',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'housemaids-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid'))
      },
      {
        id: 'housemaids-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'housemaids-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.country === 'UAE'
            )
          },
          {
            id: 'housemaids-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'housemaids-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'housemaids-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.status === 'Applied'
            )
          },
          {
            id: 'housemaids-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.status === 'Pending'
            )
          },
          {
            id: 'housemaids-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'housemaids-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'housemaids-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              c.passportAvailable
            )
          },
          {
            id: 'housemaids-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              (c.position.toLowerCase().includes('housemaid') || c.position.toLowerCase().includes('maid')) && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Welder folder
  {
    id: 'welders',
    name: 'Welders',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'welders-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('weld'))
      },
      {
        id: 'welders-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'welders-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'welders-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'welders-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'welders-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'welders-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'welders-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'welders-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'welders-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              c.passportAvailable
            )
          },
          {
            id: 'welders-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('weld') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Mason folder
  {
    id: 'masons',
    name: 'Masons',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'masons-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('mason'))
      },
      {
        id: 'masons-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'masons-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'masons-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.country === 'Saudi Arabia'
            )
          },
          {
            id: 'masons-qatar',
            name: 'Qatar',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.country === 'Qatar'
            )
          }
        ]
      },
      {
        id: 'masons-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'masons-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'masons-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'masons-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'masons-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'masons-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              c.passportAvailable
            )
          },
          {
            id: 'masons-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('mason') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Carpenter folder
  {
    id: 'carpenters',
    name: 'Carpenters',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'carpenters-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('carpenter'))
      },
      {
        id: 'carpenters-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'carpenters-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'carpenters-oman',
            name: 'Oman',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.country === 'Oman'
            )
          }
        ]
      },
      {
        id: 'carpenters-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'carpenters-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'carpenters-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'carpenters-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'carpenters-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'carpenters-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              c.passportAvailable
            )
          },
          {
            id: 'carpenters-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('carpenter') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Steel Fixer folder
  {
    id: 'steel-fixers',
    name: 'Steel Fixers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'steel-fixers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('steel'))
      },
      {
        id: 'steel-fixers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'steel-fixers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'steel-fixers-qatar',
            name: 'Qatar',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.country === 'Qatar'
            )
          }
        ]
      },
      {
        id: 'steel-fixers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'steel-fixers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'steel-fixers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'steel-fixers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'steel-fixers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'steel-fixers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              c.passportAvailable
            )
          },
          {
            id: 'steel-fixers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('steel') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  },
  // Add Construction Worker folder
  {
    id: 'construction-workers',
    name: 'Construction Workers',
    type: 'profession',
    icon: Users,
    children: [
      {
        id: 'construction-workers-all',
        name: 'All',
        type: 'smart-folder',
        icon: Users,
        filter: (candidates) => candidates.filter(c => c.position.toLowerCase().includes('construction'))
      },
      {
        id: 'construction-workers-by-country',
        name: 'By Country',
        type: 'smart-folder',
        icon: MapPin,
        children: [
          {
            id: 'construction-workers-uae',
            name: 'UAE',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.country === 'UAE'
            )
          },
          {
            id: 'construction-workers-saudi',
            name: 'Saudi Arabia',
            type: 'subfolder',
            icon: MapPin,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.country === 'Saudi Arabia'
            )
          }
        ]
      },
      {
        id: 'construction-workers-by-status',
        name: 'By Status',
        type: 'smart-folder',
        icon: CheckCircle,
        children: [
          {
            id: 'construction-workers-ready',
            name: 'Ready',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.status === 'Applied'
            )
          },
          {
            id: 'construction-workers-pending',
            name: 'Pending',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.status === 'Pending'
            )
          },
          {
            id: 'construction-workers-deployed',
            name: 'Deployed',
            type: 'subfolder',
            icon: CheckCircle,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.status === 'Deployed'
            )
          }
        ]
      },
      {
        id: 'construction-workers-by-documents',
        name: 'By Documents',
        type: 'smart-folder',
        icon: FileText,
        children: [
          {
            id: 'construction-workers-complete',
            name: 'Complete',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              c.passportAvailable
            )
          },
          {
            id: 'construction-workers-missing',
            name: 'Missing',
            type: 'subfolder',
            icon: FileText,
            filter: (candidates) => candidates.filter(c => 
              c.position.toLowerCase().includes('construction') && 
              !c.passportAvailable
            )
          }
        ]
      }
    ]
  }
];

export function CandidateBrowserEnhanced() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['electricians']));
  const [selectedFolder, setSelectedFolder] = useState<FolderNode>(folderStructure[0].children![0]);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'basic' | 'detailed'>('basic');

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
    <div className="flex h-[calc(100vh-125px)] gap-4 p-6">
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
          <div className="flex items-center justify-between mb-3">
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
              <div className="flex gap-1 bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('basic')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'basic' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                  }`}
                >
                  Basic View
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'detailed' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                  }`}
                >
                  Detailed View
                </button>
              </div>
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
                  {/* Basic columns */}
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">ID</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Name</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Position</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Age</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Nationality</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Country</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Phone</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Email</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Experience</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Status</th>
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">AI Score</th>
                  
                  {/* Detailed columns */}
                  {viewMode === 'detailed' && (
                    <>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Religion</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Marital</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Salary Exp.</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Available</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Interview</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Passport #</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Pass. Expiry</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Medical Exp.</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">License</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">GCC Years</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">English</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Arabic</th>
                      <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Location</th>
                    </>
                  )}
                  
                  <th className="border border-gray-300 p-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">Applied</th>
                  
                  {/* Separate columns for each link/action */}
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-blue-50">
                    <div className="flex flex-col items-center gap-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Profile Link</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-purple-50">
                    <div className="flex flex-col items-center gap-1">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>Employer CV</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-red-50">
                    <div className="flex flex-col items-center gap-1">
                      <Play className="w-4 h-4 text-red-600" />
                      <span>Video</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-green-50">
                    <div className="flex flex-col items-center gap-1">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span>WhatsApp</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-gray-50">
                    <div className="flex flex-col items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span>Call</span>
                    </div>
                  </th>
                  <th className="border border-gray-300 p-2 text-center text-xs font-semibold text-gray-700 bg-gray-50">
                    <div className="flex flex-col items-center gap-1">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span>Email</span>
                    </div>
                  </th>
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
                    <td className="border border-gray-300 p-2 text-sm text-gray-700 text-center">{candidate.age || '-'}</td>
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
                    
                    {/* Detailed columns */}
                    {viewMode === 'detailed' && (
                      <>
                        <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.religion || '-'}</td>
                        <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.maritalStatus || '-'}</td>
                        <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.salaryExpectation || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.availableFrom || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">
                          {candidate.interviewDate ? (
                            <span className="text-green-700">{candidate.interviewDate}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs font-mono text-gray-700">{candidate.passportNumber || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.passportExpiry || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.medicalExpiry || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.drivingLicense || '-'}</td>
                        <td className="border border-gray-300 p-2 text-sm text-center text-gray-700">{candidate.yearsInGCC || '0'}y</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.englishLevel || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.arabicLevel || '-'}</td>
                        <td className="border border-gray-300 p-2 text-xs text-gray-700">{candidate.currentLocation || '-'}</td>
                      </>
                    )}
                    
                    <td className="border border-gray-300 p-2 text-sm text-gray-700">{candidate.appliedDate}</td>
                    
                    {/* Separate columns for each link/action */}
                    <td className="border border-gray-300 p-2">
                      <button 
                        className="p-1 hover:bg-blue-100 rounded group relative" 
                        title="Copy Profile Link"
                        onClick={async () => {
                          await copyToClipboard(generateProfileLink(candidate));
                          alert('Profile link copied!');
                        }}
                      >
                        <Globe className="w-4 h-4 text-blue-600" />
                      </button>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <button 
                        className="p-1 hover:bg-purple-100 rounded" 
                        title="Copy CV Share Link"
                        onClick={async () => {
                          await copyToClipboard(generateCVShareLink(candidate));
                          alert('CV link copied!');
                        }}
                      >
                        <FileText className="w-4 h-4 text-purple-600" />
                      </button>
                    </td>
                    <td className="border border-gray-300 p-2">
                      {candidate.videoLink && (
                        <a 
                          href={candidate.videoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-red-100 rounded" 
                          title="Watch Video"
                        >
                          <Play className="w-4 h-4 text-red-600" />
                        </a>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {candidate.whatsappLink && (
                        <a 
                          href={candidate.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-green-100 rounded" 
                          title="Open WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        </a>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <a 
                        href={`tel:${candidate.phone}`}
                        className="p-1 hover:bg-gray-200 rounded" 
                        title="Call"
                      >
                        <Phone className="w-4 h-4 text-gray-600" />
                      </a>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <a 
                        href={`mailto:${candidate.email}`}
                        className="p-1 hover:bg-gray-200 rounded" 
                        title="Email"
                      >
                        <Mail className="w-4 h-4 text-gray-600" />
                      </a>
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