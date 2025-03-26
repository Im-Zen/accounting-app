import { 
  users, employees, transactions, invoices, attendance, companies, employeePayments, companyTransactions,
  type User, type InsertUser,
  type Employee, type InsertEmployee,
  type Transaction, type InsertTransaction,
  type Invoice, type InsertInvoice,
  type Attendance, type InsertAttendance,
  type Company, type InsertCompany,
  type EmployeePayment, type InsertEmployeePayment,
  type CompanyTransaction, type InsertCompanyTransaction
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployees(isActive?: boolean): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  
  // Transaction methods
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactions(type?: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Invoice methods
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(status?: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  
  // Attendance methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceForEmployee(employeeId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanies(status?: string): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Employee Payment methods
  getEmployeePayment(id: number): Promise<EmployeePayment | undefined>;
  getEmployeePaymentsByEmployee(employeeId: number): Promise<EmployeePayment[]>;
  createEmployeePayment(payment: InsertEmployeePayment): Promise<EmployeePayment>;
  
  // Company Transaction methods
  getCompanyTransaction(id: number): Promise<CompanyTransaction | undefined>;
  getCompanyTransactionsByCompany(companyId: number): Promise<CompanyTransaction[]>;
  createCompanyTransaction(transaction: InsertCompanyTransaction): Promise<CompanyTransaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private employees: Map<number, Employee>;
  private transactions: Map<number, Transaction>;
  private invoices: Map<number, Invoice>;
  private attendance: Map<number, Attendance>;
  private companies: Map<number, Company>;
  private employeePayments: Map<number, EmployeePayment>;
  private companyTransactions: Map<number, CompanyTransaction>;
  
  userIdCounter: number;
  employeeIdCounter: number;
  transactionIdCounter: number;
  invoiceIdCounter: number;
  attendanceIdCounter: number;
  companyIdCounter: number;
  employeePaymentIdCounter: number;
  companyTransactionIdCounter: number;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.transactions = new Map();
    this.invoices = new Map();
    this.attendance = new Map();
    this.companies = new Map();
    this.employeePayments = new Map();
    this.companyTransactions = new Map();
    
    this.userIdCounter = 1;
    this.employeeIdCounter = 1;
    this.transactionIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.companyIdCounter = 1;
    this.employeePaymentIdCounter = 1;
    this.companyTransactionIdCounter = 1;
    
    // Add an admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin'
    });
    
    // Add a regular user
    this.createUser({
      username: 'user',
      password: 'user123',
      email: 'user@example.com',
      role: 'user'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    // Ensure role is defined
    const role = insertUser.role || 'user';
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      role
    };
    this.users.set(id, user);
    return user;
  }
  
  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async getEmployees(isActive?: boolean): Promise<Employee[]> {
    const allEmployees = Array.from(this.employees.values());
    if (isActive !== undefined) {
      return allEmployees.filter(employee => employee.isActive === isActive);
    }
    return allEmployees;
  }
  
  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.employeeIdCounter++;
    const employee: Employee = { 
      id, 
      name: insertEmployee.name,
      position: insertEmployee.position || null,
      department: insertEmployee.department || null,
      email: insertEmployee.email || null,
      phone: insertEmployee.phone || null,
      hireDate: insertEmployee.hireDate || null,
      salary: insertEmployee.salary || null,
      isActive: insertEmployee.isActive ?? true
    };
    this.employees.set(id, employee);
    return employee;
  }
  
  async updateEmployee(id: number, employeeUpdate: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) {
      return undefined;
    }
    
    const updatedEmployee: Employee = {
      ...employee,
      ...employeeUpdate
    };
    
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  // Transaction methods
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactions(type?: string): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values());
    if (type) {
      return allTransactions.filter(transaction => transaction.transactionType === type);
    }
    return allTransactions;
  }
  
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionIdCounter++;
    const transaction: Transaction = { 
      id,
      date: insertTransaction.date || new Date().toISOString().split('T')[0],
      transactionType: insertTransaction.transactionType,
      category: insertTransaction.category || null,
      description: insertTransaction.description || null,
      amount: insertTransaction.amount,
      referenceId: insertTransaction.referenceId || null,
      relatedToId: insertTransaction.relatedToId || null,
      relatedToType: insertTransaction.relatedToType || null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  // Invoice methods
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(
      (invoice) => invoice.invoiceNumber === invoiceNumber
    );
  }
  
  async getInvoices(status?: string): Promise<Invoice[]> {
    const allInvoices = Array.from(this.invoices.values());
    if (status) {
      return allInvoices.filter(invoice => invoice.status === status);
    }
    return allInvoices;
  }
  
  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const invoice: Invoice = { 
      id,
      invoiceNumber: insertInvoice.invoiceNumber,
      clientName: insertInvoice.clientName || null,
      issueDate: insertInvoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: insertInvoice.dueDate || null,
      amount: insertInvoice.amount,
      status: insertInvoice.status || 'pending',
      notes: insertInvoice.notes || null
    };
    this.invoices.set(id, invoice);
    return invoice;
  }
  
  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      return undefined;
    }
    
    const updatedInvoice: Invoice = {
      ...invoice,
      status
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }
  
  async getAttendanceForEmployee(employeeId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (record) => record.employeeId === employeeId
    );
  }
  
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceIdCounter++;
    const attendance: Attendance = { 
      id,
      employeeId: insertAttendance.employeeId,
      date: insertAttendance.date,
      checkIn: insertAttendance.checkIn || null,
      checkOut: insertAttendance.checkOut || null,
      status: insertAttendance.status || null,
      notes: insertAttendance.notes || null
    };
    this.attendance.set(id, attendance);
    return attendance;
  }
  
  // Company methods
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }
  
  async getCompanies(status?: string): Promise<Company[]> {
    const allCompanies = Array.from(this.companies.values());
    if (status) {
      return allCompanies.filter(company => company.status === status);
    }
    return allCompanies;
  }
  
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.companyIdCounter++;
    const company: Company = { 
      id,
      name: insertCompany.name,
      type: insertCompany.type || null,
      contactPerson: insertCompany.contactPerson || null,
      email: insertCompany.email || null,
      phone: insertCompany.phone || null,
      address: insertCompany.address || null,
      registrationDate: insertCompany.registrationDate || new Date().toISOString().split('T')[0],
      status: insertCompany.status || 'active',
      notes: insertCompany.notes || null
    };
    this.companies.set(id, company);
    return company;
  }
  
  async updateCompany(id: number, companyUpdate: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) {
      return undefined;
    }
    
    const updatedCompany: Company = {
      ...company,
      ...companyUpdate
    };
    
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }
  
  // Employee Payment methods
  async getEmployeePayment(id: number): Promise<EmployeePayment | undefined> {
    return this.employeePayments.get(id);
  }
  
  async getEmployeePaymentsByEmployee(employeeId: number): Promise<EmployeePayment[]> {
    return Array.from(this.employeePayments.values()).filter(
      (payment) => payment.employeeId === employeeId
    );
  }
  
  async createEmployeePayment(insertPayment: InsertEmployeePayment): Promise<EmployeePayment> {
    const id = this.employeePaymentIdCounter++;
    const payment: EmployeePayment = { 
      id,
      employeeId: insertPayment.employeeId,
      date: insertPayment.date || new Date().toISOString().split('T')[0],
      amount: insertPayment.amount,
      paymentType: insertPayment.paymentType,
      description: insertPayment.description || null,
      transactionId: insertPayment.transactionId || null
    };
    this.employeePayments.set(id, payment);
    return payment;
  }
  
  // Company Transaction methods
  async getCompanyTransaction(id: number): Promise<CompanyTransaction | undefined> {
    return this.companyTransactions.get(id);
  }
  
  async getCompanyTransactionsByCompany(companyId: number): Promise<CompanyTransaction[]> {
    return Array.from(this.companyTransactions.values()).filter(
      (transaction) => transaction.companyId === companyId
    );
  }
  
  async createCompanyTransaction(insertTransaction: InsertCompanyTransaction): Promise<CompanyTransaction> {
    const id = this.companyTransactionIdCounter++;
    const transaction: CompanyTransaction = { 
      id,
      companyId: insertTransaction.companyId,
      date: insertTransaction.date || new Date().toISOString().split('T')[0],
      amount: insertTransaction.amount,
      transactionType: insertTransaction.transactionType,
      description: insertTransaction.description || null,
      invoiceNumber: insertTransaction.invoiceNumber || null,
      transactionId: insertTransaction.transactionId || null
    };
    this.companyTransactions.set(id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();
