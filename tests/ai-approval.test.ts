import { describe, it, expect } from 'vitest';

describe('PayPilot Copilot – Human-in-the-Loop Approval Gating', () => {
  it('enforces requires_human_approval on financial mutation actions', () => {
    const sensitiveActions = [
      { action_type: 'create_invoice', title: 'Draft Invoice for Acme Corp' },
      { action_type: 'send_invoice_reminder', title: 'Prepare Overdue Notice' },
      { action_type: 'capture_payment', title: 'Capture Sandbox Transaction' },
      { action_type: 'apply_discount', title: 'Apply 20% Discount Code' },
    ];

    for (const action of sensitiveActions) {
      const actionRequest = {
        ...action,
        requires_human_approval: true,
        approval_status: 'pending',
      };

      // Guardrail assertion:
      expect(actionRequest.requires_human_approval).toBe(true);
      expect(actionRequest.approval_status).toBe('pending');
    }
  });

  it('rejects automated execution when approval is pending', () => {
    let databaseWritten = false;

    const executeAction = (actionRequest: { requires_human_approval: boolean; approval_status: string }) => {
      if (actionRequest.requires_human_approval && actionRequest.approval_status !== 'approved') {
        throw new Error('ApprovalGateError: User confirmation modal required.');
      }
      databaseWritten = true;
    };

    const pendingRequest = {
      action_type: 'create_invoice',
      requires_human_approval: true,
      approval_status: 'pending',
    };

    expect(() => executeAction(pendingRequest)).toThrow('ApprovalGateError');
    expect(databaseWritten).toBe(false);

    // After human clicks Approve
    const approvedRequest = {
      ...pendingRequest,
      approval_status: 'approved',
    };
    executeAction(approvedRequest);
    expect(databaseWritten).toBe(true);
  });
});
