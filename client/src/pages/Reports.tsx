import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  subMonths, 
  addMonths, 
  getDaysInMonth,
  format as formatDate,
  isWeekend
} from 'date-fns';
import { format as formatPersianDate } from 'date-fns-jalali';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  BarChart, 
  FileDown, 
  FilePieChart,
  CreditCard,
  Banknote,
  Clock,
  CalendarDays,
  Check,
  X,
  Activity,
  LayoutDashboard
} from "lucide-react";

// Report form schema
const reportFormSchema = z.object({
  reportType: z.enum(["financial", "employees", "invoices", "attendance", "employee-payments"]),
  startDate: z.string().min(1, { message: "تاریخ شروع الزامی است" }),
  endDate: z.string().min(1, { message: "تاریخ پایان الزامی است" }),
  format: z.enum(["", "pdf", "excel"]),
  status: z.string().optional(),
  employeeId: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export default function Reports() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [viewingReport, setViewingReport] = useState(false);
  const { toast } = useToast();

  // Fetch employees for selection
  const { data: employees = [] } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Report form
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportType: "financial",
      startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
      endDate: new Date().toISOString().split('T')[0], // Today
      format: "", // Empty means view in app
    },
  });

  // Get attendance data for the calendar view
  const attendanceQuery = useQuery({
    queryKey: ['/api/attendance', form.watch("startDate"), form.watch("endDate"), form.watch("employeeId")],
    enabled: viewingReport && form.watch("reportType") === "attendance" && !!form.watch("employeeId"),
  });

  // Get financial data for reports
  const financialQuery = useQuery({
    queryKey: ['/api/transactions', form.watch("startDate"), form.watch("endDate")],
    enabled: viewingReport && form.watch("reportType") === "financial",
  });

  // Get employee payment data
  const employeePaymentsQuery = useQuery({
    queryKey: ['/api/employee-payments', form.watch("startDate"), form.watch("endDate"), form.watch("employeeId")],
    enabled: viewingReport && form.watch("reportType") === "employee-payments",
  });

  // Generate report mutation
  const generateReport = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      if (data.format && data.format !== "") {
        // Export as PDF or Excel
        const response = await apiRequest(`/api/reports/${data.reportType}`, {
          method: "POST",
          body: JSON.stringify({
            startDate: data.startDate,
            endDate: data.endDate,
            format: data.format,
            status: data.status,
            employeeId: data.employeeId,
          }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "خطا در ایجاد گزارش");
        }
        
        return await response.json();
      } else {
        // View in app - prepare data
        setViewingReport(true);
        
        // Get report data based on type
        switch (data.reportType) {
          case "attendance":
            return attendanceQuery.data || [];
          case "financial":
            return financialQuery.data || [];
          case "employee-payments":
            return employeePaymentsQuery.data || [];
          default:
            return null;
        }
      }
    },
    onSuccess: (data) => {
      if (form.watch("format")) {
        toast({
          title: "گزارش ایجاد شد",
          description: "گزارش با موفقیت ایجاد شد و قابل دانلود است",
        });
        
        // If we have a download URL, trigger download
        if (data?.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
      } else {
        // We're viewing in app
        setReportData(data);
      }
      
      setReportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد گزارش",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ReportFormValues) => {
    generateReport.mutate(data);
  };

  // Handle opening report dialog for a specific type
  const openReportDialog = (reportType: "financial" | "employees" | "invoices" | "attendance" | "employee-payments") => {
    form.setValue("reportType", reportType);
    
    // Reset dates to current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    form.setValue("startDate", firstDayOfMonth.toISOString().split('T')[0]);
    form.setValue("endDate", today.toISOString().split('T')[0]);
    form.setValue("format", ""); // Default to viewing in app
    
    // If attendance or employee payments, show employee selector
    if (reportType === "attendance" || reportType === "employee-payments") {
      // Default to first employee if available
      if (employees.length > 0) {
        form.setValue("employeeId", employees[0].id.toString());
      }
    }
    
    setReportDialogOpen(true);
  };

  // Set date range shortcuts
  const setDateRange = (range: "today" | "thisWeek" | "thisMonth" | "lastMonth" | "thisYear") => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    switch (range) {
      case "today":
        // Start and end are both today
        break;
      case "thisWeek":
        // Start is the first day of the week (Sunday)
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        break;
      case "thisMonth":
        // Start is the first day of the month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastMonth":
        // Start is the first day of the previous month
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        // End is the last day of the previous month
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        // Start is the first day of the year
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }
    
    form.setValue("startDate", startDate.toISOString().split('T')[0]);
    form.setValue("endDate", endDate.toISOString().split('T')[0]);
  };

  // Show different form fields based on report type
  const showReportTypeFields = () => {
    const reportType = form.watch("reportType");
    
    return (
      <>
        {/* Employee selection for attendance and payments reports */}
        {(reportType === "attendance" || reportType === "employee-payments") && (
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>کارمند</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کارمند" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {employees.map((employee: any) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.name}
                      </SelectItem>
                    ))}
                    {reportType === "employee-payments" && (
                      <SelectItem value="">همه کارمندان</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Invoice status selection */}
        {reportType === "invoices" && (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>وضعیت فاکتور</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت فاکتور" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">همه فاکتورها</SelectItem>
                    <SelectItem value="paid">پرداخت شده</SelectItem>
                    <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                    <SelectItem value="overdue">معوقه</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </>
    );
  };

  // Generate attendance calendar data
  const generateCalendarData = () => {
    if (!form.watch("startDate")) return [];
    
    const month = new Date(form.watch("startDate"));
    const daysInMonth = getDaysInMonth(month);
    const days = [];
    
    // Mock attendance data - in a real app this would come from the API
    const attendanceData = attendanceQuery.data || [];
    
    // First day of month for calculating start position
    const firstDay = startOfMonth(month);
    const firstDayOfWeek = firstDay.getDay();
    
    // Add empty cells for alignment
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ empty: true });
    }
    
    // Add calendar days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), i);
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      
      // Find attendance record for this day
      const record = (attendanceData as any[]).find((a: any) => a.date === dateStr);
      
      days.push({
        date,
        day: i,
        status: record ? record.status : isWeekend(date) ? 'weekend' : 'absent',
        timeIn: record?.checkIn || '-',
        timeOut: record?.checkOut || '-',
      });
    }
    
    return days;
  };

  // Render attendance report
  const renderAttendanceReport = () => {
    const calendarDays = generateCalendarData();
    const selectedEmployee = (employees as any[]).find((e: any) => e.id.toString() === form.watch("employeeId"));
    
    // Count attendance stats
    const presentDays = calendarDays.filter(d => !d.empty && d.status === 'present').length;
    const absentDays = calendarDays.filter(d => !d.empty && d.status === 'absent').length;
    const leaveDays = calendarDays.filter(d => !d.empty && d.status === 'leave').length;
    const workingDays = calendarDays.filter(d => !d.empty && !isWeekend(d.date as Date)).length;
    
    // Salary calculation based on daily rate
    // In this model, the employee.salary field represents the daily salary (8 hours)
    const dailyRate = selectedEmployee?.salary || 0; // This is already the daily salary
    const monthlySalary = dailyRate * workingDays; // Total salary if all working days were worked
    const actualSalary = dailyRate * presentDays; // Actual salary based on presence
    
    return (
      <Card className="bg-custom-dark border-custom-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-custom-blue flex items-center">
                <CalendarDays className="mr-2 h-5 w-5" />
                گزارش حضور و غیاب
              </CardTitle>
              <CardDescription>
                {form.watch("startDate") && formatPersianDate(new Date(form.watch("startDate")), 'MMMM yyyy')} - {selectedEmployee?.name || 'کارمند انتخاب نشده'}
              </CardDescription>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const currentDate = new Date(form.watch("startDate"));
                  const newDate = subMonths(currentDate, 1);
                  form.setValue("startDate", formatDate(startOfMonth(newDate), 'yyyy-MM-dd'));
                  form.setValue("endDate", formatDate(endOfMonth(newDate), 'yyyy-MM-dd'));
                  generateReport.mutate(form.getValues());
                }}
              >
                ماه قبل
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const currentDate = new Date(form.watch("startDate"));
                  const newDate = addMonths(currentDate, 1);
                  form.setValue("startDate", formatDate(startOfMonth(newDate), 'yyyy-MM-dd'));
                  form.setValue("endDate", formatDate(endOfMonth(newDate), 'yyyy-MM-dd'));
                  generateReport.mutate(form.getValues());
                }}
              >
                ماه بعد
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attendanceQuery.isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-custom-blue border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Monthly Calendar - Timeline style similar to the reference image */}
              <div className="mb-8">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2 text-custom-blue">تقویم کاری {form.watch("startDate") && formatPersianDate(new Date(form.watch("startDate")), 'MMMM yyyy')}</h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm text-muted-foreground">حضور</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-custom-pink mr-2"></div>
                      <span className="text-sm text-muted-foreground">غیبت</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                      <span className="text-sm text-muted-foreground">مرخصی</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-custom-darker bg-custom-darker/50">
                  {/* Months header */}
                  <div className="bg-custom-darker p-3 text-custom-blue font-medium">
                    {form.watch("startDate") && formatPersianDate(new Date(form.watch("startDate")), 'yyyy')}
                  </div>
                  
                  {/* Calendar grid */}
                  <div className="p-4">
                    {/* Months tabs */}
                    <div className="grid grid-cols-12 gap-2 mb-2">
                      {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'].map((month, i) => {
                        const isCurrentMonth = new Date(form.watch("startDate")).getMonth() === i;
                        return (
                          <div 
                            key={i} 
                            className={`text-center text-xs p-1 rounded cursor-pointer transition-colors
                              ${isCurrentMonth ? 'bg-custom-blue/20 text-custom-blue' : 'hover:bg-custom-darker text-muted-foreground'}
                            `}
                            onClick={() => {
                              const currentDate = new Date(form.watch("startDate"));
                              const newDate = new Date(currentDate.getFullYear(), i, 1);
                              form.setValue("startDate", formatDate(newDate, 'yyyy-MM-dd'));
                              form.setValue("endDate", formatDate(endOfMonth(newDate), 'yyyy-MM-dd'));
                              generateReport.mutate(form.getValues());
                            }}
                          >
                            {month}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Week days header */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'].map((day, i) => (
                        <div key={i} className="text-center p-1 text-xs font-medium text-muted-foreground">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, i) => {
                        if (day.empty) {
                          return <div key={`empty-${i}`} className="aspect-square bg-custom-darker/30 rounded-md"></div>;
                        }
                        
                        return (
                          <div 
                            key={i} 
                            className="aspect-square rounded-md relative flex flex-col items-center justify-center"
                          >
                            {/* Day number on top */}
                            <div className="absolute top-1 left-1 text-xs text-muted-foreground">
                              {day.day}
                            </div>
                            
                            {/* Status indicator - circle in center */}
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center mt-1
                              ${day.status === 'present' ? "bg-green-400" : 
                                day.status === 'absent' ? "bg-custom-pink" : 
                                day.status === 'leave' ? "bg-gray-500" :
                                "bg-gray-700/50"}
                            `}>
                              {day.status === 'present' && <Check className="h-3 w-3 text-black" />}
                              {day.status === 'absent' && <X className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-green-900/20 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-green-400 font-medium">روزهای حضور</h3>
                    <p className="text-2xl font-bold text-green-400">{presentDays}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-custom-pink/10 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-custom-pink font-medium">روزهای غیبت</h3>
                    <p className="text-2xl font-bold text-custom-pink">{absentDays}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-500/10 border-none">
                  <CardContent className="p-4 text-center">
                    <h3 className="text-gray-400 font-medium">روزهای مرخصی</h3>
                    <p className="text-2xl font-bold text-gray-400">{leaveDays}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Financial Summary */}
              <div className="mt-8 border border-custom-darker p-4 rounded-lg bg-custom-darker">
                <h3 className="text-lg font-medium mb-4 text-custom-blue">خلاصه مالی</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>حقوق ماهیانه:</span>
                    <span className="font-bold text-custom-blue">
                      {monthlySalary.toLocaleString()} تومان
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>تعداد روزهای کاری:</span>
                    <span>{workingDays} روز</span>
                  </div>
                  <div className="flex justify-between">
                    <span>دریافتی این ماه:</span>
                    <span className="font-bold text-custom-blue">
                      {actualSalary.toLocaleString()} تومان
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>مبلغ به حروف:</span>
                    <span>
                      {/* In a real app, you'd convert the number to Persian words */}
                      {actualSalary > 0 ? "معادل به حروف" : "صفر"} تومان
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setViewingReport(false)}
          >
            بازگشت
          </Button>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "pdf" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "excel" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی Excel
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render financial report
  const renderFinancialReport = () => {
    // Financial data - in a real app this would come from the API
    const transactions = financialQuery.data || [];
    
    // Calculate totals
    const income = (transactions as any[])
      .filter((t: any) => t.transactionType === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
      
    const expenses = (transactions as any[])
      .filter((t: any) => t.transactionType === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
      
    const balance = income - expenses;
    
    // Calculate category breakdown
    const categories: Record<string, number> = {};
    
    (transactions as any[]).forEach((t: any) => {
      if (!categories[t.category]) {
        categories[t.category] = 0;
      }
      categories[t.category] += t.amount;
    });
    
    // Employee payments breakdown
    const employeePayments = (employees as any[]).map((emp: any) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      position: emp.position,
      baseSalary: emp.salary || 0,
      paid: Math.floor(Math.random() * emp.salary) || 0, // Mock data
    }));
    
    return (
      <Card className="bg-custom-dark border-custom-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-custom-blue flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                گزارش مالی
              </CardTitle>
              <CardDescription>
                {form.watch("startDate") && formatPersianDate(new Date(form.watch("startDate")), 'yyyy/MM/dd')} تا {form.watch("endDate") && formatPersianDate(new Date(form.watch("endDate")), 'yyyy/MM/dd')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {financialQuery.isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-custom-blue border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card className="bg-custom-blue/10 border-none">
                  <CardContent className="p-4">
                    <h3 className="text-custom-blue font-medium">کل درآمد</h3>
                    <p className="text-2xl font-bold text-custom-blue">{income.toLocaleString()} تومان</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-custom-pink/10 border-none">
                  <CardContent className="p-4">
                    <h3 className="text-custom-pink font-medium">کل هزینه</h3>
                    <p className="text-2xl font-bold text-custom-pink">{expenses.toLocaleString()} تومان</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-custom-purple/10 border-none">
                  <CardContent className="p-4">
                    <h3 className="text-custom-purple font-medium">موجودی</h3>
                    <p className="text-2xl font-bold text-custom-purple">{balance.toLocaleString()} تومان</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Category Breakdown */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-custom-blue">گزارش دسته‌بندی</h3>
                <div className="space-y-4">
                  {Object.entries(categories).length > 0 ? (
                    Object.entries(categories).map(([category, amount]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span>{category}</span>
                          <span className="font-medium">{amount.toLocaleString()} تومان</span>
                        </div>
                        <Progress value={(amount / (income || 1)) * 100} className="h-2 bg-custom-darker" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      اطلاعات دسته‌بندی موجود نیست
                    </div>
                  )}
                </div>
              </div>
              
              {/* Employee Payment Summary */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-custom-blue">خلاصه پرداختی به کارمندان</h3>
                {employeePayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام کارمند</TableHead>
                        <TableHead>سمت</TableHead>
                        <TableHead className="text-left">حقوق پایه</TableHead>
                        <TableHead className="text-left">پرداختی</TableHead>
                        <TableHead className="text-left">مانده</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeePayments.map((payment: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{payment.employeeName}</TableCell>
                          <TableCell>{payment.position}</TableCell>
                          <TableCell className="text-left">{payment.baseSalary.toLocaleString()} تومان</TableCell>
                          <TableCell className="text-left text-custom-blue">{payment.paid.toLocaleString()} تومان</TableCell>
                          <TableCell className="text-left text-custom-pink">{(payment.baseSalary - payment.paid).toLocaleString()} تومان</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    هیچ پرداختی به کارمندان در این بازه زمانی ثبت نشده است
                  </div>
                )}
              </div>
              
              {/* Transactions Table */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-custom-blue">لیست تراکنش‌ها</h3>
                {(transactions as any[]).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>توضیحات</TableHead>
                        <TableHead>دسته‌بندی</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead className="text-left">مبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(transactions as any[]).map((transaction: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>{formatPersianDate(new Date(transaction.date), 'yyyy/MM/dd')}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <Badge className={transaction.transactionType === 'income' ? 'bg-custom-blue/20 text-custom-blue' : 'bg-custom-pink/20 text-custom-pink'}>
                              {transaction.transactionType === 'income' ? 'درآمد' : 'هزینه'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-left ${transaction.transactionType === 'income' ? 'text-custom-blue' : 'text-custom-pink'}`}>
                            {transaction.transactionType === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} تومان
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    هیچ تراکنشی در این بازه زمانی ثبت نشده است
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setViewingReport(false)}
          >
            بازگشت
          </Button>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "pdf" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "excel" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی Excel
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render employee payments report
  const renderEmployeePaymentsReport = () => {
    const selectedEmployee = (employees as any[]).find((e: any) => e.id.toString() === form.watch("employeeId"));
    
    // Mock payment data
    const payments = [
      {
        id: 1,
        date: '2025-03-15',
        employeeId: selectedEmployee?.id || 1,
        employeeName: selectedEmployee?.name || 'کارمند',
        amount: selectedEmployee?.salary ? selectedEmployee.salary * 0.8 : 5000000,
        description: 'پرداخت حقوق فروردین',
        paymentMethod: 'کارت به کارت',
      },
      {
        id: 2,
        date: '2025-02-15',
        employeeId: selectedEmployee?.id || 1,
        employeeName: selectedEmployee?.name || 'کارمند',
        amount: selectedEmployee?.salary ? selectedEmployee.salary * 0.7 : 4000000,
        description: 'پرداخت حقوق اسفند',
        paymentMethod: 'کارت به کارت',
      }
    ];
    
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const baseSalary = selectedEmployee?.salary || 0;
    const remainingSalary = (baseSalary * 2) - totalPayments; // Mock calculation
    
    return (
      <Card className="bg-custom-dark border-custom-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-custom-blue flex items-center">
                <Banknote className="mr-2 h-5 w-5" />
                گزارش پرداختی به کارمندان
              </CardTitle>
              <CardDescription>
                {form.watch("startDate") && formatPersianDate(new Date(form.watch("startDate")), 'yyyy/MM/dd')} تا {form.watch("endDate") && formatPersianDate(new Date(form.watch("endDate")), 'yyyy/MM/dd')}
                {selectedEmployee ? ` - ${selectedEmployee.name}` : ''}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employeePaymentsQuery.isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-custom-blue border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {selectedEmployee && (
                <div className="bg-custom-darker p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-custom-blue font-medium">اطلاعات کارمند</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">نام:</span>
                          <span>{selectedEmployee.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">سمت:</span>
                          <span>{selectedEmployee.position || 'تعیین نشده'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">بخش:</span>
                          <span>{selectedEmployee.department || 'تعیین نشده'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاریخ استخدام:</span>
                          <span>{selectedEmployee.hireDate ? formatPersianDate(new Date(selectedEmployee.hireDate), 'yyyy/MM/dd') : 'تعیین نشده'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-custom-blue font-medium">خلاصه مالی</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">حقوق روزانه:</span>
                          <span>{baseSalary.toLocaleString()} تومان</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مجموع پرداختی‌ها:</span>
                          <span className="text-custom-blue">{totalPayments.toLocaleString()} تومان</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">مانده حساب:</span>
                          <span className="text-custom-pink">{remainingSalary.toLocaleString()} تومان</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment History */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-custom-blue">سابقه پرداخت‌ها</h3>
                {payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>تاریخ</TableHead>
                        <TableHead>شرح</TableHead>
                        <TableHead>روش پرداخت</TableHead>
                        <TableHead className="text-left">مبلغ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, i) => (
                        <TableRow key={i}>
                          <TableCell>{formatPersianDate(new Date(payment.date), 'yyyy/MM/dd')}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell className="text-left text-custom-blue">{payment.amount.toLocaleString()} تومان</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    هیچ سابقه پرداختی برای این کارمند در این بازه زمانی وجود ندارد
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={() => setViewingReport(false)}
          >
            بازگشت
          </Button>
          <div className="flex space-x-2 space-x-reverse">
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "pdf" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const data = {...form.getValues(), format: "excel" as const};
                generateReport.mutate(data);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              خروجی Excel
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Render report content based on type
  const renderReport = () => {
    if (!viewingReport) return null;
    
    const reportType = form.watch("reportType");
    
    switch (reportType) {
      case "attendance":
        return renderAttendanceReport();
      case "financial":
        return renderFinancialReport();
      case "employee-payments":
        return renderEmployeePaymentsReport();
      default:
        return (
          <div className="text-center py-16">
            <h3 className="text-lg text-muted-foreground">نوع گزارش انتخاب‌شده پشتیبانی نمی‌شود</h3>
          </div>
        );
    }
  };

  // Main component render
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-custom-blue">گزارش‌ها</h1>
      </div>
      
      {/* Render the report if viewing */}
      {viewingReport ? (
        renderReport()
      ) : (
        <>
          {/* Main report cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ReportCard 
              title="گزارش مالی"
              description="اطلاعات جامع درآمدها و هزینه‌ها، نمودارها و دسته‌بندی مالی"
              icon={<BarChart className="h-6 w-6 text-custom-blue" />}
              onClick={() => openReportDialog("financial")}
            />
            
            <ReportCard 
              title="گزارش حضور و غیاب"
              description="گزارش حضور روزانه کارمندان، مرخصی‌ها و محاسبه حقوق"
              icon={<Calendar className="h-6 w-6 text-custom-blue" />}
              onClick={() => openReportDialog("attendance")}
            />
            
            <ReportCard 
              title="گزارش کارمندان"
              description="اطلاعات پرسنلی، سوابق کاری و آمار منابع انسانی"
              icon={<Users className="h-6 w-6 text-custom-blue" />}
              onClick={() => openReportDialog("employees")}
            />
            
            <ReportCard 
              title="گزارش فاکتورها"
              description="وضعیت فاکتورهای صادرشده، پرداخت‌ها و بدهی‌ها"
              icon={<FileText className="h-6 w-6 text-custom-blue" />}
              onClick={() => openReportDialog("invoices")}
            />
          </div>
          
          {/* Quick reports */}
          <div className="bg-custom-dark rounded-lg p-4 mb-8">
            <h2 className="text-xl font-medium text-custom-blue mb-4">گزارش‌های سریع</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickReportCard 
                title="پرداختی‌ها به کارمندان"
                icon={<Banknote className="h-5 w-5" />}
                onClick={() => openReportDialog("employee-payments")}
              />
              
              <QuickReportCard 
                title="خلاصه درآمد و هزینه"
                icon={<FilePieChart className="h-5 w-5" />}
                onClick={() => openReportDialog("financial")}
              />
              
              <QuickReportCard 
                title="وضعیت فاکتورهای معوقه"
                icon={<CreditCard className="h-5 w-5" />}
                onClick={() => {
                  form.setValue("status", "overdue");
                  openReportDialog("invoices");
                }}
              />
              
              <QuickReportCard 
                title="گزارش تأخیر کارمندان"
                icon={<Clock className="h-5 w-5" />}
                onClick={() => openReportDialog("attendance")}
              />
            </div>
          </div>
          
          {/* Recent exports */}
          <div>
            <h2 className="text-xl font-medium text-custom-blue mb-4">گزارش‌های اخیر</h2>
            <div className="bg-custom-dark rounded-lg p-4">
              <div className="text-center py-8 text-muted-foreground">
                هیچ گزارشی اخیراً تولید نشده است
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Report dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تنظیمات گزارش</DialogTitle>
            <DialogDescription>
              اطلاعات گزارش مورد نظر را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ شروع</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاریخ پایان</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Date shortcuts */}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange("today")}>
                  امروز
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange("thisWeek")}>
                  این هفته
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange("thisMonth")}>
                  این ماه
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange("lastMonth")}>
                  ماه قبل
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange("thisYear")}>
                  امسال
                </Button>
              </div>
              
              <Separator />
              
              {/* Dynamic fields based on report type */}
              {showReportTypeFields()}
              
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>فرمت خروجی</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب فرمت" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">نمایش در برنامه</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={generateReport.isPending}>
                  {generateReport.isPending && (
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-r-transparent rounded-full"></div>
                  )}
                  تولید گزارش
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Report Card Component
interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ReportCard({ title, description, icon, onClick }: ReportCardProps) {
  return (
    <Card className="hover:bg-custom-dark/80 transition-colors cursor-pointer bg-custom-dark border-custom-dark" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="bg-custom-darker p-3 rounded-full">
            {icon}
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-custom-darker border-custom-darker">
            <FileDown className="h-4 w-4 text-custom-blue" />
          </Button>
        </div>
        <CardTitle className="mt-4 text-custom-blue">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

// Quick Report Card Component
interface QuickReportCardProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function QuickReportCard({ title, icon, onClick }: QuickReportCardProps) {
  return (
    <Card 
      className="hover:bg-custom-dark/80 transition-colors cursor-pointer bg-custom-dark border-custom-dark" 
      onClick={onClick}
    >
      <CardContent className="flex items-center p-4">
        <div className="bg-custom-darker p-2 rounded-full text-custom-blue">
          {icon}
        </div>
        <h3 className="font-medium mr-3 text-custom-blue">{title}</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 mr-auto text-custom-blue">
          <Download className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}