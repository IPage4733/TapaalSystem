// src/utils/dateUtils.ts

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const parseExpiry = (expiryDate?: string | null): Date | null => {
  if (!expiryDate) return null;
  const trimmed = expiryDate.trim();
  const dateOnlyRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
  const normalized = dateOnlyRegex.test(trimmed) ? `${trimmed}T23:59:59` : trimmed;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getDaysOverdue = (expiryDate?: string | null): number => {
  const expiry = parseExpiry(expiryDate);
  if (!expiry) return 0;
  const now = new Date();
  const diffMs = now.getTime() - expiry.getTime();
  if (diffMs <= 0) return 0;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const isTappalOverdue = (expiryDate?: string | null, status?: string | null): boolean => {
  const s = String(status || '').trim().toLowerCase();
  if (isCompletedStatus(s)) return false;
  const expiry = parseExpiry(expiryDate);
  if (!expiry) return false;
  return expiry.getTime() < Date.now();
};

// NEW: exported helper to check completed-like statuses
export const isCompletedStatus = (status?: string | null): boolean => {
  const s = String(status || '').trim().toLowerCase();
  const completedStates = new Set([
    'completed', 'closed', 'resolved', 'finalized', 'finished', 'done'
  ]);
  return completedStates.has(s);
};

/**
 * Backwards-compatible alias (in case other files import `isOverdue`).
 * But prefer using isTappalOverdue (expiry-based) or isCompletedStatus (status-based) as needed.
 */
export const isOverdue = (expiryDate?: string | null, status?: string | null): boolean => {
  return isTappalOverdue(expiryDate, status);
};

export const getStatusColor = (status?: string | null): string => {
  const s = String(status || '').trim().toLowerCase();
  switch (s) {
    case 'completed':
    case 'closed':
      return 'text-green-600 bg-green-100';
    case 'in progress':
    case 'in_progress':
    case 'inprogress':
      return 'text-blue-600 bg-blue-100';
    case 'under review':
    case 'under_review':
      return 'text-yellow-600 bg-yellow-100';
    case 'pending':
    case 'active':
      return 'text-gray-600 bg-gray-100';
    case 'rejected':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority?: string | null): string => {
  const p = String(priority || '').trim().toLowerCase();
  switch (p) {
    case 'urgent':
      return 'text-red-600 bg-red-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};
