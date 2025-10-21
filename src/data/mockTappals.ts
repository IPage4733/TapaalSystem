import { Tappal, Petition, Department } from '../types/Tappal';

export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Revenue Department',
    code: 'REV',
    district: 'Sample District',
    contactEmail: 'revenue@district.gov.in',
    headOfDepartment: 'Suresh Reddy',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: '2',
    name: 'Land Records',
    code: 'LR',
    district: 'Sample District',
    contactEmail: 'landrecords@district.gov.in',
    headOfDepartment: 'Kavitha Nair',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: '3',
    name: 'Public Works Department',
    code: 'PWD',
    district: 'Sample District',
    contactEmail: 'pwd@district.gov.in',
    headOfDepartment: 'Vikram Yadav',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: '4',
    name: 'Health Department',
    code: 'HEALTH',
    district: 'Sample District',
    contactEmail: 'health@district.gov.in',
    headOfDepartment: 'Priya Sharma',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  },
  {
    id: '5',
    name: 'Education Department',
    code: 'EDU',
    district: 'Sample District',
    contactEmail: 'education@district.gov.in',
    headOfDepartment: 'Amit Singh',
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true
  }
];

export const mockTappals: Tappal[] = [
  {
    id: '1',
    tappalId: 'TAP-2025-001',
    subject: 'Land Acquisition for Road Widening Project',
    description: 'Request for land acquisition proceedings for the proposed road widening project in Village Rampur.',
    assignedTo: '4',
    assignedToName: 'Sunita Patel',
    department: '1',
    departmentName: 'Revenue Department',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2025-01-15T09:00:00Z',
    expiryDate: '2025-02-15T17:00:00Z',
    petitionId: 'PET-2025-001',
    isConfidential: false,
    createdBy: '1',
    lastUpdated: '2025-01-16T14:30:00Z',
    comments: [
      {
        id: '1',
        userId: '4',
        userName: 'Sunita Patel',
        comment: 'Initial survey completed. Proceeding with documentation.',
        timestamp: '2025-01-16T14:30:00Z'
      }
    ],
    attachments: ['survey_report.pdf', 'land_map.jpg']
  },
  {
    id: '2',
    tappalId: 'TAP-2025-002',
    subject: 'Property Tax Assessment Appeal',
    description: 'Appeal against property tax assessment for commercial property in Market Area.',
    assignedTo: '7',
    assignedToName: 'Suresh Reddy',
    department: '1',
    departmentName: 'Revenue Department',
    priority: 'Medium',
    status: 'Pending',
    createdAt: '2025-01-14T11:30:00Z',
    expiryDate: '2025-01-25T17:00:00Z',
    petitionId: 'PET-2025-002',
    isConfidential: false,
    createdBy: '1',
    lastUpdated: '2025-01-14T11:30:00Z',
    comments: [],
    attachments: ['tax_documents.pdf']
  },
  {
    id: '3',
    tappalId: 'TAP-2025-003',
    subject: 'Birth Certificate Correction',
    description: 'Request for correction of birth certificate details - name spelling error.',
    assignedTo: '9',
    assignedToName: 'Ramesh Tiwari',
    department: '4',
    departmentName: 'Health Department',
    priority: 'Low',
    status: 'Completed',
    createdAt: '2025-01-10T10:00:00Z',
    expiryDate: '2025-01-20T17:00:00Z',
    completedAt: '2025-01-18T15:45:00Z',
    petitionId: 'PET-2025-003',
    isConfidential: false,
    createdBy: '1',
    lastUpdated: '2025-01-18T15:45:00Z',
    comments: [
      {
        id: '2',
        userId: '9',
        userName: 'Ramesh Tiwari',
        comment: 'Documents verified and correction completed.',
        timestamp: '2025-01-18T15:45:00Z'
      }
    ],
    attachments: ['birth_certificate.pdf', 'correction_request.pdf']
  },
  {
    id: '4',
    tappalId: 'TAP-2025-004',
    subject: 'School Infrastructure Development',
    description: 'Proposal for construction of new classrooms in Government Primary School.',
    assignedTo: '3',
    assignedToName: 'Amit Singh',
    department: '5',
    departmentName: 'Education Department',
    priority: 'High',
    status: 'Under Review',
    createdAt: '2025-01-12T08:00:00Z',
    expiryDate: '2025-02-12T17:00:00Z',
    isConfidential: false,
    createdBy: '1',
    lastUpdated: '2025-01-17T16:20:00Z',
    comments: [
      {
        id: '3',
        userId: '3',
        userName: 'Amit Singh',
        comment: 'Budget estimation in progress. Site inspection completed.',
        timestamp: '2025-01-17T16:20:00Z'
      }
    ],
    attachments: ['proposal.pdf', 'site_photos.zip']
  },
  {
    id: '5',
    tappalId: 'TAP-2025-005',
    subject: 'Water Supply Connection Request',
    description: 'New water supply connection request for residential area in Ward 12.',
    assignedTo: '5',
    assignedToName: 'Vikram Yadav',
    department: '3',
    departmentName: 'Public Works Department',
    priority: 'Medium',
    status: 'Pending',
    createdAt: '2025-01-08T14:15:00Z',
    expiryDate: '2025-01-18T17:00:00Z',
    isConfidential: false,
    createdBy: '1',
    lastUpdated: '2025-01-08T14:15:00Z',
    comments: [],
    attachments: ['application_form.pdf']
  },
  {
    id: '6',
    tappalId: 'TAP-2025-006',
    subject: 'Confidential: VIP Security Arrangements',
    description: 'Security arrangements for upcoming VIP visit to the district.',
    assignedTo: '2',
    assignedToName: 'Priya Sharma',
    department: '1',
    departmentName: 'Revenue Department',
    priority: 'Urgent',
    status: 'In Progress',
    createdAt: '2025-01-16T07:00:00Z',
    expiryDate: '2025-01-20T17:00:00Z',
    isConfidential: true,
    createdBy: '1',
    lastUpdated: '2025-01-17T09:15:00Z',
    comments: [
      {
        id: '4',
        userId: '2',
        userName: 'Priya Sharma',
        comment: 'Coordination with police department initiated.',
        timestamp: '2025-01-17T09:15:00Z'
      }
    ],
    attachments: ['security_plan.pdf']
  }
];

export const mockPetitions: Petition[] = [
  {
    id: '1',
    petitionId: 'PET-2025-001',
    petitionerName: 'Ravi Kumar',
    petitionerPhone: '+91 9876543220',
    petitionerEmail: 'ravi.kumar@email.com',
    department: '1',
    departmentName: 'Revenue Department',
    subject: 'Land Acquisition for Road Widening Project',
    description: 'Request for fair compensation for land acquisition for road widening project.',
    isConfidential: false,
    createdAt: '2025-01-15T08:30:00Z',
    tappalId: 'TAP-2025-001',
    status: 'Tappal Generated'
  },
  {
    id: '2',
    petitionId: 'PET-2025-002',
    petitionerName: 'Sita Devi',
    petitionerPhone: '+91 9876543221',
    petitionerEmail: 'sita.devi@email.com',
    department: '1',
    departmentName: 'Revenue Department',
    subject: 'Property Tax Assessment Appeal',
    description: 'Appeal against excessive property tax assessment for commercial property.',
    isConfidential: false,
    createdAt: '2025-01-14T10:00:00Z',
    tappalId: 'TAP-2025-002',
    status: 'Tappal Generated'
  },
  {
    id: '3',
    petitionId: 'PET-2025-003',
    petitionerName: 'Mohan Lal',
    petitionerPhone: '+91 9876543222',
    petitionerEmail: 'mohan.lal@email.com',
    department: '4',
    departmentName: 'Health Department',
    subject: 'Birth Certificate Correction',
    description: 'Request for correction of name spelling in birth certificate.',
    isConfidential: false,
    createdAt: '2025-01-10T09:30:00Z',
    tappalId: 'TAP-2025-003',
    status: 'Resolved'
  },
  {
    id: '4',
    petitionId: 'PET-2025-004',
    petitionerName: 'School Management Committee',
    petitionerPhone: '+91 9876543223',
    petitionerEmail: 'smc.school@email.com',
    department: '5',
    departmentName: 'Education Department',
    subject: 'School Infrastructure Development',
    description: 'Request for additional classrooms and infrastructure development.',
    isConfidential: false,
    createdAt: '2025-01-12T07:45:00Z',
    tappalId: 'TAP-2025-004',
    status: 'Tappal Generated'
  },
  {
    id: '5',
    petitionId: 'PET-2025-005',
    petitionerName: 'Residents Welfare Association',
    petitionerPhone: '+91 9876543224',
    petitionerEmail: 'rwa.ward12@email.com',
    department: '3',
    departmentName: 'Public Works Department',
    subject: 'Water Supply Connection Request',
    description: 'Request for new water supply connections in Ward 12 residential area.',
    isConfidential: false,
    createdAt: '2025-01-08T13:00:00Z',
    status: 'Under Review'
  },
  {
    id: '6',
    petitionId: 'PET-2025-006',
    petitionerName: 'Farmers Association',
    petitionerPhone: '+91 9876543225',
    petitionerEmail: 'farmers.assoc@email.com',
    department: '1',
    departmentName: 'Revenue Department',
    subject: 'Crop Insurance Claim',
    description: 'Request for processing crop insurance claims due to drought conditions.',
    isConfidential: false,
    createdAt: '2025-01-05T11:00:00Z',
    status: 'Submitted'
  },
  {
    id: '7',
    petitionId: 'PET-2025-007',
    petitionerName: 'Local Business Owner',
    petitionerPhone: '+91 9876543226',
    petitionerEmail: 'business.owner@email.com',
    department: '2',
    departmentName: 'Land Records',
    subject: 'Trade License Renewal',
    description: 'Application for renewal of trade license for retail business.',
    isConfidential: false,
    createdAt: '2025-01-03T14:20:00Z',
    status: 'Submitted'
  }
];