import { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import { parsers } from '../lib/formUtils';
import { formatCurrency } from '../lib/formatters';
import { badgeVariants, cn, textColors } from '../lib/classNames';

export interface EmployeeData {
  id: string;
  name: string;
  currentSalary: number;
  billableHoursPerMonth: number;
  hourlyRate: number;
  department: string;
  isActive: boolean;
}

export interface EmployeeManagerProps {
  employees: EmployeeData[];
  onChange: (employees: EmployeeData[]) => void;
  readonly?: boolean;
}

export function EmployeeManager({ employees, onChange, readonly = false }: EmployeeManagerProps) {
  const [newEmployee, setNewEmployee] = useState<Partial<EmployeeData>>({
    name: '',
    currentSalary: 80000,
    billableHoursPerMonth: 160,
    hourlyRate: 0,
    department: '',
    isActive: true,
  });

  const addEmployee = () => {
    if (!newEmployee.name || !newEmployee.department) return;

    const employee: EmployeeData = {
      id: Date.now().toString(),
      name: newEmployee.name,
      currentSalary: newEmployee.currentSalary || 0,
      billableHoursPerMonth: newEmployee.billableHoursPerMonth || 160,
      hourlyRate: newEmployee.hourlyRate || 0,
      department: newEmployee.department,
      isActive: true,
    };

    onChange([...employees, employee]);
    setNewEmployee({
      name: '',
      currentSalary: 80000,
      billableHoursPerMonth: 160,
      hourlyRate: 0,
      department: '',
      isActive: true,
    });
  };

  const removeEmployee = (id: string) => {
    onChange(employees.filter((emp) => emp.id !== id));
  };

  const updateEmployee = (
    id: string,
    field: keyof EmployeeData,
    value: string | number | boolean
  ) => {
    onChange(employees.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp)));
  };

  const totalAnnualSalaries = employees.reduce(
    (sum, emp) => sum + (emp.isActive ? emp.currentSalary : 0),
    0
  );

  const totalMonthlySalaries = totalAnnualSalaries / 12;

  const totalMonthlyRevenuePotential = employees.reduce(
    (sum, emp) => sum + (emp.isActive ? emp.billableHoursPerMonth * emp.hourlyRate : 0),
    0
  );
  const summaryCardBase =
    'rounded-2xl border p-4 text-center shadow-[0_10px_24px_rgba(9,14,36,0.04)]';

  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div
            className={cn(
              summaryCardBase,
              'border-violet-200 bg-violet-50/90 dark:border-violet-900/70 dark:bg-violet-950/30'
            )}
          >
            <div className={cn('text-2xl font-bold', textColors.accent)}>
              {employees.filter((emp) => emp.isActive).length}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Active Employees</div>
          </div>
          <div
            className={cn(
              summaryCardBase,
              'border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/70 dark:bg-emerald-950/30'
            )}
          >
            <div className={cn('text-2xl font-bold', textColors.success)}>
              {formatCurrency(totalAnnualSalaries)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Annual Payroll</div>
          </div>
          <div
            className={cn(
              summaryCardBase,
              'border-amber-200 bg-amber-50/90 dark:border-amber-900/70 dark:bg-amber-950/30'
            )}
          >
            <div className={cn('text-2xl font-bold', textColors.warning)}>
              {formatCurrency(totalMonthlySalaries)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Monthly Payroll</div>
          </div>
          <div
            className={cn(
              summaryCardBase,
              'border-sky-200 bg-sky-50/90 dark:border-sky-900/70 dark:bg-sky-950/30'
            )}
          >
            <div className="text-2xl font-bold text-sky-600 dark:text-sky-300">
              {formatCurrency(totalMonthlyRevenuePotential)}
            </div>
            <div className={cn('text-sm', textColors.secondary)}>Monthly Revenue Potential</div>
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/85"
            >
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <Input
                  label="Name"
                  value={employee.name}
                  onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                  disabled={readonly}
                />
                <Input
                  label="Department"
                  value={employee.department}
                  onChange={(e) => updateEmployee(employee.id, 'department', e.target.value)}
                  disabled={readonly}
                />
                <Input
                  label="Annual Salary"
                  type="number"
                  value={employee.currentSalary}
                  onChange={(e) =>
                    updateEmployee(employee.id, 'currentSalary', parsers.number(e.target.value))
                  }
                  disabled={readonly}
                  min="0"
                />
                <Input
                  label="Billable Hours/Month"
                  type="number"
                  value={employee.billableHoursPerMonth}
                  onChange={(e) =>
                    updateEmployee(
                      employee.id,
                      'billableHoursPerMonth',
                      parsers.number(e.target.value)
                    )
                  }
                  disabled={readonly}
                  min="0"
                  max="744"
                />
                <Input
                  label="Hourly Rate"
                  type="number"
                  value={employee.hourlyRate}
                  onChange={(e) =>
                    updateEmployee(employee.id, 'hourlyRate', parsers.number(e.target.value))
                  }
                  disabled={readonly}
                  min="0"
                />
                <div className="flex gap-2">
                  <label className="flex items-center space-x-2 rounded-full px-1">
                    <input
                      type="checkbox"
                      checked={employee.isActive}
                      onChange={(e) => updateEmployee(employee.id, 'isActive', e.target.checked)}
                      disabled={readonly}
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500/40 dark:border-slate-700"
                    />
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-semibold',
                        employee.isActive ? badgeVariants.success : badgeVariants.default
                      )}
                    >
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                  {!readonly && (
                    <Button onClick={() => removeEmployee(employee.id)} variant="outline" size="sm">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Employee */}
        {!readonly && (
          <div className="rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/60">
            <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Add New Employee</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Input
                label="Name"
                value={newEmployee.name || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                placeholder="Employee name"
              />
              <Input
                label="Department"
                value={newEmployee.department || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                placeholder="Engineering, Sales, etc."
              />
              <Input
                label="Annual Salary"
                type="number"
                value={newEmployee.currentSalary || ''}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, currentSalary: parsers.number(e.target.value) })
                }
                placeholder="80000"
                min="0"
              />
              <Input
                label="Billable Hours/Month"
                type="number"
                value={newEmployee.billableHoursPerMonth || ''}
                onChange={(e) =>
                  setNewEmployee({
                    ...newEmployee,
                    billableHoursPerMonth: parsers.number(e.target.value),
                  })
                }
                placeholder="160"
                min="0"
                max="744"
              />
              <Input
                label="Hourly Rate"
                type="number"
                value={newEmployee.hourlyRate || ''}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, hourlyRate: parsers.number(e.target.value) })
                }
                placeholder="0"
                min="0"
              />
            </div>
            <div className="mt-3">
              <Button onClick={addEmployee} disabled={!newEmployee.name || !newEmployee.department}>
                Add Employee
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
