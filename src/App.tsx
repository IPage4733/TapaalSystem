 import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/ToastContainer';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Unauthorized from './components/Unauthorized';
import CollectorLayout from './components/collector/CollectorLayout';
import CollectorDashboardMain from './components/collector/CollectorDashboardMain';
import JointCollectorLayout from './components/joint-collector/JointCollectorLayout';
import JointCollectorDashboardMain from './components/joint-collector/JointCollectorDashboardMain';
import MyTappals from './components/joint-collector/MyTappals';
import OfficerTappals from './components/joint-collector/OfficerTappals';
import ForwardTappal from './components/joint-collector/ForwardTappal';
import TappalsOverview from './components/collector/TappalsOverview';
import GlobalSearch from './components/collector/GlobalSearch';
import DepartmentAnalytics from './components/collector/DepartmentAnalytics';
import EmployeePerformance from './components/collector/EmployeePerformance';
import OverdueTappals from './components/collector/OverdueTappals';
import TrackPetitions from './components/collector/TrackPetitions';
import ManageDepartments from './components/collector/ManageDepartments';
import ManageRole from './components/collector/ManageRole';
import UserManagement from './components/collector/UserManagement';
import CollectorCreateTappal from './components/collector/CreateTappal';
import TappalDetail from './components/tappal/TappalDetail';

// DRO Components
import DroLayout from './components/dro/DroLayout';
import DroDashboardMain from './components/dro/DroDashboardMain';
import DroMyTappals from './components/dro/MyTappals';
import DroOfficerTappals from './components/dro/OfficerTappals';
import DroForwardTappal from './components/dro/ForwardTappal';

// RDO Components
import RdoLayout from './components/rdo/RdoLayout';
import RdoDashboardMain from './components/rdo/RdoDashboardMain';
import RdoMyTappals from './components/rdo/MyTappals';
import RdoOfficerTappals from './components/rdo/OfficerTappals';
import RdoForwardTappal from './components/rdo/ForwardTappal';

// Tahsildar Components
import TahsildarLayout from './components/tahsildar/TahsildarLayout';
import TahsildarDashboardMain from './components/tahsildar/TahsildarDashboardMain';
import TahsildarMyTappals from './components/tahsildar/MyTappals';
import TahsildarOfficerTappals from './components/tahsildar/OfficerTappals';
import TahsildarForwardTappal from './components/tahsildar/ForwardTappal';
import TahsildarOverdueTappals from './components/tahsildar/OverdueTappals';
import TahsildarMandalAnalytics from './components/tahsildar/MandalAnalytics';
import TahsildarGlobalSearch from './components/tahsildar/GlobalSearch';

// Naib Tahsildar Components
import NaibLayout from './components/naib/NaibLayout';
import NaibDashboardMain from './components/naib/NaibDashboardMain';
import NaibMyTappals from './components/naib/MyTappals';
import NaibSubordinateTappals from './components/naib/SubordinateTappals';
import NaibForwardTappal from './components/naib/ForwardTappal';
import NaibOverdueTappals from './components/naib/OverdueTappals';
import NaibOfficerSummary from './components/naib/OfficerSummary';
import NaibGlobalSearch from './components/naib/GlobalSearch';

// RI Components
import RiLayout from './components/ri/RiLayout';
import RiDashboardMain from './components/ri/RiDashboardMain';
import RiMyTappals from './components/ri/MyTappals';
import RiVroTappals from './components/ri/VroTappals';
import RiForwardTappal from './components/ri/ForwardTappal';
import RiUploadAttachments from './components/ri/UploadAttachments';
import RiOverdueTappals from './components/ri/OverdueTappals';
import RiLightAnalytics from './components/ri/LightAnalytics';
import RiGlobalSearch from './components/ri/GlobalSearch';

// VRO Components
import VroLayout from './components/vro/VroLayout';
import VroDashboardMain from './components/vro/VroDashboardMain';
import VroMyTappals from './components/vro/MyTappals';
import VroForwardTappal from './components/vro/ForwardTappal';
import VroUploadAttachments from './components/vro/UploadAttachments';
import VroOverdueAlerts from './components/vro/OverdueAlerts';
import VroMyAnalytics from './components/vro/MyAnalytics';
import VroGlobalSearch from './components/vro/GlobalSearch';

// Dashboard Components
import JointCollectorDashboard from './components/dashboards/JointCollectorDashboard';
import DroDashboard from './components/dashboards/DroDashboard';
import RdoDashboard from './components/dashboards/RdoDashboard';
import TahsildarDashboard from './components/dashboards/TahsildarDashboard';
import NaibDashboard from './components/dashboards/NaibDashboard';
import RiDashboard from './components/dashboards/RiDashboard';
import VroDashboard from './components/dashboards/VroDashboard';
import ClerkPanel from './components/dashboards/ClerkPanel';

// Clerk Components
import ClerkLayout from './components/clerk/ClerkLayout';
import ClerkDashboardMain from './components/clerk/ClerkDashboardMain';
import CreateTappal from './components/clerk/CreateTappal';
import ClerkMyTappals from './components/clerk/MyTappals';
import ConfidentialTappals from './components/clerk/ConfidentialTappals';
import ClerkSearch from './components/clerk/ClerkSearch';
import ClerkTrackPetitions from './components/clerk/TrackPetitions';

// Co-Officer Components
import CoOfficerLayout from './components/co-officer/CoOfficerLayout';
import CoOfficerDashboardMain from './components/co-officer/CoOfficerDashboardMain';
import ManageOfficers from './components/co-officer/ManageOfficers';
import CreateOfficer from './components/co-officer/CreateOfficer';
import ManageAssignments from './components/co-officer/ManageAssignments';
import SystemAnalytics from './components/co-officer/SystemAnalytics';
import PerformanceReports from './components/co-officer/PerformanceReports';
import CoOfficerTrackPetitions from './components/co-officer/TrackPetitions';
import CoOfficerCreateTappal from './components/co-officer/CreateTappal';

// User Portal Components
import UserPortalLayout from './components/user-portal/UserPortalLayout';
import UserPortalHome from './components/user-portal/UserPortalHome';
import SubmitPetition from './components/user-portal/SubmitPetition';
import TrackPetition from './components/user-portal/TrackPetition';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* User Portal Routes - Public Access */}
            <Route path="/user-portal/*" element={<UserPortalLayout />}>
              <Route index element={<UserPortalHome />} />
              <Route path="submit" element={<SubmitPetition />} />
              <Route path="track" element={<TrackPetition />} />
            </Route>
            
            {/* Tappal Detail Route - Accessible by all authenticated users */}
            <Route 
              path="/tappal/:tappalId" 
              element={
                <ProtectedRoute>
                  <TappalDetail />
                </ProtectedRoute>
              } 
            />
            
            {/* Collector Dashboard Routes */}
            <Route 
              path="/collector-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['collector']}>
                  <CollectorLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<CollectorDashboardMain />} />
              <Route path="tappals" element={<TappalsOverview />} />
              <Route path="create-tappal" element={<CollectorCreateTappal />} />
              <Route path="search" element={<GlobalSearch />} />
              <Route path="department-analytics" element={<DepartmentAnalytics />} />
              <Route path="employee-performance" element={<EmployeePerformance />} />
              <Route path="overdue" element={<OverdueTappals />} />
              <Route path="petitions" element={<TrackPetitions />} />
              <Route path="departments" element={<ManageDepartments />} />
              <Route path="role" element={<ManageRole />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
            
            {/* Joint Collector Dashboard Routes */}
            <Route 
              path="/joint-collector-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['joint_collector']}>
                  <JointCollectorLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<JointCollectorDashboardMain />} />
              <Route path="my-tappals" element={<MyTappals />} />
              <Route path="officer-tappals" element={<OfficerTappals />} />
              <Route path="forward-tappal" element={<ForwardTappal />} />
              <Route path="overdue" element={<OverdueTappals />} />
              <Route path="analytics" element={<DepartmentAnalytics />} />
              <Route path="search" element={<GlobalSearch />} />
              <Route path="petitions" element={<TrackPetitions />} />
              <Route path="all-tappals" element={<TappalsOverview />} />
            </Route>
            
            {/* DRO Dashboard Routes */}
            <Route 
              path="/dro-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['dro']}>
                  <DroLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<DroDashboardMain />} />
              <Route path="my-tappals" element={<DroMyTappals />} />
              <Route path="officer-tappals" element={<DroOfficerTappals />} />
              <Route path="forward-tappal" element={<DroForwardTappal />} />
              <Route path="overdue" element={<OverdueTappals />} />
              <Route path="analytics" element={<DepartmentAnalytics />} />
              <Route path="search" element={<GlobalSearch />} />
            </Route>
            
            {/* RDO Dashboard Routes */}
            <Route 
              path="/rdo-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['rdo']}>
                  <RdoLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<RdoDashboardMain />} />
              <Route path="my-tappals" element={<RdoMyTappals />} />
              <Route path="officer-tappals" element={<RdoOfficerTappals />} />
              <Route path="forward-tappal" element={<RdoForwardTappal />} />
              <Route path="overdue" element={<OverdueTappals />} />
              <Route path="analytics" element={<DepartmentAnalytics />} />
              <Route path="search" element={<GlobalSearch />} />
            </Route>
            
            {/* Tahsildar Dashboard Routes */}
            <Route 
              path="/tahsildar-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['tahsildar']}>
                  <TahsildarLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<TahsildarDashboardMain />} />
              <Route path="my-tappals" element={<TahsildarMyTappals />} />
              <Route path="officer-tappals" element={<TahsildarOfficerTappals />} />
              <Route path="forward-tappal" element={<TahsildarForwardTappal />} />
              <Route path="overdue" element={<TahsildarOverdueTappals />} />
              <Route path="analytics" element={<TahsildarMandalAnalytics />} />
              <Route path="search" element={<TahsildarGlobalSearch />} />
            </Route>
            
            {/* Naib Tahsildar Dashboard Routes */}
            <Route 
              path="/naib-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['naib_tahsildar']}>
                  <NaibLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<NaibDashboardMain />} />
              <Route path="my-tappals" element={<NaibMyTappals />} />
              <Route path="subordinate-tappals" element={<NaibSubordinateTappals />} />
              <Route path="forward-tappal" element={<NaibForwardTappal />} />
              <Route path="overdue" element={<NaibOverdueTappals />} />
              <Route path="analytics" element={<NaibOfficerSummary />} />
              <Route path="search" element={<NaibGlobalSearch />} />
            </Route>
            
            {/* RI Dashboard Routes */}
            <Route 
              path="/ri-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['ri']}>
                  <RiLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<RiDashboardMain />} />
              <Route path="my-tappals" element={<RiMyTappals />} />
              <Route path="vro-tappals" element={<RiVroTappals />} />
              <Route path="forward-tappal" element={<RiForwardTappal />} />
              <Route path="attachments" element={<RiUploadAttachments />} />
              <Route path="overdue" element={<RiOverdueTappals />} />
              <Route path="analytics" element={<RiLightAnalytics />} />
              <Route path="search" element={<RiGlobalSearch />} />
            </Route>
            
            {/* VRO Dashboard Routes */}
            <Route 
              path="/vro-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['vro']}>
                  <VroLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<VroDashboardMain />} />
              <Route path="my-tappals" element={<VroMyTappals />} />
              <Route path="forward-tappal" element={<VroForwardTappal />} />
              <Route path="attachments" element={<VroUploadAttachments />} />
              <Route path="overdue" element={<VroOverdueAlerts />} />
              <Route path="analytics" element={<VroMyAnalytics />} />
              <Route path="search" element={<VroGlobalSearch />} />
            </Route>
            
            {/* Clerk Dashboard Routes */}
            
            {/* Other Protected Dashboard Routes */}
            <Route 
              path="/joint-collector-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['joint_collector']}>
                  <JointCollectorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dro-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['dro']}>
                  <DroDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rdo-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['rdo']}>
                  <RdoDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tahsildar-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['tahsildar']}>
                  <TahsildarDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/naib-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['naib_tahsildar']}>
                  <NaibDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ri-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['ri']}>
                  <RiDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/vro-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['vro']}>
                  <VroDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/clerk-dashboard" 
              element={
                <ProtectedRoute allowedRoles={['clerk']}>
                  <ClerkLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<ClerkDashboardMain />} />
             <Route path="petitions" element={<ClerkTrackPetitions />} />
              <Route path="create-tappal" element={<CreateTappal />} />
              <Route path="my-tappals" element={<ClerkMyTappals />} />
              <Route path="confidential-tappals" element={<ConfidentialTappals />} />
              <Route path="search" element={<ClerkSearch />} />
            </Route>
            
            {/* Co-Officer Dashboard Routes */}
            <Route 
              path="/co-officer-dashboard/*" 
              element={
                <ProtectedRoute allowedRoles={['co_officer']}>
                  <CoOfficerLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<CoOfficerDashboardMain />} />
              <Route path="petitions" element={<CoOfficerTrackPetitions />} />
              <Route path="create-tappal" element={<CoOfficerCreateTappal />} />
              <Route path="officers" element={<ManageOfficers />} />
              <Route path="create-officer" element={<CreateOfficer />} />
              <Route path="assignments" element={<ManageAssignments />} />
              <Route path="departments" element={<ManageDepartments />} />
              <Route path="role" element={<ManageRole />} />
              <Route path="analytics" element={<SystemAnalytics />} />
              <Route path="performance" element={<PerformanceReports />} />
              <Route path="search" element={<GlobalSearch />} />
              <Route path="settings" element={<UserManagement />} />
            </Route>
            <Route path="/managerole" element={<ManageRole/>} />
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/user-portal" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;