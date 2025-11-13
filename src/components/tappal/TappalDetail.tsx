import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommentsByTappalId, addComment as addCommentApi, deleteComment as deleteCommentApi } from '../../services/commentService';
import { updateTapalStatus } from '../../services/tapalApiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/ToastContainer';
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Building, 
  ArrowRight, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Send,
  Download,
  Eye,
  X,
  ArrowLeft,
  MapPin,
  MessageSquare,
  Plus,
  Edit,
  Save
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { mockUsers } from '../../data/mockUsers';
import { mockMovements } from '../../data/mockMovements';
import { formatDate, formatDateTime, getDaysOverdue, isOverdue, getStatusColor, getPriorityColor } from '../../utils/dateUtils';
import { Tappal } from '../../types/Tappal';

const TappalDetail: React.FC = () => {
  const { tappalId } = useParams<{ tappalId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [forwardForm, setForwardForm] = useState({
    toOfficerId: '',
    reason: ''
  });
  const [commentForm, setCommentForm] = useState({
    comment: ''
  });
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [apiComments, setApiComments] = useState<any[]>([]);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState<{
    newStatus: Tappal['status'] | '';
    reason: string;
  }>({
    newStatus: '',
    reason: ''
  });

  // Find tappal
  const tappal = useMemo(() => {
    return mockTappals.find(t => t.tappalId === tappalId);
  }, [tappalId]);

  // Find assigned officer
  const assignedOfficer = useMemo(() => {
    if (!tappal) return null;
    return mockUsers.find(u => u.id === tappal.assignedTo);
  }, [tappal]);

  // Fetch comments when tappal changes
  useEffect(() => {
    const fetchComments = async () => {
      if (!tappal) return;
      
      setIsLoadingComments(true);
      try {
        const comments = await getCommentsByTappalId(tappal.tappalId);
        setApiComments(comments);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to load comments. Using local data as fallback.'
        });
        setApiComments(tappal.comments || []);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchComments();
  }, [tappal]);

  // Get movement history
  const movements = useMemo(() => {
    if (!tappal) return [];
    return mockMovements
      .filter(m => m.tappalId === tappal.tappalId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [tappal]);

  // Available officers for forwarding (excluding current user and assigned officer)
  const availableOfficers = useMemo(() => {
    return mockUsers.filter(u => 
      u.id !== user?.id && 
      u.id !== tappal?.assignedTo &&
      u.role !== 'collector'
    );
  }, [user, tappal]);

  // Check access permissions
  const hasAccess = useMemo(() => {
    if (!user || !tappal) return false;
    
    // Co-Officer, Collector, Joint Collector can access everything
    if (user.role === 'co_officer' || user.role === 'collector' || user.role === 'joint_collector') return true;
    
    // DRO can access tappals assigned to them or their subordinates
    if (user.role === 'dro') {
      // Can access if assigned to DRO
      if (user.id === tappal.assignedTo) return true;
      
      // Can access if assigned to officers below DRO (RDO, Tahsildar, Naib Tahsildar, RI, VRO, Clerk)
      const assignedOfficer = mockUsers.find(u => u.id === tappal.assignedTo);
      if (assignedOfficer && ['rdo', 'tahsildar', 'naib_tahsildar', 'ri', 'vro', 'clerk'].includes(assignedOfficer.role)) {
        return true;
      }
    }
    
    // RDO can access tappals assigned to them or their subordinates
    if (user.role === 'rdo') {
      // Can access if assigned to RDO
      if (user.id === tappal.assignedTo) return true;
      
      // Can access if assigned to officers below RDO (Tahsildar, Naib Tahsildar, RI, VRO, Clerk)
      const assignedOfficer = mockUsers.find(u => u.id === tappal.assignedTo);
      if (assignedOfficer && ['tahsildar', 'naib_tahsildar', 'ri', 'vro', 'clerk'].includes(assignedOfficer.role)) {
        return true;
      }
    }
    
    // Tahsildar can access tappals assigned to them or their subordinates
    if (user.role === 'tahsildar') {
      // Can access if assigned to Tahsildar
      if (user.id === tappal.assignedTo) return true;
      
      // Can access if assigned to officers below Tahsildar (Naib Tahsildar, RI, VRO, Clerk)
      const assignedOfficer = mockUsers.find(u => u.id === tappal.assignedTo);
      if (assignedOfficer && ['naib_tahsildar', 'ri', 'vro', 'clerk'].includes(assignedOfficer.role)) {
        return true;
      }
    }
    
    // Naib Tahsildar can access tappals assigned to them or their subordinates
    if (user.role === 'naib_tahsildar') {
      // Can access if assigned to Naib Tahsildar
      if (user.id === tappal.assignedTo) return true;
      
      // Can access if assigned to officers below Naib Tahsildar (RI, VRO, Clerk)
      const assignedOfficer = mockUsers.find(u => u.id === tappal.assignedTo);
      if (assignedOfficer && ['ri', 'vro', 'clerk'].includes(assignedOfficer.role)) {
        return true;
      }
    }
    
    // Assigned officer can access
    if (user.id === tappal.assignedTo) return true;
    
    // Officers in movement history can access
    const hasMovementHistory = movements.some(m => 
      m.fromOfficerId === user.id || m.toOfficerId === user.id
    );
    
    // VRO can access if assigned to them
    if (user.role === 'vro' && user.id === tappal.assignedTo) return true;
    
    return hasMovementHistory;
  }, [user, tappal, movements]);

  // Can forward tappal
  const canForward = useMemo(() => {
    if (!user || !tappal) return false;
    return user.role === 'co_officer' || user.role === 'collector' || user.role === 'joint_collector' || user.role === 'dro' || user.role === 'rdo' || user.role === 'tahsildar' || user.role === 'naib_tahsildar' || user.role === 'ri' || user.role === 'vro' || user.id === tappal.assignedTo;
  }, [user, tappal]);

  // Can change status
  const canChangeStatus = useMemo(() => {
    if (!user || !tappal) return false;
    return user.role === 'co_officer' || user.role === 'collector' || user.role === 'joint_collector' || user.role === 'dro' || user.role === 'rdo' || user.role === 'tahsildar' || user.role === 'naib_tahsildar' || user.role === 'ri' || user.role === 'vro' || user.id === tappal.assignedTo;
  }, [user, tappal]);
  if (!tappal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tappal Not Found</h2>
          <p className="text-gray-600 mb-4">The requested tappal could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <EyeOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view this tappal.</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleForward = () => {
    if (!forwardForm.toOfficerId || !forwardForm.reason.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an officer and provide a reason for forwarding.'
      });
      return;
    }

    const toOfficer = availableOfficers.find(o => o.id === forwardForm.toOfficerId);
    if (!toOfficer) return;

    // In real implementation, this would:
    // 1. Create new movement record
    // 2. Update tappal assignedTo
    // 3. Send notification to new officer

    showToast({
      type: 'success',
      title: 'Tappal Forwarded Successfully',
      message: `${tappal.tappalId} has been forwarded to ${toOfficer.name}`,
      duration: 5000
    });

    setShowForwardModal(false);
    setForwardForm({ toOfficerId: '', reason: '' });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingCommentId(commentId);
      await deleteCommentApi(commentId);
      
      // Update local state to remove the deleted comment
      setApiComments(prev => prev.filter(comment => comment.id !== commentId));
      
      showToast({
        type: 'success',
        title: 'Comment Deleted',
        message: 'The comment has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete comment. Please try again.'
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleAddComment = async () => {
    if (!commentForm.comment.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a comment before submitting.'
      });
      return;
    }

    try {
      // Check if user is authenticated
      if (!user) {
        showToast({
          type: 'error',
          title: 'Authentication Required',
          message: 'You need to be logged in to add comments.'
        });
        return;
      }

      const newComment = {
        tappalId: tappal.tappalId,
        userId: user.id,
        userName: user.name,
        comment: commentForm.comment.trim(),
      };

      const addedComment = await addCommentApi(newComment);
      
      // Update local state with the new comment
      setApiComments(prev => [addedComment, ...prev]);
      
      showToast({
        type: 'success',
        title: 'Comment Added Successfully',
        message: `Your comment has been added to ${tappal.tappalId}`,
        duration: 5000
      });

      setShowCommentModal(false);
      setCommentForm({ comment: '' });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add comment. Please try again.';
      
      showToast({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000
      });
      
      // If unauthorized, redirect to login or refresh token
      if (error.response?.status === 401 || error.response?.status === 403) {
        // You might want to redirect to login or refresh the token here
        // For now, we'll just show the error message
      }
    }
  };

  const handleStatusChange = async () => {
    if (!statusForm.newStatus || !statusForm.reason.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a new status and provide a reason for the change.'
      });
      return;
    }

    try {
      // Call the API to update the status
      await updateTapalStatus(tappal.tappalId, statusForm.newStatus, statusForm.reason);
      
      // Update the local state to reflect the change
      tappal.status = statusForm.newStatus as Tappal['status'];
      
      // If status is completed, update the completion date
      if (statusForm.newStatus === 'Completed') {
        tappal.completedAt = new Date().toISOString();
      }

      showToast({
        type: 'success',
        title: 'Status Updated Successfully',
        message: `${tappal.tappalId} status has been changed to ${statusForm.newStatus}.`,
        duration: 6000
      });

      setShowStatusModal(false);
      setStatusForm({ newStatus: '', reason: '' });
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update status. Please try again.'
      });
    }
  };
  const daysOverdue = getDaysOverdue(tappal.expiryDate);
  const overdueStatus = isOverdue(tappal.expiryDate, tappal.status);

  const statusOptions = [
    { value: 'Pending', label: 'Pending', color: 'gray' },
    { value: 'In Progress', label: 'In Progress', color: 'blue' },
    { value: 'Under Review', label: 'Under Review', color: 'yellow' },
    { value: 'Completed', label: 'Completed', color: 'green' },
    { value: 'Rejected', label: 'Rejected', color: 'red' }
  ];

  const availableStatusOptions = statusOptions.filter(option => option.value !== tappal.status);
  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      co_officer: 'Chief Officer',
      collector: 'District Collector',
      joint_collector: 'Joint Collector',
      dro: 'District Revenue Officer',
      rdo: 'Revenue Divisional Officer',
      tahsildar: 'Tahsildar',
      naib_tahsildar: 'Naib Tahsildar',
      ri: 'Revenue Inspector',
      vro: 'Village Revenue Officer',
      clerk: 'Clerk'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tappal Details</h1>
                <p className="text-gray-600">{tappal.tappalId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCommentModal(true)}
                className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </button>
              {canChangeStatus && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-green-300 text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Change Status
                </button>
              )}
              {canForward && (
                <button
                  onClick={() => setShowForwardModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Forward Tappal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Section 1: Tappal Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{tappal.subject}</h2>
                <p className="text-gray-600 mt-1">{tappal.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {tappal.isConfidential && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <EyeOff className="h-4 w-4 mr-1" />
                  Confidential
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tappal.status)}`}>
                {tappal.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(tappal.priority)}`}>
                {tappal.priority}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">{tappal.departmentName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900">{formatDate(tappal.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Expiry Date</p>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-gray-900">{formatDate(tappal.expiryDate)}</p>
                  {overdueStatus && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {daysOverdue} days overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Current Officer Info */}
        {assignedOfficer && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Currently Assigned To</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {assignedOfficer.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{assignedOfficer.name}</h4>
                <p className="text-gray-600">{getRoleDisplayName(assignedOfficer.role)}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{assignedOfficer.phoneNumber}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{assignedOfficer.department}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Movement History (Road-Style UI) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Movement History</h3>
          
          {movements.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No movement history available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Road Timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              
              <div className="space-y-8">
                {movements.map((movement, index) => (
                  <div key={movement.id} className="relative flex items-start space-x-6">
                    {/* Road Node */}
                    <div className="relative z-10">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        movement.status === 'Processed' 
                          ? 'bg-green-500 border-green-500' 
                          : movement.status === 'Received'
                          ? 'bg-blue-500 border-blue-500'
                          : 'bg-yellow-500 border-yellow-500'
                      }`}></div>
                      {index < movements.length - 1 && (
                        <ArrowRight className="absolute -right-2 top-6 h-4 w-4 text-gray-400" />
                      )}
                    </div>

                    {/* Movement Details */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                movement.status === 'Processed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : movement.status === 'Received'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {movement.status}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDateTime(movement.timestamp)}
                              </span>
                            </div>
                            
                            {/* From Officer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">FROM</p>
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{movement.fromOfficerName}</p>
                                    <p className="text-sm text-gray-600">{getRoleDisplayName(movement.fromOfficerRole)}</p>
                                    <p className="text-xs text-gray-500">{movement.fromOfficerPhone}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* To Officer */}
                              <div>
                                <p className="text-xs text-gray-500 mb-1">TO</p>
                                <div className="flex items-center space-x-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">{movement.toOfficerName}</p>
                                    <p className="text-sm text-gray-600">{getRoleDisplayName(movement.toOfficerRole)}</p>
                                    <p className="text-xs text-gray-500">{movement.toOfficerPhone}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Comments Section */}
                            <div className="bg-white rounded-lg shadow p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                                <button
                                  onClick={() => setShowCommentModal(true)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  disabled={isLoadingComments}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  {isLoadingComments ? 'Loading...' : 'Add Comment'}
                                </button>
                              </div>
                              
                              {isLoadingComments ? (
                                <div className="flex justify-center py-4">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                </div>
                              ) : apiComments.length > 0 ? (
                                <div className="space-y-4">
                                  {apiComments.map((comment) => (
                                    <div key={comment.id} className="border-l-4 border-blue-500 pl-4 py-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                                          <p className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleString()}</p>
                                        </div>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-700">{comment.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No comments yet. Add the first comment!</p>
                              )}
                            </div>

                            {/* Reason */}
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-xs text-gray-500 mb-1">FORWARDING REASON</p>
                              <p className="text-sm text-gray-700">{movement.reason}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Current Position Indicator */}
                <div className="relative flex items-start space-x-6">
                  <div className="relative z-10">
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-blue-600 animate-pulse"></div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-900">Current Position</span>
                      </div>
                      <p className="text-blue-700 mt-1">
                        Currently with {assignedOfficer?.name} ({getRoleDisplayName(assignedOfficer?.role || '')})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Comments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Comments & Remarks</h2>
              <span className="text-sm text-gray-500">({apiComments.length})</span>
            </div>
            <button
              onClick={() => setShowCommentModal(true)}
              className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Comment
            </button>
          </div>
          
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : apiComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
              <p className="text-gray-500">Be the first to add a comment or remark on this tappal.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiComments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium text-sm">
                        {comment.userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{comment.userName}</h4>
                          <p className="text-xs text-gray-500">{formatDateTime(comment.timestamp)}</p>
                        </div>
                        {(comment.userId === user?.id || user?.role === 'admin') && (
                          <div className="flex items-center space-x-2">
                            {comment.userId === user?.id && (
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                Your Comment
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComment(comment.id);
                              }}
                              disabled={deletingCommentId === comment.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Delete comment"
                            >
                              {deletingCommentId === comment.id ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Deleting...
                                </span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Section 4: Attachments */}
        {tappal.attachments && tappal.attachments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tappal.attachments.map((attachment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{attachment}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Change Tappal Status</h2>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Edit className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Changing status for:</span>
                </div>
                <p className="text-blue-800 font-medium">{tappal.tappalId} - {tappal.subject}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-blue-700 text-sm">Current Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tappal.status)}`}>
                    {tappal.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status *
                </label>
                <select
                  value={statusForm.newStatus}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, newStatus: e.target.value as Tappal['status'] | '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select new status...</option>
                  {availableStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Status Change *
                </label>
                <textarea
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter the reason for changing the status..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  This reason will be recorded in the audit trail and relevant officers will be notified.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Status changes are permanent and will be recorded in the audit trail</li>
                      <li>• All relevant officers will be notified about this status change</li>
                      <li>• If marking as 'Completed', ensure all work is actually finished</li>
                      <li>• This action cannot be undone without proper authorization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!statusForm.newStatus || !statusForm.reason.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add Comment</h2>
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Adding comment to:</span>
                </div>
                <p className="text-blue-800 font-medium">{tappal.tappalId} - {tappal.subject}</p>
                <p className="text-blue-700 text-sm mt-1">
                  The assigned officer ({assignedOfficer?.name}) will be notified about your comment.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Comment *
                </label>
                <textarea
                  value={commentForm.comment}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your comment or remark about this tappal..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your name and timestamp will be automatically added to the comment.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Note:</p>
                    <p>Comments are visible to all officers who have access to this tappal. The assigned officer will receive a notification about your comment.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddComment}
                disabled={!commentForm.comment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Add Comment</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Forward Tappal Modal */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Forward Tappal</h2>
                <button
                  onClick={() => setShowForwardModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forward to Officer *
                </label>
                <select
                  value={forwardForm.toOfficerId}
                  onChange={(e) => setForwardForm(prev => ({ ...prev, toOfficerId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Officer</option>
                  {availableOfficers.map(officer => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} - {getRoleDisplayName(officer.role)} ({officer.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Forwarding *
                </label>
                <textarea
                  value={forwardForm.reason}
                  onChange={(e) => setForwardForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reason for forwarding this tappal..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowForwardModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={!forwardForm.toOfficerId || !forwardForm.reason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>Forward Tappal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TappalDetail;
