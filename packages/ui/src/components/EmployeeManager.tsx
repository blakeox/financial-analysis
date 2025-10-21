import { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import { parsers } from '../lib/formUtils';
import { formatCurrency } from '../lib/formatters';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {employees.filter((emp) => emp.isActive).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalAnnualSalaries)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Annual Payroll</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalMonthlySalaries)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Monthly Payroll</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalMonthlyRevenuePotential)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Monthly Revenue Potential
            </div>
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-3">
          {employees.map((employee) => (
            <div key={employee.id} className="p-4 border rounded-md bg-white dark:bg-gray-900">
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
                    updateEmployee(employee.id, 'billableHoursPerMonth', parsers.number(e.target.value))
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
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={employee.isActive}
                      onChange={(e) => updateEmployee(employee.id, 'isActive', e.target.checked)}
                      disabled={readonly}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
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
          <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
            <h4 className="font-medium mb-3">Add New Employee</h4>
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
                  setNewEmployee({ ...newEmployee, billableHoursPerMonth: parsers.number(e.target.value) })
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
