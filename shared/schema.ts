import { pgTable, text, serial, integer, boolean, date, numeric, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").default("user"), // 'admin' or 'user'
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  hireDate: date("hire_date"),
  salary: numeric("salary"),
  isActive: boolean("is_active").default(true),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true,
  position: true,
  department: true,
  email: true,
  phone: true,
  hireDate: true,
  salary: true,
  isActive: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().defaultNow(),
  transactionType: text("transaction_type").notNull(), // 'income' or 'expense'
  category: text("category"),
  description: text("description"),
  amount: numeric("amount").notNull(),
  referenceId: text("reference_id"),
  relatedToId: integer("related_to_id"), // Can be employeeId or companyId
  relatedToType: text("related_to_type"), // 'employee', 'company', 'other'
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  date: true,
  transactionType: true,
  category: true,
  description: true,
  amount: true,
  referenceId: true,
  relatedToId: true,
  relatedToType: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientName: text("client_name"),
  issueDate: date("issue_date").defaultNow(),
  dueDate: date("due_date"),
  amount: numeric("amount").notNull(),
  status: text("status").default("pending"), // 'pending', 'paid', 'overdue'
  notes: text("notes"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  clientName: true,
  issueDate: true,
  dueDate: true,
  amount: true,
  status: true,
  notes: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Attendance
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull(),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  status: text("status"), // 'present', 'absent', 'late', 'half-day'
  notes: text("notes"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  employeeId: true,
  date: true,
  checkIn: true,
  checkOut: true,
  status: true,
  notes: true,
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// Companies
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // 'client', 'supplier', 'partner'
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  registrationDate: date("registration_date").defaultNow(),
  status: text("status").default("active"), // 'active', 'inactive'
  notes: text("notes"),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  type: true,
  contactPerson: true,
  email: true,
  phone: true,
  address: true,
  registrationDate: true,
  status: true,
  notes: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Employee Payment Records
export const employeePayments = pgTable("employee_payments", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  date: date("date").notNull().defaultNow(),
  amount: numeric("amount").notNull(),
  paymentType: text("payment_type").notNull(), // 'salary', 'bonus', 'advance', 'reimbursement'
  description: text("description"),
  transactionId: integer("transaction_id"), // Linked to transactions table
});

export const insertEmployeePaymentSchema = createInsertSchema(employeePayments).pick({
  employeeId: true,
  date: true,
  amount: true,
  paymentType: true,
  description: true,
  transactionId: true,
});

export type InsertEmployeePayment = z.infer<typeof insertEmployeePaymentSchema>;
export type EmployeePayment = typeof employeePayments.$inferSelect;

// Company Transactions
export const companyTransactions = pgTable("company_transactions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  date: date("date").notNull().defaultNow(),
  amount: numeric("amount").notNull(),
  transactionType: text("transaction_type").notNull(), // 'incoming', 'outgoing'
  description: text("description"),
  invoiceNumber: text("invoice_number"),
  transactionId: integer("transaction_id"), // Linked to transactions table
});

export const insertCompanyTransactionSchema = createInsertSchema(companyTransactions).pick({
  companyId: true,
  date: true,
  amount: true,
  transactionType: true,
  description: true,
  invoiceNumber: true,
  transactionId: true,
});

export type InsertCompanyTransaction = z.infer<typeof insertCompanyTransactionSchema>;
export type CompanyTransaction = typeof companyTransactions.$inferSelect;
