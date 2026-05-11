import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.signature.deleteMany();
  await prisma.documentField.deleteMany();
  await prisma.documentShare.deleteMany();
  await prisma.documentActivity.deleteMany();
  await prisma.document.deleteMany();
  await prisma.template.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.session.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemConfig.deleteMany();

  // ============ CREATE DEPARTMENTS ============
  console.log('📁 Creating departments...');
  const engDept = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG', description: 'Software Engineering Department' },
  });
  const salesDept = await prisma.department.create({
    data: { name: 'Sales', code: 'SALES', description: 'Sales and Business Development' },
  });
  const hrDept = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR', description: 'Human Resources and People Operations' },
  });
  const finDept = await prisma.department.create({
    data: { name: 'Finance', code: 'FIN', description: 'Finance and Accounting' },
  });
  const legalDept = await prisma.department.create({
    data: { name: 'Legal', code: 'LEGAL', description: 'Legal and Compliance' },
  });
  const procDept = await prisma.department.create({
    data: { name: 'Procurement', code: 'PROC', description: 'Procurement and Vendor Management' },
  });

  // ============ CREATE USERS ============
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'admin@company.com', name: 'Sarah Chen', role: 'super_admin', departmentId: engDept.id, jobTitle: 'Chief Technology Officer', phone: '+1-555-0100', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'sysadmin@company.com', name: 'Marcus Rivera', role: 'system_admin', departmentId: engDept.id, jobTitle: 'IT Infrastructure Manager', phone: '+1-555-0101', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'hr@company.com', name: 'Elena Volkov', role: 'hr', departmentId: hrDept.id, jobTitle: 'HR Director', phone: '+1-555-0102', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'finance@company.com', name: 'David Park', role: 'finance', departmentId: finDept.id, jobTitle: 'Finance Manager', phone: '+1-555-0103', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'procurement@company.com', name: 'Aisha Johnson', role: 'procurement', departmentId: procDept.id, jobTitle: 'Procurement Lead', phone: '+1-555-0104', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'legal@company.com', name: "James O'Brien", role: 'legal', departmentId: legalDept.id, jobTitle: 'Legal Counsel', phone: '+1-555-0105', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'mgr-eng@company.com', name: 'Raj Patel', role: 'dept_manager', departmentId: engDept.id, jobTitle: 'Engineering Manager', phone: '+1-555-0106', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'mgr-sales@company.com', name: 'Lisa Wang', role: 'dept_manager', departmentId: salesDept.id, jobTitle: 'Sales Director', phone: '+1-555-0107', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'emp1@company.com', name: 'Tom Anderson', role: 'employee', departmentId: engDept.id, jobTitle: 'Senior Software Engineer', phone: '+1-555-0108', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'emp2@company.com', name: 'Maria Garcia', role: 'employee', departmentId: salesDept.id, jobTitle: 'Account Executive', phone: '+1-555-0109', isActive: true },
    }),
    prisma.user.create({
      data: { email: 'external@partner.com', name: 'Chris External', role: 'external_signer', jobTitle: 'Partner Representative', phone: '+1-555-0200', isActive: true },
    }),
  ]);

  const [admin, sysAdmin, hrUser, financeUser, procurementUser, legalUser, mgrEng, mgrSales, emp1, emp2, externalUser] = users;

  // Update department managers
  await prisma.department.update({ where: { id: engDept.id }, data: { managerId: mgrEng.id } });
  await prisma.department.update({ where: { id: salesDept.id }, data: { managerId: mgrSales.id } });
  await prisma.department.update({ where: { id: hrDept.id }, data: { managerId: hrUser.id } });
  await prisma.department.update({ where: { id: finDept.id }, data: { managerId: financeUser.id } });
  await prisma.department.update({ where: { id: legalDept.id }, data: { managerId: legalUser.id } });
  await prisma.department.update({ where: { id: procDept.id }, data: { managerId: procurementUser.id } });

  // ============ CREATE FOLDERS ============
  console.log('📂 Creating folders...');
  const contractsFolder = await prisma.folder.create({
    data: { name: 'Contracts' },
  });
  const financialFolder = await prisma.folder.create({
    data: { name: 'Financial Documents' },
  });
  const hrFolder = await prisma.folder.create({
    data: { name: 'HR Documents' },
  });
  const ndaSubfolder = await prisma.folder.create({
    data: { name: 'NDAs', parentId: contractsFolder.id },
  });
  const vendorSubfolder = await prisma.folder.create({
    data: { name: 'Vendor Agreements', parentId: contractsFolder.id },
  });

  // ============ CREATE DOCUMENTS ============
  console.log('📄 Creating documents...');
  const docs = await Promise.all([
    // Employment Contract (pending_signature)
    prisma.document.create({
      data: {
        title: 'Employment Contract - Tom Anderson',
        description: 'Full-time employment contract for Tom Anderson, Senior Software Engineer position',
        fileName: 'employment_contract_tom_anderson.pdf',
        filePath: '/uploads/employment_contract_tom_anderson.pdf',
        fileSize: 245000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'hr',
        tags: 'employment,contract,onboarding',
        status: 'pending_signature',
        priority: 'high',
        creatorId: hrUser.id,
        folderId: hrFolder.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    // NDA Agreement (pending_approval)
    prisma.document.create({
      data: {
        title: 'Non-Disclosure Agreement - Partner Corp',
        description: 'Mutual NDA with Partner Corp for upcoming collaboration project',
        fileName: 'nda_partner_corp.pdf',
        filePath: '/uploads/nda_partner_corp.pdf',
        fileSize: 128000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'legal',
        tags: 'nda,confidentiality,partner',
        status: 'pending_approval',
        priority: 'high',
        creatorId: legalUser.id,
        folderId: ndaSubfolder.id,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    }),
    // Office Lease Agreement (draft)
    prisma.document.create({
      data: {
        title: 'Office Lease Agreement - 2025 Renewal',
        description: 'Annual office lease renewal agreement for the downtown headquarters',
        fileName: 'office_lease_2025.pdf',
        filePath: '/uploads/office_lease_2025.pdf',
        fileSize: 356000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'real_estate',
        tags: 'lease,office,renewal',
        status: 'draft',
        priority: 'normal',
        creatorId: financeUser.id,
        folderId: financialFolder.id,
      },
    }),
    // Q3 Budget Report (completed)
    prisma.document.create({
      data: {
        title: 'Q3 Budget Report 2025',
        description: 'Third quarter budget report with variance analysis and projections',
        fileName: 'q3_budget_report_2025.pdf',
        filePath: '/uploads/q3_budget_report_2025.pdf',
        fileSize: 512000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'finance',
        tags: 'budget,quarterly,report',
        status: 'completed',
        priority: 'normal',
        creatorId: financeUser.id,
        folderId: financialFolder.id,
      },
    }),
    // Vendor Service Agreement (pending_signature)
    prisma.document.create({
      data: {
        title: 'Vendor Service Agreement - CloudTech Solutions',
        description: 'Service level agreement with CloudTech Solutions for cloud infrastructure services',
        fileName: 'vendor_agreement_cloudtech.pdf',
        filePath: '/uploads/vendor_agreement_cloudtech.pdf',
        fileSize: 198000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'procurement',
        tags: 'vendor,service,agreement,cloud',
        status: 'pending_signature',
        priority: 'high',
        creatorId: procurementUser.id,
        folderId: vendorSubfolder.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    // Employee Handbook Acknowledgment (pending_approval)
    prisma.document.create({
      data: {
        title: 'Employee Handbook Acknowledgment - 2025',
        description: 'Updated employee handbook acknowledgment form for all staff',
        fileName: 'handbook_acknowledgment_2025.pdf',
        filePath: '/uploads/handbook_acknowledgment_2025.pdf',
        fileSize: 89000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'hr',
        tags: 'handbook,acknowledgment,policy',
        status: 'pending_approval',
        priority: 'normal',
        creatorId: hrUser.id,
        folderId: hrFolder.id,
      },
    }),
    // Purchase Order #4521 (signed)
    prisma.document.create({
      data: {
        title: 'Purchase Order #4521 - Office Supplies',
        description: 'Purchase order for Q3 office supplies and equipment',
        fileName: 'po_4521_office_supplies.pdf',
        filePath: '/uploads/po_4521_office_supplies.pdf',
        fileSize: 67000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'procurement',
        tags: 'purchase-order,supplies,office',
        status: 'signed',
        priority: 'normal',
        creatorId: procurementUser.id,
        folderId: financialFolder.id,
      },
    }),
    // Confidentiality Agreement (rejected)
    prisma.document.create({
      data: {
        title: 'Confidentiality Agreement - Project Aurora',
        description: 'Confidentiality agreement for Project Aurora team members',
        fileName: 'confidentiality_project_aurora.pdf',
        filePath: '/uploads/confidentiality_project_aurora.pdf',
        fileSize: 112000,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        category: 'legal',
        tags: 'confidentiality,project,restricted',
        status: 'rejected',
        priority: 'high',
        creatorId: legalUser.id,
        folderId: contractsFolder.id,
      },
    }),
  ]);

  const [empContract, ndaDoc, leaseDoc, budgetReport, vendorAgreement, handbookAck, purchaseOrder, confAgreement] = docs;

  // ============ CREATE SIGNATURES ============
  console.log('✍️ Creating signatures...');
  await Promise.all([
    // Employment Contract - pending signature by employee and HR
    prisma.signature.create({
      data: {
        documentId: empContract.id,
        signerId: emp1.id,
        type: 'electronic',
        status: 'pending',
      },
    }),
    prisma.signature.create({
      data: {
        documentId: empContract.id,
        signerId: hrUser.id,
        type: 'electronic',
        status: 'pending',
      },
    }),
    // Vendor Agreement - pending by external signer
    prisma.signature.create({
      data: {
        documentId: vendorAgreement.id,
        signerId: externalUser.id,
        type: 'electronic',
        status: 'pending',
      },
    }),
    prisma.signature.create({
      data: {
        documentId: vendorAgreement.id,
        signerId: procurementUser.id,
        type: 'electronic',
        status: 'pending',
      },
    }),
    // Purchase Order - already signed
    prisma.signature.create({
      data: {
        documentId: purchaseOrder.id,
        signerId: procurementUser.id,
        type: 'electronic',
        status: 'signed',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        signedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.signature.create({
      data: {
        documentId: purchaseOrder.id,
        signerId: financeUser.id,
        type: 'electronic',
        status: 'signed',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0',
        signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  // ============ CREATE WORKFLOWS & APPROVAL STEPS ============
  console.log('🔄 Creating workflows and approval steps...');
  await Promise.all([
    // Employment Contract workflow
    prisma.workflow.create({
      data: {
        documentId: empContract.id,
        name: 'Employment Contract Approval',
        type: 'sequential',
        status: 'in_progress',
        steps: {
          create: [
            { stepOrder: 1, stepType: 'approval', approverId: mgrEng.id, status: 'approved', comments: 'Approved - position confirmed', actionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { stepOrder: 2, stepType: 'approval', approverId: hrUser.id, status: 'pending' },
            { stepOrder: 3, stepType: 'signature', approverId: emp1.id, status: 'pending' },
          ],
        },
      },
    }),
    // NDA Agreement workflow
    prisma.workflow.create({
      data: {
        documentId: ndaDoc.id,
        name: 'NDA Legal Review',
        type: 'sequential',
        status: 'in_progress',
        steps: {
          create: [
            { stepOrder: 1, stepType: 'review', approverId: legalUser.id, status: 'in_review' },
            { stepOrder: 2, stepType: 'approval', approverId: admin.id, status: 'pending' },
            { stepOrder: 3, stepType: 'signature', approverId: externalUser.id, status: 'pending' },
          ],
        },
      },
    }),
    // Handbook Acknowledgment workflow
    prisma.workflow.create({
      data: {
        documentId: handbookAck.id,
        name: 'Policy Approval Flow',
        type: 'sequential',
        status: 'in_progress',
        steps: {
          create: [
            { stepOrder: 1, stepType: 'approval', approverId: hrUser.id, status: 'approved', actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { stepOrder: 2, stepType: 'approval', approverId: admin.id, status: 'pending' },
          ],
        },
      },
    }),
    // Vendor Agreement workflow
    prisma.workflow.create({
      data: {
        documentId: vendorAgreement.id,
        name: 'Vendor Agreement Approval',
        type: 'sequential',
        status: 'in_progress',
        steps: {
          create: [
            { stepOrder: 1, stepType: 'approval', approverId: procurementUser.id, status: 'approved', comments: 'Terms negotiated and confirmed', actionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { stepOrder: 2, stepType: 'approval', approverId: legalUser.id, status: 'approved', comments: 'Legal review complete', actionDate: new Date(Date.now() - 12 * 60 * 60 * 1000) },
            { stepOrder: 3, stepType: 'approval', approverId: financeUser.id, status: 'pending' },
            { stepOrder: 4, stepType: 'signature', approverId: externalUser.id, status: 'pending' },
          ],
        },
      },
    }),
    // Lease Agreement draft - no workflow yet
    // Budget Report completed - completed workflow
    prisma.workflow.create({
      data: {
        documentId: budgetReport.id,
        name: 'Budget Report Review',
        type: 'sequential',
        status: 'completed',
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        steps: {
          create: [
            { stepOrder: 1, stepType: 'approval', approverId: financeUser.id, status: 'approved', comments: 'Report verified', actionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { stepOrder: 2, stepType: 'approval', approverId: admin.id, status: 'approved', comments: 'Approved by CTO', actionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          ],
        },
      },
    }),
  ]);

  // ============ CREATE WORKFLOW TEMPLATES ============
  console.log('📋 Creating workflow templates...');
  await Promise.all([
    prisma.workflowTemplate.create({
      data: {
        name: 'HR Contract Approval',
        description: 'Standard approval workflow for employment contracts and HR documents',
        type: 'sequential',
        category: 'hr',
        steps: JSON.stringify([
          { stepOrder: 1, stepType: 'approval', role: 'dept_manager', label: 'Department Manager Approval' },
          { stepOrder: 2, stepType: 'approval', role: 'hr', label: 'HR Director Approval' },
          { stepOrder: 3, stepType: 'signature', role: 'employee', label: 'Employee Signature' },
        ]),
        isActive: true,
      },
    }),
    prisma.workflowTemplate.create({
      data: {
        name: 'Procurement Approval',
        description: 'Multi-step approval for procurement and vendor agreements',
        type: 'sequential',
        category: 'procurement',
        steps: JSON.stringify([
          { stepOrder: 1, stepType: 'approval', role: 'procurement', label: 'Procurement Lead Review' },
          { stepOrder: 2, stepType: 'approval', role: 'legal', label: 'Legal Review' },
          { stepOrder: 3, stepType: 'approval', role: 'finance', label: 'Finance Approval' },
          { stepOrder: 4, stepType: 'signature', role: 'external_signer', label: 'Vendor Signature' },
        ]),
        isActive: true,
      },
    }),
    prisma.workflowTemplate.create({
      data: {
        name: 'Expense Approval',
        description: 'Parallel approval for expense reports and reimbursements',
        type: 'parallel',
        category: 'finance',
        steps: JSON.stringify([
          { stepOrder: 1, stepType: 'approval', role: 'dept_manager', label: 'Manager Approval' },
          { stepOrder: 1, stepType: 'approval', role: 'finance', label: 'Finance Review' },
        ]),
        isActive: true,
      },
    }),
    prisma.workflowTemplate.create({
      data: {
        name: 'Policy Acknowledgment',
        description: 'Sequential workflow for policy acknowledgment documents',
        type: 'sequential',
        category: 'hr',
        steps: JSON.stringify([
          { stepOrder: 1, stepType: 'approval', role: 'hr', label: 'HR Approval' },
          { stepOrder: 2, stepType: 'approval', role: 'super_admin', label: 'Executive Approval' },
        ]),
        isActive: true,
      },
    }),
  ]);

  // ============ CREATE TEMPLATES ============
  console.log('📝 Creating document templates...');
  await Promise.all([
    prisma.template.create({
      data: {
        name: 'Employment Contract Template',
        description: 'Standard full-time employment contract template with all required clauses',
        category: 'hr',
        tags: 'employment,contract,hr',
        filePath: '/templates/employment_contract_template.pdf',
        fileName: 'employment_contract_template.pdf',
        fileType: 'pdf',
        variables: JSON.stringify(['employee_name', 'position', 'department', 'start_date', 'salary', 'reporting_to']),
        fields: JSON.stringify([
          { type: 'signature', label: 'Employee Signature', x: 100, y: 700, width: 200, height: 50, page: 1 },
          { type: 'signature', label: 'HR Signature', x: 400, y: 700, width: 200, height: 50, page: 1 },
          { type: 'date', label: 'Start Date', x: 100, y: 200, width: 150, height: 30, page: 1 },
        ]),
        isPublic: true,
        usageCount: 15,
        creatorId: hrUser.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'NDA Template',
        description: 'Mutual non-disclosure agreement template for external partnerships',
        category: 'legal',
        tags: 'nda,confidentiality,legal',
        filePath: '/templates/nda_template.pdf',
        fileName: 'nda_template.pdf',
        fileType: 'pdf',
        variables: JSON.stringify(['party_a_name', 'party_b_name', 'effective_date', 'duration_months', 'scope']),
        fields: JSON.stringify([
          { type: 'signature', label: 'Party A Signature', x: 100, y: 650, width: 200, height: 50, page: 1 },
          { type: 'signature', label: 'Party B Signature', x: 400, y: 650, width: 200, height: 50, page: 1 },
          { type: 'date', label: 'Effective Date', x: 100, y: 150, width: 150, height: 30, page: 1 },
        ]),
        isPublic: true,
        usageCount: 23,
        creatorId: legalUser.id,
      },
    }),
    prisma.template.create({
      data: {
        name: 'Vendor Agreement Template',
        description: 'Standard vendor service agreement template with SLA clauses',
        category: 'procurement',
        tags: 'vendor,agreement,procurement',
        filePath: '/templates/vendor_agreement_template.pdf',
        fileName: 'vendor_agreement_template.pdf',
        fileType: 'pdf',
        variables: JSON.stringify(['vendor_name', 'service_type', 'contract_value', 'start_date', 'end_date', 'payment_terms']),
        fields: JSON.stringify([
          { type: 'signature', label: 'Company Signature', x: 100, y: 700, width: 200, height: 50, page: 2 },
          { type: 'signature', label: 'Vendor Signature', x: 400, y: 700, width: 200, height: 50, page: 2 },
          { type: 'text', label: 'Contract Value', x: 200, y: 300, width: 200, height: 30, page: 1 },
        ]),
        isPublic: true,
        usageCount: 8,
        creatorId: procurementUser.id,
      },
    }),
  ]);

  // ============ CREATE NOTIFICATIONS ============
  console.log('🔔 Creating notifications...');
  await Promise.all([
    prisma.notification.create({
      data: { userId: emp1.id, type: 'signature_request', title: 'Signature Required', message: 'You have been requested to sign "Employment Contract - Tom Anderson"', link: '/documents/' + empContract.id, isRead: false },
    }),
    prisma.notification.create({
      data: { userId: hrUser.id, type: 'approval_request', title: 'Approval Needed', message: 'Employment Contract for Tom Anderson requires your approval', link: '/documents/' + empContract.id, isRead: false },
    }),
    prisma.notification.create({
      data: { userId: admin.id, type: 'approval_request', title: 'Executive Approval Required', message: 'NDA Agreement with Partner Corp requires executive approval', link: '/documents/' + ndaDoc.id, isRead: false },
    }),
    prisma.notification.create({
      data: { userId: financeUser.id, type: 'approval_request', title: 'Finance Approval Needed', message: 'Vendor Service Agreement with CloudTech Solutions requires finance approval', link: '/documents/' + vendorAgreement.id, isRead: true, readAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    }),
    prisma.notification.create({
      data: { userId: procurementUser.id, type: 'document_signed', title: 'Document Signed', message: 'Purchase Order #4521 has been signed by all parties', link: '/documents/' + purchaseOrder.id, isRead: true, readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    }),
    prisma.notification.create({
      data: { userId: legalUser.id, type: 'document_rejected', title: 'Document Rejected', message: 'Confidentiality Agreement for Project Aurora has been rejected', link: '/documents/' + confAgreement.id, isRead: false },
    }),
    prisma.notification.create({
      data: { userId: mgrEng.id, type: 'document_shared', title: 'Document Shared', message: 'Employment Contract has been shared with you for review', link: '/documents/' + empContract.id, isRead: true, readAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
    }),
  ]);

  // ============ CREATE AUDIT LOGS ============
  console.log('📊 Creating audit logs...');
  await Promise.all([
    prisma.auditLog.create({
      data: { userId: hrUser.id, action: 'document.create', resource: 'document', resourceId: empContract.id, details: 'Created Employment Contract for Tom Anderson', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: legalUser.id, action: 'document.create', resource: 'document', resourceId: ndaDoc.id, details: 'Created NDA Agreement with Partner Corp', ipAddress: '192.168.1.55', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: mgrEng.id, action: 'workflow.approve', resource: 'workflow', resourceId: empContract.id, details: 'Approved Employment Contract - step 1 of 3', ipAddress: '192.168.1.60', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: admin.id, action: 'user.login', resource: 'session', resourceId: admin.id, details: 'Admin user logged in via SSO', ipAddress: '192.168.1.10', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: procurementUser.id, action: 'document.create', resource: 'document', resourceId: vendorAgreement.id, details: 'Created Vendor Service Agreement with CloudTech Solutions', ipAddress: '192.168.1.70', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: procurementUser.id, action: 'workflow.approve', resource: 'workflow', resourceId: vendorAgreement.id, details: 'Procurement lead approved Vendor Agreement', ipAddress: '192.168.1.70', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: legalUser.id, action: 'workflow.approve', resource: 'workflow', resourceId: vendorAgreement.id, details: 'Legal counsel approved Vendor Agreement', ipAddress: '192.168.1.55', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: procurementUser.id, action: 'document.sign', resource: 'document', resourceId: purchaseOrder.id, details: 'Signed Purchase Order #4521', ipAddress: '192.168.1.70', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: admin.id, action: 'document.reject', resource: 'document', resourceId: confAgreement.id, details: 'Rejected Confidentiality Agreement for Project Aurora - scope too broad', ipAddress: '192.168.1.10', userAgent: 'Mozilla/5.0', severity: 'warning' },
    }),
    prisma.auditLog.create({
      data: { userId: sysAdmin.id, action: 'system.config', resource: 'system', resourceId: 'general', details: 'Updated system notification settings', ipAddress: '192.168.1.11', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: financeUser.id, action: 'document.create', resource: 'document', resourceId: budgetReport.id, details: 'Created Q3 Budget Report 2025', ipAddress: '192.168.1.65', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
    prisma.auditLog.create({
      data: { userId: hrUser.id, action: 'workflow.approve', resource: 'workflow', resourceId: handbookAck.id, details: 'HR Director approved Employee Handbook Acknowledgment', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0', severity: 'info' },
    }),
  ]);

  // ============ CREATE DOCUMENT FIELDS ============
  console.log('📝 Creating document fields...');
  await Promise.all([
    // Employment Contract fields
    prisma.documentField.create({
      data: { documentId: empContract.id, type: 'signature', label: 'Employee Signature', required: true, page: 1, x: 100, y: 700, width: 200, height: 50, assigneeId: emp1.id },
    }),
    prisma.documentField.create({
      data: { documentId: empContract.id, type: 'signature', label: 'HR Director Signature', required: true, page: 1, x: 400, y: 700, width: 200, height: 50, assigneeId: hrUser.id },
    }),
    prisma.documentField.create({
      data: { documentId: empContract.id, type: 'date', label: 'Start Date', required: true, page: 1, x: 100, y: 200, width: 150, height: 30 },
    }),
    prisma.documentField.create({
      data: { documentId: empContract.id, type: 'text', label: 'Position Title', required: true, page: 1, x: 100, y: 150, width: 250, height: 30 },
    }),
    // NDA fields
    prisma.documentField.create({
      data: { documentId: ndaDoc.id, type: 'signature', label: 'Company Representative', required: true, page: 2, x: 100, y: 650, width: 200, height: 50, assigneeId: admin.id },
    }),
    prisma.documentField.create({
      data: { documentId: ndaDoc.id, type: 'signature', label: 'Partner Representative', required: true, page: 2, x: 400, y: 650, width: 200, height: 50, assigneeId: externalUser.id },
    }),
    // Vendor Agreement fields
    prisma.documentField.create({
      data: { documentId: vendorAgreement.id, type: 'signature', label: 'Company Signature', required: true, page: 2, x: 100, y: 700, width: 200, height: 50, assigneeId: procurementUser.id },
    }),
    prisma.documentField.create({
      data: { documentId: vendorAgreement.id, type: 'signature', label: 'Vendor Signature', required: true, page: 2, x: 400, y: 700, width: 200, height: 50, assigneeId: externalUser.id },
    }),
    prisma.documentField.create({
      data: { documentId: vendorAgreement.id, type: 'text', label: 'Contract Value', required: true, page: 1, x: 200, y: 300, width: 200, height: 30 },
    }),
  ]);

  // ============ CREATE DOCUMENT SHARES ============
  console.log('🔗 Creating document shares...');
  await Promise.all([
    prisma.documentShare.create({
      data: { documentId: empContract.id, userId: mgrEng.id, permission: 'view' },
    }),
    prisma.documentShare.create({
      data: { documentId: empContract.id, userId: admin.id, permission: 'admin' },
    }),
    prisma.documentShare.create({
      data: { documentId: ndaDoc.id, userId: admin.id, permission: 'edit' },
    }),
    prisma.documentShare.create({
      data: { documentId: vendorAgreement.id, email: 'vendor@cloudtech.com', permission: 'sign' },
    }),
    prisma.documentShare.create({
      data: { documentId: vendorAgreement.id, userId: financeUser.id, permission: 'view' },
    }),
  ]);

  // ============ CREATE DOCUMENT ACTIVITIES ============
  console.log('📋 Creating document activities...');
  await Promise.all([
    prisma.documentActivity.create({
      data: { documentId: empContract.id, userId: hrUser.id, action: 'created', details: 'Document created by HR Director', ipAddress: '192.168.1.50' },
    }),
    prisma.documentActivity.create({
      data: { documentId: empContract.id, userId: mgrEng.id, action: 'approved', details: 'Approved by Engineering Manager', ipAddress: '192.168.1.60' },
    }),
    prisma.documentActivity.create({
      data: { documentId: empContract.id, userId: hrUser.id, action: 'signature_requested', details: 'Signature requested from employee', ipAddress: '192.168.1.50' },
    }),
    prisma.documentActivity.create({
      data: { documentId: ndaDoc.id, userId: legalUser.id, action: 'created', details: 'NDA created by Legal Counsel', ipAddress: '192.168.1.55' },
    }),
    prisma.documentActivity.create({
      data: { documentId: ndaDoc.id, userId: legalUser.id, action: 'review_started', details: 'Legal review started', ipAddress: '192.168.1.55' },
    }),
    prisma.documentActivity.create({
      data: { documentId: vendorAgreement.id, userId: procurementUser.id, action: 'created', details: 'Vendor Agreement created', ipAddress: '192.168.1.70' },
    }),
    prisma.documentActivity.create({
      data: { documentId: vendorAgreement.id, userId: procurementUser.id, action: 'approved', details: 'Approved by Procurement Lead', ipAddress: '192.168.1.70' },
    }),
    prisma.documentActivity.create({
      data: { documentId: purchaseOrder.id, userId: procurementUser.id, action: 'signed', details: 'Signed by Procurement Lead', ipAddress: '192.168.1.70' },
    }),
    prisma.documentActivity.create({
      data: { documentId: purchaseOrder.id, userId: financeUser.id, action: 'signed', details: 'Signed by Finance Manager - document complete', ipAddress: '192.168.1.65' },
    }),
    prisma.documentActivity.create({
      data: { documentId: confAgreement.id, userId: admin.id, action: 'rejected', details: 'Rejected - scope too broad for project', ipAddress: '192.168.1.10' },
    }),
  ]);

  // ============ CREATE COMMENTS ============
  console.log('💬 Creating comments...');
  const comment1 = await prisma.comment.create({
    data: { documentId: empContract.id, userId: mgrEng.id, content: 'The salary clause looks good. Approved from my side.', type: 'comment' },
  });
  await prisma.comment.create({
    data: { documentId: empContract.id, userId: hrUser.id, content: 'Thanks for the quick review! Moving to signature phase.', type: 'comment', parentId: comment1.id },
  });
  await prisma.comment.create({
    data: { documentId: ndaDoc.id, userId: legalUser.id, content: 'Section 4.2 needs revision - mutual indemnification clause is too one-sided.', type: 'comment' },
  });
  await prisma.comment.create({
    data: { documentId: vendorAgreement.id, userId: legalUser.id, content: 'SLA terms reviewed and acceptable. Proceeding with approval.', type: 'comment' },
  });
  await prisma.comment.create({
    data: { documentId: confAgreement.id, userId: admin.id, content: 'Rejected - please narrow the scope to Project Aurora team members only.', type: 'comment' },
  });

  // ============ CREATE SYSTEM CONFIG ============
  console.log('⚙️ Creating system config...');
  await Promise.all([
    prisma.systemConfig.create({
      data: { key: 'max_file_size_mb', value: '50' },
    }),
    prisma.systemConfig.create({
      data: { key: 'session_timeout_hours', value: '24' },
    }),
    prisma.systemConfig.create({
      data: { key: 'notification_email_enabled', value: 'true' },
    }),
    prisma.systemConfig.create({
      data: { key: 'require_mfa_for_admin', value: 'true' },
    }),
    prisma.systemConfig.create({
      data: { key: 'document_retention_days', value: '365' },
    }),
  ]);

  // Update user last login for some users
  await prisma.user.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000), lastLoginIp: '192.168.1.10' },
  });
  await prisma.user.update({
    where: { id: hrUser.id },
    data: { lastLoginAt: new Date(Date.now() - 30 * 60 * 1000), lastLoginIp: '192.168.1.50' },
  });
  await prisma.user.update({
    where: { id: financeUser.id },
    data: { lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000), lastLoginIp: '192.168.1.65' },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`   Users: ${users.length}`);
  console.log(`   Departments: 6`);
  console.log(`   Documents: ${docs.length}`);
  console.log(`   Folders: 5`);
  console.log(`   Workflows: 5`);
  console.log(`   Workflow Templates: 4`);
  console.log(`   Document Templates: 3`);
  console.log(`   Notifications: 7`);
  console.log(`   Audit Logs: 12`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
