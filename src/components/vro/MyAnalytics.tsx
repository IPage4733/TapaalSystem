import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { mockTappals } from '../../data/mockTappals';
import { useAuth } from '../../context/AuthContext';
import { isOverdue } from '../../utils/dateUtils';

const MyAnalytics: React.FC = () => {
  const { user } = useAuth();

  // Get tappals assigned to VRO
  const myTappals = useMemo(() => {
    return mockTappals.filter(t => t.assignedTo === user?.id);
  }, [user]);

  const analytics = useMemo(() => {
    const total = myTappals.length;
    const completed = myTappals.filter(t => t.status === 'Completed').length;
    const pending = myTappals.filter(t => t.status === 'Pending').length;
    const inProgress = myTappals.filter(t => t.status === 'In Progress').length;
    const overdue = myTappals.filter(t => isOverdue(t.expiryDate, t.status)).length;
    
    // Calculate completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate on-time completion
    const completedOnTime = myTappals.filter(t => {
      if (t.status !== 'Completed' || !t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      const expiryDate = new Date(t.expiryDate);
      return completedDate <= expiryDate;
    }).length;
    
    const onTimeRate = completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0;
    
    // Calculate average completion time (mock calculation)
    const avgCompletionTime = completed > 0 ? Math.round(Math.random() * 10 + 5) : 0;
    
    // Monthly status breakdown (mock data for demonstration)
    const monthlyData = [
      { month: 'Jan', completed: 8, pending: 3, overdue: 1 },
      { month: 'Feb', completed: 12, pending: 2, overdue: 0 },
      { month: 'Mar', completed: 15, pending: 4, overdue: 2 },
      { month: 'Apr', completed: 10, pending: 5, overdue: 1 },
      { month: 'May', completed: 18, pending: 3, overdue: 0 },
      { month: 'Jun', completed: 14, pending: 6, overdue: 3 }
    ];

    return {
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
      onTimeRate,
      avgCompletionTime,
      completedOnTime,
      monthlyData
    };
  }, [myTappals]);

  const getPerformanceRating = (rate: number) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (rate >= 75) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (rate >= 60) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  const completionRating = getPerformanceRating(analytics.completionRate);
  const onTimeRating = getPerformanceRating(analytics.onTimeRate);

  const maxMonthlyValue = Math.max(...analytics.monthlyData.map(d => d.completed + d.pending + d.overdue), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Analytics</h1>
        <p className="text-gray-600">Your personal performance insights and statistics</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-cyan-600">{analytics.completionRate}%</p>
            </div>
            <div className="p-3 bg-cyan-100 rounded-full">
              <Target className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${completionRating.color}`}>
              {completionRating.label}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">On-Time Completion</p>
              <p className="text-2xl font-bold text-green-600">{analytics.onTimeRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${onTimeRating.color}`}>
              {onTimeRating.label}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Completion Time</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.avgCompletionTime} days</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {analytics.avgCompletionTime <= 7 ? 'Excellent timing' : 'Room for improvement'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Handled</p>
              <p className="text-2xl font-bold text-purple-600">{analytics.total}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              Lifetime tappals
            </span>
          </div>
        </div>
      </div>

      {/* Current Status Breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <BarChart3 className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-gray-900">Current Status Breakdown</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">{analytics.completed}</div>
            <p className="text-sm text-green-700">Completed</p>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.total > 0 ? (analytics.completed / analytics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.inProgress}</div>
            <p className="text-sm text-blue-700">In Progress</p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.total > 0 ? (analytics.inProgress / analytics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 mb-2">{analytics.pending}</div>
            <p className="text-sm text-orange-700">Pending</p>
            <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.total > 0 ? (analytics.pending / analytics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600 mb-2">{analytics.overdue}</div>
            <p className="text-sm text-red-700">Overdue</p>
            <div className="w-full bg-red-200 rounded-full h-2 mt-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analytics.total > 0 ? (analytics.overdue / analytics.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Monthly Performance Trend</h2>
        </div>
        
        <div className="space-y-4">
          {analytics.monthlyData.map((month, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{month.month} 2025</span>
                <span className="text-sm text-gray-500">
                  Total: {month.completed + month.pending + month.overdue}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                <div
                  className="bg-green-500 h-4 absolute left-0 top-0"
                  style={{ width: `${(month.completed / maxMonthlyValue) * 100}%` }}
                ></div>
                <div
                  className="bg-orange-500 h-4 absolute top-0"
                  style={{ 
                    left: `${(month.completed / maxMonthlyValue) * 100}%`,
                    width: `${(month.pending / maxMonthlyValue) * 100}%` 
                  }}
                ></div>
                <div
                  className="bg-red-500 h-4 absolute top-0"
                  style={{ 
                    left: `${((month.completed + month.pending) / maxMonthlyValue) * 100}%`,
                    width: `${(month.overdue / maxMonthlyValue) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Completed: {month.completed}</span>
                <span>Pending: {month.pending}</span>
                <span>Overdue: {month.overdue}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Overdue</span>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold text-gray-900">Performance Summary</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-600 mb-2">
              {analytics.completionRate}%
            </div>
            <p className="text-gray-600">Overall Completion Rate</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.completed} out of {analytics.total} tappals
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.completedOnTime}
            </div>
            <p className="text-gray-600">Completed On Time</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.onTimeRate}% on-time rate
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.avgCompletionTime}
            </div>
            <p className="text-gray-600">Avg. Days to Complete</p>
            <p className="text-sm text-gray-500 mt-1">
              {analytics.avgCompletionTime <= 7 ? 'Excellent timing' : 'Can improve'}
            </p>
          </div>
        </div>

        {/* Performance Tips */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">Performance Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Improve Completion Rate</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Prioritize high-priority tappals</li>
                <li>• Set daily completion targets</li>
                <li>• Use field visit time efficiently</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Reduce Overdue Items</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Check expiry dates daily</li>
                <li>• Forward complex cases early</li>
                <li>• Communicate delays promptly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAnalytics;