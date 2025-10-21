export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDaysOverdue = (expiryDate: string): number => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = today.getTime() - expiry.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isOverdue = (expiryDate: string, status: string): boolean => {
  if (status === 'Completed') return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  return today > expiry;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed':
      return 'text-green-600 bg-green-100';
    case 'In Progress':
      return 'text-blue-600 bg-blue-100';
    case 'Under Review':
      return 'text-yellow-600 bg-yellow-100';
    case 'Pending':
      return 'text-gray-600 bg-gray-100';
    case 'Rejected':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Urgent':
      return 'text-red-600 bg-red-100';
    case 'High':
      return 'text-orange-600 bg-orange-100';
    case 'Medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'Low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};