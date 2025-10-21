export interface Movement {
  id: string;
  tappalId: string;
  fromOfficerId: string;
  fromOfficerName: string;
  fromOfficerRole: string;
  fromOfficerPhone: string;
  toOfficerId: string;
  toOfficerName: string;
  toOfficerRole: string;
  toOfficerPhone: string;
  reason: string;
  timestamp: string;
  status: 'Forwarded' | 'Received' | 'Processed';
}

export interface TappalMovement extends Movement {
  fromDepartment: string;
  toDepartment: string;
}