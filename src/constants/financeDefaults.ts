import { Account, Category } from '../types/finance';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'ACC-001', code: 'ACC-001', name: 'Cash', type: 'Cash', openingBalance: 0 },
  { id: 'ACC-002', code: 'ACC-002', name: 'Workshop Bank', type: 'Bank', openingBalance: 0 },
  { id: 'ACC-003', code: 'ACC-003', name: 'JazzCash', type: 'Mobile Wallet', openingBalance: 0 },
  { id: 'ACC-004', code: 'ACC-004', name: 'Easypaisa', type: 'Mobile Wallet', openingBalance: 0 },
  { id: 'ACC-005', code: 'ACC-005', name: 'Other Bank', type: 'Bank', openingBalance: 0 },
];

export const INITIAL_INCOME_CATEGORIES: Category[] = [
  { id: 'INC-001', code: 'INC-001', name: 'Customer Payment', type: 'IN' },
  { id: 'INC-002', code: 'INC-002', name: 'Advance Payment', type: 'IN' },
  { id: 'INC-003', code: 'INC-003', name: 'Vehicle Repair', type: 'IN' },
  { id: 'INC-004', code: 'INC-004', name: 'Electrical Work', type: 'IN' },
  { id: 'INC-005', code: 'INC-005', name: 'Mechanical Work', type: 'IN' },
  { id: 'INC-006', code: 'INC-006', name: 'Computer Diagnostic', type: 'IN' },
  { id: 'INC-007', code: 'INC-007', name: 'Parts Sales', type: 'IN' },
  { id: 'INC-008', code: 'INC-008', name: 'Other Income', type: 'IN' },
];

export const INITIAL_EXPENSE_CATEGORIES: Category[] = [
  { id: 'EXP-001', code: 'EXP-001', name: 'Workshop Rent', type: 'OUT' },
  { id: 'EXP-002', code: 'EXP-002', name: 'Electricity', type: 'OUT' },
  { id: 'EXP-003', code: 'EXP-003', name: 'Gas', type: 'OUT' },
  { id: 'EXP-004', code: 'EXP-004', name: 'Water', type: 'OUT' },
  { id: 'EXP-005', code: 'EXP-005', name: 'Internet', type: 'OUT' },
  { id: 'EXP-006', code: 'EXP-006', name: 'Employee Salary', type: 'OUT' },
  { id: 'EXP-007', code: 'EXP-007', name: 'Employee Advance', type: 'OUT' },
  { id: 'EXP-008', code: 'EXP-008', name: 'Food', type: 'OUT' },
  { id: 'EXP-009', code: 'EXP-009', name: 'Hotel', type: 'OUT' },
  { id: 'EXP-010', code: 'EXP-010', name: 'Fuel', type: 'OUT' },
  { id: 'EXP-011', code: 'EXP-011', name: 'Vehicle Maintenance', type: 'OUT' },
  { id: 'EXP-012', code: 'EXP-012', name: 'Tools', type: 'OUT' },
  { id: 'EXP-013', code: 'EXP-013', name: 'Equipment', type: 'OUT' },
  { id: 'EXP-014', code: 'EXP-014', name: 'Spare Parts', type: 'OUT' },
  { id: 'EXP-015', code: 'EXP-015', name: 'Transportation', type: 'OUT' },
  { id: 'EXP-016', code: 'EXP-016', name: 'Office Supplies', type: 'OUT' },
  { id: 'EXP-017', code: 'EXP-017', name: 'Government Fees', type: 'OUT' },
  { id: 'EXP-018', code: 'EXP-018', name: 'Taxes', type: 'OUT' },
  { id: 'EXP-019', code: 'EXP-019', name: 'Bank Charges', type: 'OUT' },
  { id: 'EXP-020', code: 'EXP-020', name: 'Mobile / Telephone', type: 'OUT' },
  { id: 'EXP-021', code: 'EXP-021', name: 'Cleaning', type: 'OUT' },
  { id: 'EXP-022', code: 'EXP-022', name: 'Marketing', type: 'OUT' },
  { id: 'EXP-023', code: 'EXP-023', name: 'Miscellaneous', type: 'OUT' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'JazzCash',
  'Easypaisa',
  'Card',
  'Other',
];
