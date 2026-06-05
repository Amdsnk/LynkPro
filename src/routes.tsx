import type { ReactNode } from 'react';
import DashboardPage from './pages/DashboardPage';
import CommandCenterPage from './pages/CommandCenterPage';
import FinancialIntelligencePage from './pages/FinancialIntelligencePage';
import FieldOperationsPage from './pages/FieldOperationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SetupDemoUsersPage from './pages/SetupDemoUsersPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectCreatePage from './pages/projects/ProjectCreatePage';
import ProjectFilesPage from './pages/projects/ProjectFilesPage';
import ProjectTimelinePage from './pages/projects/ProjectTimelinePage';
import ProjectPhotosPage from './pages/projects/ProjectPhotosPage';
import ClientListPage from './pages/clients/ClientListPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import ClientCreatePage from './pages/clients/ClientCreatePage';
import ProposalListPage from './pages/proposals/ProposalListPage';
import ProposalFormPage from './pages/proposals/ProposalFormPage';
import ProposalDetailPage from './pages/proposals/ProposalDetailPage';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import InvoiceFormPage from './pages/invoices/InvoiceFormPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import ReportListPage from './pages/reports/ReportListPage';
import ReportFormPage from './pages/reports/ReportFormPage';
import ReportDetailPage from './pages/reports/ReportDetailPage';
import ReportCenterPage from './pages/reports/ReportCenterPage';
import MaterialsInventoryReportPage from './pages/reports/MaterialsInventoryReportPage';
import EquipmentUtilizationReportPage from './pages/reports/EquipmentUtilizationReportPage';
import SafetyIncidentSummaryReportPage from './pages/reports/SafetyIncidentSummaryReportPage';
import BudgetVarianceAnalysisReportPage from './pages/reports/BudgetVarianceAnalysisReportPage';
import ExportHistoryPage from './pages/reports/ExportHistoryPage';
import MaterialListPage from './pages/materials/MaterialListPage';
import MaterialDetailPage from './pages/materials/MaterialDetailPage';
import EquipmentListPage from './pages/equipment/EquipmentListPage';
import EquipmentDetailPage from './pages/equipment/EquipmentDetailPage';
import SafetyIncidentListPage from './pages/safety/SafetyIncidentListPage';
import SafetyIncidentDetailPage from './pages/safety/SafetyIncidentDetailPage';
import BudgetVarianceListPage from './pages/budget/BudgetVarianceListPage';
import BudgetVarianceDetailPage from './pages/budget/BudgetVarianceDetailPage';
import AdminPage from './pages/admin/AdminPage';
import InvitationsPage from './pages/admin/InvitationsPage';
import ActivityLogPage from './pages/admin/ActivityLogPage';
import SharePage from './pages/SharePage';
import ShareAnalyticsPage from './pages/ShareAnalyticsPage';
import PaymentSuccessPage from './pages/payment/PaymentSuccessPage';
import OrderHistoryPage from './pages/payment/OrderHistoryPage';
import TimeEntriesPage from './pages/time/TimeEntriesPage';
import RecurringInvoicesPage from './pages/invoices/RecurringInvoicesPage';
import PermitListPage from './pages/permits/PermitListPage';
import PermitDetailPage from './pages/permits/PermitDetailPage';
import PermitFormPage from './pages/permits/PermitFormPage';
import PermitCalendarPage from './pages/permits/PermitCalendarPage';
import SubcontractorListPage from './pages/workforce/SubcontractorListPage';
import SubcontractorDetailPage from './pages/workforce/SubcontractorDetailPage';
import SubcontractorFormPage from './pages/workforce/SubcontractorFormPage';
import SubcontractorAssignmentPage from './pages/workforce/SubcontractorAssignmentPage';
import SubcontractorPerformancePage from './pages/workforce/SubcontractorPerformancePage';
import SkillMatrixPage from './pages/workforce/SkillMatrixPage';
import WorkerSkillProfilePage from './pages/workforce/WorkerSkillProfilePage';
import TaskAssignmentPage from './pages/workforce/TaskAssignmentPage';
import SkillGapAnalysisPage from './pages/workforce/SkillGapAnalysisPage';
import ProductivityDashboard from './pages/workforce/ProductivityDashboard';
import ProductivityAnalyticsPage from './pages/workforce/ProductivityAnalyticsPage';
import CrewPerformancePage from './pages/workforce/CrewPerformancePage';
import VendorListPage from './pages/procurement/VendorListPage';
import VendorDetailPage from './pages/procurement/VendorDetailPage';
import VendorFormPage from './pages/procurement/VendorFormPage';
import VendorPerformancePage from './pages/procurement/VendorPerformancePage';
import PurchaseRequisitionListPage from './pages/procurement/PurchaseRequisitionListPage';
import PurchaseRequisitionFormPage from './pages/procurement/PurchaseRequisitionFormPage';
import PurchaseRequisitionDetailPage from './pages/procurement/PurchaseRequisitionDetailPage';
import ApprovalDashboard from './pages/procurement/ApprovalDashboard';
import PurchaseOrderListPage from './pages/procurement/PurchaseOrderListPage';
import MaterialForecastingPage from './pages/procurement/MaterialForecastingPage';
import MaterialConsumptionPage from './pages/procurement/MaterialConsumptionPage';
import ReorderAlertsPage from './pages/procurement/ReorderAlertsPage';

// Phase 4: Safety & Compliance
import SafetyAuditTemplateListPage from './pages/safety/SafetyAuditTemplateListPage';
import SafetyAuditListPage from './pages/safety/SafetyAuditListPage';
import SafetyAuditFormPage from './pages/safety/SafetyAuditFormPage';
import SafetyAuditDetailPage from './pages/safety/SafetyAuditDetailPage';
import CorrectiveActionTracker from './pages/safety/CorrectiveActionTracker';
import ComplianceChecklistPage from './pages/safety/ComplianceChecklistPage';
import ComplianceRequirementsPage from './pages/safety/ComplianceRequirementsPage';
import ComplianceDashboard from './pages/safety/ComplianceDashboard';
import RiskHeatmapPage from './pages/safety/RiskHeatmapPage';
import RiskAssessmentPage from './pages/safety/RiskAssessmentPage';
import RiskPredictionDashboard from './pages/safety/RiskPredictionDashboard';

// Phase 5: AI-Powered Intelligence
import DelayPredictionDashboard from './pages/ai/DelayPredictionDashboard';
import DelayAnalysisPage from './pages/ai/DelayAnalysisPage';
import MitigationRecommendationsPage from './pages/ai/MitigationRecommendationsPage';
import BudgetPredictionDashboard from './pages/ai/BudgetPredictionDashboard';
import CostVarianceForecast from './pages/ai/CostVarianceForecast';
import CostSavingRecommendations from './pages/ai/CostSavingRecommendations';
import AIPhotoAnalysisPage from './pages/ai/AIPhotoAnalysisPage';
import DetectedIssuesPage from './pages/ai/DetectedIssuesPage';

// Phase 6: Advanced Features & Integrations
import BIMModelListPage from './pages/bim/BIMModelListPage';
import BIMViewerPage from './pages/bim/BIMViewerPage';
import BIMIssueTrackingPage from './pages/bim/BIMIssueTrackingPage';
import ChangeOrderListPage from './pages/changeorders/ChangeOrderListPage';
import ChangeOrderFormPage from './pages/changeorders/ChangeOrderFormPage';
import ChangeOrderDetailPage from './pages/changeorders/ChangeOrderDetailPage';
import ChangeOrderAnalyticsPage from './pages/changeorders/ChangeOrderAnalyticsPage';
import MapDashboard from './pages/location/MapDashboard';
import GeofenceManagementPage from './pages/location/GeofenceManagementPage';
import LocationHistoryPage from './pages/location/LocationHistoryPage';
import AttendanceGeofencePage from './pages/location/AttendanceGeofencePage';
import RiskComplianceDashboard from './pages/dashboards/RiskComplianceDashboard';
import AIInsightsDashboard from './pages/dashboards/AIInsightsDashboard';
import CalendarDashboard from './pages/dashboards/CalendarDashboard';
import ProjectMapDashboard from './pages/dashboards/ProjectMapDashboard';
import ClientPortalDashboard from './pages/portals/ClientPortalDashboard';
import SubcontractorPortalDashboard from './pages/portals/SubcontractorPortalDashboard';
import PortalAccessManagement from './pages/portals/PortalAccessManagement';
import IoTDashboard from './pages/iot/IoTDashboard';
import EquipmentTelemetryPage from './pages/iot/EquipmentTelemetryPage';
import EnvironmentalMonitoringPage from './pages/iot/EnvironmentalMonitoringPage';
import ConcreteCuringPage from './pages/iot/ConcreteCuringPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Command Center',
    path: '/',
    element: <CommandCenterPage />,
  },
  {
    name: 'Dashboard (Legacy)',
    path: '/dashboard-legacy',
    element: <DashboardPage />,
    visible: false,
  },
  {
    name: 'Financial Intelligence',
    path: '/financial-intelligence',
    element: <FinancialIntelligencePage />,
  },
  {
    name: 'Field Operations',
    path: '/field-operations',
    element: <FieldOperationsPage />,
  },
  {
    name: 'Analytics',
    path: '/analytics',
    element: <AnalyticsPage />,
  },
  {
    name: 'Projects',
    path: '/projects',
    element: <ProjectListPage />,
  },
  {
    name: 'Create Project',
    path: '/projects/new',
    element: <ProjectCreatePage />,
  },
  {
    name: 'Project Detail',
    path: '/projects/:id',
    element: <ProjectDetailPage />,
  },
  {
    name: 'Project Files',
    path: '/projects/:id/files',
    element: <ProjectFilesPage />,
  },
  {
    name: 'Project Timeline',
    path: '/projects/:id/timeline',
    element: <ProjectTimelinePage />,
  },
  {
    name: 'Project Photos',
    path: '/projects/:projectId/photos',
    element: <ProjectPhotosPage />,
  },
  {
    name: 'Permits',
    path: '/permits',
    element: <PermitListPage />,
  },
  {
    name: 'Permit Calendar',
    path: '/permits/calendar',
    element: <PermitCalendarPage />,
  },
  {
    name: 'Permit Detail',
    path: '/permits/:id',
    element: <PermitDetailPage />,
  },
  {
    name: 'Create Permit',
    path: '/permits/new',
    element: <PermitFormPage />,
  },
  {
    name: 'Edit Permit',
    path: '/permits/:id/edit',
    element: <PermitFormPage />,
  },
  {
    name: 'Clients',
    path: '/clients',
    element: <ClientListPage />,
  },
  {
    name: 'Create Client',
    path: '/clients/new',
    element: <ClientCreatePage />,
  },
  {
    name: 'Client Detail',
    path: '/clients/:id',
    element: <ClientDetailPage />,
  },
  {
    name: 'Proposals',
    path: '/proposals',
    element: <ProposalListPage />,
  },
  {
    name: 'Create Proposal',
    path: '/proposals/new',
    element: <ProposalFormPage />,
  },
  {
    name: 'Edit Proposal',
    path: '/proposals/:id/edit',
    element: <ProposalFormPage />,
  },
  {
    name: 'Proposal Detail',
    path: '/proposals/:id',
    element: <ProposalDetailPage />,
  },
  {
    name: 'Invoices',
    path: '/invoices',
    element: <InvoiceListPage />,
  },
  {
    name: 'Create Invoice',
    path: '/invoices/new',
    element: <InvoiceFormPage />,
  },
  {
    name: 'Edit Invoice',
    path: '/invoices/:id/edit',
    element: <InvoiceFormPage />,
  },
  {
    name: 'Invoice Detail',
    path: '/invoices/:id',
    element: <InvoiceDetailPage />,
  },
  {
    name: 'Report Center',
    path: '/reports',
    element: <ReportCenterPage />,
  },
  {
    name: 'Materials Inventory Report',
    path: '/reports/materials-inventory',
    element: <MaterialsInventoryReportPage />,
  },
  {
    name: 'Equipment Utilization Report',
    path: '/reports/equipment-utilization',
    element: <EquipmentUtilizationReportPage />,
  },
  {
    name: 'Safety Incident Summary Report',
    path: '/reports/safety-incidents',
    element: <SafetyIncidentSummaryReportPage />,
  },
  {
    name: 'Budget Variance Analysis Report',
    path: '/reports/budget-variance',
    element: <BudgetVarianceAnalysisReportPage />,
  },
  {
    name: 'Export History',
    path: '/reports/export-history',
    element: <ExportHistoryPage />,
  },
  {
    name: 'Reports (Legacy)',
    path: '/reports-legacy',
    element: <ReportListPage />,
    visible: false,
  },
  {
    name: 'Create Report',
    path: '/reports-legacy/new',
    element: <ReportFormPage />,
    visible: false,
  },
  {
    name: 'Edit Report',
    path: '/reports-legacy/:id/edit',
    element: <ReportFormPage />,
    visible: false,
  },
  {
    name: 'Report Detail',
    path: '/reports-legacy/:id',
    element: <ReportDetailPage />,
    visible: false,
  },
  {
    name: 'Materials',
    path: '/materials',
    element: <MaterialListPage />,
  },
  {
    name: 'Material Detail',
    path: '/materials/:id',
    element: <MaterialDetailPage />,
  },
  {
    name: 'Equipment',
    path: '/equipment',
    element: <EquipmentListPage />,
  },
  {
    name: 'Equipment Detail',
    path: '/equipment/:id',
    element: <EquipmentDetailPage />,
  },
  {
    name: 'Safety Incidents',
    path: '/safety/incidents',
    element: <SafetyIncidentListPage />,
  },
  {
    name: 'Safety Incident Detail',
    path: '/safety/incidents/:id',
    element: <SafetyIncidentDetailPage />,
  },
  {
    name: 'Budget Variance',
    path: '/budget/variance',
    element: <BudgetVarianceListPage />,
  },
  {
    name: 'Budget Variance Detail',
    path: '/budget/variance/:id',
    element: <BudgetVarianceDetailPage />,
  },
  {
    name: 'Admin',
    path: '/admin',
    element: <AdminPage />,
  },
  {
    name: 'Invitations',
    path: '/admin/invitations',
    element: <InvitationsPage />,
  },
  {
    name: 'Activity Log',
    path: '/admin/activity',
    element: <ActivityLogPage />,
  },
  {
    name: 'Share Analytics',
    path: '/analytics/shares',
    element: <ShareAnalyticsPage />,
  },
  {
    name: 'Payment Success',
    path: '/payment-success',
    element: <PaymentSuccessPage />,
    visible: false,
  },
  {
    name: 'Order History',
    path: '/orders',
    element: <OrderHistoryPage />,
  },
  {
    name: 'Time Entries',
    path: '/time-entries',
    element: <TimeEntriesPage />,
  },
  {
    name: 'Recurring Invoices',
    path: '/recurring-invoices',
    element: <RecurringInvoicesPage />,
  },
  {
    name: 'Subcontractors',
    path: '/subcontractors',
    element: <SubcontractorListPage />,
  },
  {
    name: 'Subcontractor Detail',
    path: '/subcontractors/:id',
    element: <SubcontractorDetailPage />,
    visible: false,
  },
  {
    name: 'New Subcontractor',
    path: '/subcontractors/new',
    element: <SubcontractorFormPage />,
    visible: false,
  },
  {
    name: 'Edit Subcontractor',
    path: '/subcontractors/:id/edit',
    element: <SubcontractorFormPage />,
    visible: false,
  },
  {
    name: 'Subcontractor Assignments',
    path: '/subcontractors/assignments',
    element: <SubcontractorAssignmentPage />,
  },
  {
    name: 'Subcontractor Performance',
    path: '/subcontractors/performance',
    element: <SubcontractorPerformancePage />,
  },
  {
    name: 'Skill Matrix',
    path: '/workforce/skills',
    element: <SkillMatrixPage />,
  },
  {
    name: 'Worker Skill Profile',
    path: '/workforce/skills/:id',
    element: <WorkerSkillProfilePage />,
    visible: false,
  },
  {
    name: 'Task Assignment',
    path: '/workforce/tasks',
    element: <TaskAssignmentPage />,
  },
  {
    name: 'Skill Gap Analysis',
    path: '/workforce/skill-gaps',
    element: <SkillGapAnalysisPage />,
  },
  {
    name: 'Productivity Dashboard',
    path: '/workforce/productivity',
    element: <ProductivityDashboard />,
  },
  {
    name: 'Productivity Analytics',
    path: '/workforce/productivity/analytics',
    element: <ProductivityAnalyticsPage />,
  },
  {
    name: 'Crew Performance',
    path: '/workforce/crews',
    element: <CrewPerformancePage />,
  },
  {
    name: 'Vendors',
    path: '/vendors',
    element: <VendorListPage />,
  },
  {
    name: 'Vendor Detail',
    path: '/vendors/:id',
    element: <VendorDetailPage />,
    visible: false,
  },
  {
    name: 'New Vendor',
    path: '/vendors/new',
    element: <VendorFormPage />,
    visible: false,
  },
  {
    name: 'Edit Vendor',
    path: '/vendors/:id/edit',
    element: <VendorFormPage />,
    visible: false,
  },
  {
    name: 'Vendor Performance',
    path: '/vendors/performance',
    element: <VendorPerformancePage />,
  },
  {
    name: 'Purchase Requisitions',
    path: '/requisitions',
    element: <PurchaseRequisitionListPage />,
  },
  {
    name: 'New Requisition',
    path: '/requisitions/new',
    element: <PurchaseRequisitionFormPage />,
    visible: false,
  },
  {
    name: 'Requisition Detail',
    path: '/requisitions/:id',
    element: <PurchaseRequisitionDetailPage />,
    visible: false,
  },
  {
    name: 'Approval Dashboard',
    path: '/approvals',
    element: <ApprovalDashboard />,
  },
  {
    name: 'Purchase Orders',
    path: '/purchase-orders',
    element: <PurchaseOrderListPage />,
  },
  {
    name: 'Material Forecasting',
    path: '/forecasting',
    element: <MaterialForecastingPage />,
  },
  {
    name: 'Material Consumption',
    path: '/consumption',
    element: <MaterialConsumptionPage />,
  },
  {
    name: 'Reorder Alerts',
    path: '/reorder-alerts',
    element: <ReorderAlertsPage />,
  },
  // Phase 4: Safety & Compliance Routes
  {
    name: 'Safety Audit Templates',
    path: '/safety/templates',
    element: <SafetyAuditTemplateListPage />,
  },
  {
    name: 'Safety Audit Template Detail',
    path: '/safety/templates/:id',
    element: <SafetyAuditTemplateListPage />,
    visible: false,
  },
  {
    name: 'New Safety Audit Template',
    path: '/safety/templates/new',
    element: <SafetyAuditTemplateListPage />,
    visible: false,
  },
  {
    name: 'Safety Audits',
    path: '/safety/audits',
    element: <SafetyAuditListPage />,
  },
  {
    name: 'New Safety Audit',
    path: '/safety/audits/new',
    element: <SafetyAuditFormPage />,
    visible: false,
  },
  {
    name: 'Safety Audit Detail',
    path: '/safety/audits/:id',
    element: <SafetyAuditDetailPage />,
    visible: false,
  },
  {
    name: 'Corrective Actions',
    path: '/safety/corrective-actions',
    element: <CorrectiveActionTracker />,
  },
  {
    name: 'Compliance Checklist',
    path: '/safety/compliance',
    element: <ComplianceChecklistPage />,
  },
  {
    name: 'Compliance Requirements',
    path: '/safety/compliance/requirements',
    element: <ComplianceRequirementsPage />,
  },
  {
    name: 'Compliance Dashboard',
    path: '/safety/compliance/dashboard',
    element: <ComplianceDashboard />,
  },
  {
    name: 'Risk Heatmap',
    path: '/safety/risk-heatmap',
    element: <RiskHeatmapPage />,
  },
  {
    name: 'Risk Assessment',
    path: '/safety/risk-assessment',
    element: <RiskAssessmentPage />,
  },
  {
    name: 'Risk Predictions',
    path: '/safety/risk-predictions',
    element: <RiskPredictionDashboard />,
  },
  // Phase 5: AI-Powered Intelligence
  {
    name: 'AI Delay Predictions',
    path: '/ai/delay-predictions',
    element: <DelayPredictionDashboard />,
  },
  {
    name: 'Delay Analysis',
    path: '/ai/delay-analysis/:projectId',
    element: <DelayAnalysisPage />,
    visible: false,
  },
  {
    name: 'Mitigation Recommendations',
    path: '/ai/mitigation/:projectId',
    element: <MitigationRecommendationsPage />,
    visible: false,
  },
  {
    name: 'AI Budget Predictions',
    path: '/ai/budget-predictions',
    element: <BudgetPredictionDashboard />,
  },
  {
    name: 'Cost Variance Forecast',
    path: '/ai/budget-variance/:projectId',
    element: <CostVarianceForecast />,
    visible: false,
  },
  {
    name: 'Cost Savings',
    path: '/ai/cost-savings/:projectId',
    element: <CostSavingRecommendations />,
    visible: false,
  },
  {
    name: 'AI Photo Analysis',
    path: '/ai/photo-analysis',
    element: <AIPhotoAnalysisPage />,
  },
  {
    name: 'Detected Issues',
    path: '/ai/detected-issues',
    element: <DetectedIssuesPage />,
    visible: false,
  },
  // Phase 6: Advanced Features & Integrations
  {
    name: 'BIM Models',
    path: '/bim/models',
    element: <BIMModelListPage />,
  },
  {
    name: 'BIM Viewer',
    path: '/bim/viewer/:modelId',
    element: <BIMViewerPage />,
    visible: false,
  },
  {
    name: 'BIM Issue Tracking',
    path: '/bim/issues',
    element: <BIMIssueTrackingPage />,
  },
  {
    name: 'Change Orders',
    path: '/change-orders',
    element: <ChangeOrderListPage />,
  },
  {
    name: 'New Change Order',
    path: '/change-orders/new',
    element: <ChangeOrderFormPage />,
    visible: false,
  },
  {
    name: 'Change Order Detail',
    path: '/change-orders/:id',
    element: <ChangeOrderDetailPage />,
    visible: false,
  },
  {
    name: 'Change Order Analytics',
    path: '/change-orders/analytics',
    element: <ChangeOrderAnalyticsPage />,
  },
  {
    name: 'Location Map',
    path: '/location/map',
    element: <MapDashboard />,
  },
  {
    name: 'Geofence Management',
    path: '/location/geofences',
    element: <GeofenceManagementPage />,
  },
  {
    name: 'Location History',
    path: '/location/history',
    element: <LocationHistoryPage />,
  },
  {
    name: 'Geofence Attendance',
    path: '/location/attendance',
    element: <AttendanceGeofencePage />,
  },
  {
    name: 'Risk & Compliance',
    path: '/dashboards/risk-compliance',
    element: <RiskComplianceDashboard />,
  },
  {
    name: 'AI Insights',
    path: '/dashboards/ai-insights',
    element: <AIInsightsDashboard />,
  },
  {
    name: 'Calendar',
    path: '/dashboards/calendar',
    element: <CalendarDashboard />,
  },
  {
    name: 'Project Map',
    path: '/dashboards/project-map',
    element: <ProjectMapDashboard />,
  },
  {
    name: 'Client Portal',
    path: '/portals/client',
    element: <ClientPortalDashboard />,
  },
  {
    name: 'Subcontractor Portal',
    path: '/portals/subcontractor',
    element: <SubcontractorPortalDashboard />,
  },
  {
    name: 'Portal Access',
    path: '/portals/access',
    element: <PortalAccessManagement />,
  },
  {
    name: 'IoT Dashboard',
    path: '/iot/dashboard',
    element: <IoTDashboard />,
  },
  {
    name: 'Equipment Telemetry',
    path: '/iot/equipment',
    element: <EquipmentTelemetryPage />,
  },
  {
    name: 'Environmental Monitoring',
    path: '/iot/environmental',
    element: <EnvironmentalMonitoringPage />,
  },
  {
    name: 'Concrete Curing',
    path: '/iot/concrete',
    element: <ConcreteCuringPage />,
  },
  {
    name: 'Setup Demo Users',
    path: '/setup-demo-users',
    element: <SetupDemoUsersPage />,
    public: true,
    visible: false,
  },
  {
    name: 'Share',
    path: '/share/:token',
    element: <SharePage />,
    public: true,
    visible: false,
  },
];
