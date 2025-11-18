import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import { formatDate, getStatusColor } from "../../utils/dateUtils";

// ---------------------------
// REAL API URLs
// ---------------------------
const TAPPALS_API =
  "https://ik4vdwlkxb.execute-api.ap-southeast-1.amazonaws.com/prod/tappals";

const DEPARTMENTS_API =
  "https://1qgedzknw2.execute-api.ap-southeast-1.amazonaws.com/prod/departmentsnew";

const DepartmentAnalytics: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const [tappals, setTappals] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // -----------------------------
  // FETCH DEPARTMENTS
  // -----------------------------
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await fetch(DEPARTMENTS_API);
        const data = await res.json();
        setDepartments(data);
      } catch (e) {
        console.error("Department API Error:", e);
      }
    };
    loadDepartments();
  }, []);

  // -----------------------------
  // FETCH TAPPALS + MAP DEPARTMENT
  // -----------------------------
  useEffect(() => {
    const loadTappals = async () => {
      try {
        const res = await fetch(TAPPALS_API);
        const data = await res.json();

        const mapped = data.map((t: any) => {
          const dept = departments.find(
            (d: any) =>
              d.departmentName?.toLowerCase() === t.department?.toLowerCase()
          );

          return {
            ...t,
            departmentId: dept?.id || "",
            departmentName: dept?.departmentName || t.department || "Unknown",
          };
        });

        setTappals(mapped);
      } catch (e) {
        console.error("Tappals API Error:", e);
      }
    };

    if (departments.length > 0) loadTappals();
  }, [departments]);

  // -----------------------------
  // FILTER TAPPALS
  // -----------------------------
  const filteredTappals = useMemo(() => {
    return tappals.filter((t: any) => {
      const matchesDepartment =
        !selectedDepartment || t.departmentId === selectedDepartment;

      const matchesDateRange =
        (!dateRange.from ||
          new Date(t.createdAt) >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(t.createdAt) <= new Date(dateRange.to));

      return matchesDepartment && matchesDateRange;
    });
  }, [selectedDepartment, dateRange, tappals]);

  // -----------------------------
  // DEPARTMENT STATS
  // -----------------------------
  const departmentStats = useMemo(() => {
    const stats: Record<string, any> = {};

    departments.forEach((dept: any) => {
      const deptTappals = filteredTappals.filter(
        (t: any) => t.departmentId === dept.id
      );

      stats[dept.id] = {
        name: dept.departmentName,
        total: deptTappals.length,
        completed: deptTappals.filter((t: any) => t.status === "Completed")
          .length,

        pending: deptTappals.filter((t: any) => t.status === "Pending").length,

        inProgress: deptTappals.filter(
          (t: any) =>
            t.status === "In Progress" ||
            t.status === "FORWARDED" ||
            t.status === "Active"
        ).length,

        overdue: deptTappals.filter((t: any) => {
          const expiry = new Date(t.expiryDate);
          const today = new Date();
          return today > expiry && t.status !== "Completed";
        }).length,
      };
    });

    return stats;
  }, [departments, filteredTappals]);

  // -----------------------------
  // OVERALL STATS
  // -----------------------------
  const overallStats = useMemo(() => {
    const total = filteredTappals.length;

    const completed = filteredTappals.filter(
      (t: any) => t.status === "Completed"
    ).length;

    const pending = filteredTappals.filter(
      (t: any) => t.status === "Pending"
    ).length;

    const inProgress = filteredTappals.filter(
      (t: any) =>
        t.status === "In Progress" ||
        t.status === "FORWARDED" ||
        t.status === "Active"
    ).length;

    const overdue = filteredTappals.filter((t: any) => {
      const expiry = new Date(t.expiryDate);
      const today = new Date();
      return today > expiry && t.status !== "Completed";
    }).length;

    return { total, completed, pending, inProgress, overdue };
  }, [filteredTappals]);

  // -----------------------------
  // CHART DATA
  // -----------------------------
  const chartData = useMemo(() => {
    return Object.values(departmentStats).map((dept: any) => ({
      name: dept.name,
      total: dept.total,
      completed: dept.completed,
      pending: dept.pending,
      inProgress: dept.inProgress,
      overdue: dept.overdue,
    }));
  }, [departmentStats]);

  const maxValue = Math.max(...chartData.map((d) => d.total), 1);

  // --------------------------------------------------------
  // UI STARTS HERE — NO LOGIC CHANGED
  // --------------------------------------------------------
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Department Analytics
        </h1>
        <p className="text-gray-600">Analyze performance and workload across departments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p>Total</p>
              <p className="text-2xl font-bold">{overallStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p>Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {overallStats.completed}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p>In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {overallStats.inProgress}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p>Pending</p>
              <p className="text-2xl font-bold text-orange-600">
                {overallStats.pending}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between">
            <div>
              <p>Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {overallStats.overdue}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Tappals by Department</h2>
          </div>

          <div className="space-y-4">
            {chartData.map((dept: any, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span>{dept.name}</span>
                  <span>{dept.total}</span>
                </div>

                <div className="w-full bg-gray-200 h-3 rounded-full">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${(dept.total / maxValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-6">
            <PieChart className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold">Status Distribution</h2>
          </div>

          <div className="space-y-3">

            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span>Completed</span>
              </div>
              <span className="font-bold text-green-600">
                {overallStats.completed}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>In Progress</span>
              </div>
              <span className="font-bold text-blue-600">
                {overallStats.inProgress}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Pending</span>
              </div>
              <span className="font-bold text-orange-600">
                {overallStats.pending}
              </span>
            </div>

            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Overdue</span>
              </div>
              <span className="font-bold text-red-600">
                {overallStats.overdue}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Department Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Department Details</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-left">Completed</th>
                <th className="px-6 py-3 text-left">In Progress</th>
                <th className="px-6 py-3 text-left">Pending</th>
                <th className="px-6 py-3 text-left">Overdue</th>
                <th className="px-6 py-3 text-left">Completion Rate</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {chartData.map((dept: any, index) => (
                <tr key={index}>
                  <td className="px-6 py-4">{dept.name}</td>
                  <td className="px-6 py-4">{dept.total}</td>
                  <td className="px-6 py-4 text-green-600">{dept.completed}</td>
                  <td className="px-6 py-4 text-blue-600">{dept.inProgress}</td>
                  <td className="px-6 py-4 text-orange-600">{dept.pending}</td>
                  <td className="px-6 py-4 text-red-600">{dept.overdue}</td>
                  <td className="px-6 py-4">
                    {dept.total > 0
                      ? Math.round((dept.completed / dept.total) * 100)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FILTERED TAPPALS TABLE — FIXED ALIGNMENT ONLY */}
      {filteredTappals && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Tappals ({filteredTappals.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Tappal ID</th>
                  <th className="px-6 py-3 text-left">Subject</th>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Created</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredTappals.map((t: any) => (
                  <tr key={t.tappalId}>

                    <td className="px-6 py-4 whitespace-nowrap text-left text-blue-600">
                      {t.tappalId}
                    </td>

                    <td className="px-6 py-4 text-left truncate">
                      {t.subject}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      {t.departmentName}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          t.status
                        )}`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      {formatDate(t.createdAt)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

    </div>
  );
};

export default DepartmentAnalytics;
  