export interface Tappal {
  id: string;
  tappalId: string;
  subject: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  department: string;
  departmentName: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Under Review' | 'Completed' | 'Rejected';
  createdAt: string;
  expiryDate: string;
  completedAt?: string;
  petitionId?: string;
  isConfidential: boolean;
  createdBy: string;
  lastUpdated: string;
  comments: TappalComment[];
  attachments: string[];
}

export interface TappalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

export interface Petition {
  id: string;
  petitionId: string;
  petitionerName: string;
  petitionerPhone: string;
  petitionerEmail: string;
  department: string;
  departmentName: string;
  subject: string;
  description: string;
  isConfidential: boolean;
  createdAt: string;
  tappalId?: string;
  status: 'Submitted' | 'Under Review' | 'Tappal Generated' | 'Resolved' | 'Rejected';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  district: string;
  contactEmail: string;
  headOfDepartment: string;
  createdAt: string;
  isActive: boolean;
}

export interface EmployeePerformance {
  userId: string;
  userName: string;
  role: string;
  department: string;
  assignedTappals: number;
  resolvedCount: number;
  overdueCount: number;
  avgCompletionTime: number; // in days
  lastLogin?: string;
}