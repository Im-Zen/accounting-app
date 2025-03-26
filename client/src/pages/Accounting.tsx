import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Invoice } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  Plus,
  Search,
  Calendar,
  Edit,
  Check,
  X,
  Download,
} from "lucide-react";

// Transaction form schema
const transactionSchema = z.object({
  transactionType: z.enum(["income", "expense"]),
  date: z.string().min(1, { message: "تاریخ تراکنش الزامی است" }),
  amount: z.string().min(1, { message: "مبلغ تراکنش الزامی است" }),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  referenceId: z.string().nullable().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Invoice form schema
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "شماره فاکتور الزامی است" }),
  clientName: z.string().nullable().optional(),
  issueDate: z.string().min(1, { message: "تاریخ صدور الزامی است" }),
  dueDate: z.string().nullable().optional(),
  amount: z.string().min(1, { message: "مبلغ فاکتور الزامی است" }),
  status: z.enum(["pending", "paid", "overdue"]).default("pending"),
  notes: z.string().nullable().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export default function Accounting() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(location.split('?')[1] || '');
  const initialTab = queryParams.get('tab') || "transactions";
  const initialType = queryParams.get('type') || undefined;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(initialType !== undefined);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set transaction type based on URL param
  useEffect(() => {
    if (initialType && (initialType === "income" || initialType === "expense")) {
      transactionForm.setValue("transactionType", initialType);
    }
  }, [initialType]);

  // Fetch transactions
  const { 
    data: transactions = [], 
    isLoading: transactionsLoading 
  } = useQuery({
    queryKey: ['/api/transactions'],
  });

  // Fetch invoices
  const { 
    data: invoices = [], 
    isLoading: invoicesLoading 
  } = useQuery({
    queryKey: ['/api/invoices'],
  });

  // Transaction form
  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: initialType as "income" | "expense" || "income",
      date: new Date().toISOString().split('T')[0],
      amount: "",
      category: "",
      description: "",
      referenceId: "",
    },
  });

  // Invoice form
  const invoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: "",
      clientName: "",
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      amount: "",
      status: "pending",
      notes: "",
    },
  });

  // Create transaction mutation
  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      const response = await apiRequest("/api/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در ایجاد تراکنش");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "تراکنش جدید",
        description: "تراکنش جدید با موفقیت ثبت شد",
      });
      setTransactionDialogOpen(false);
      transactionForm.reset({
        transactionType: "income",
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        description: "",
        referenceId: "",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ثبت تراکنش",
      });
    },
  });

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: InvoiceFormValues) => {
      const response = await apiRequest("/api/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در ایجاد فاکتور");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "فاکتور جدید",
        description: "فاکتور جدید با موفقیت ثبت شد",
      });
      setInvoiceDialogOpen(false);
      invoiceForm.reset({
        invoiceNumber: "",
        clientName: "",
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: "",
        amount: "",
        status: "pending",
        notes: "",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ثبت فاکتور",
      });
    },
  });

  // Update invoice status mutation
  const updateInvoiceStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest(`/api/invoices/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در به‌روزرسانی وضعیت فاکتور");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      toast({
        title: "بروزرسانی فاکتور",
        description: "وضعیت فاکتور با موفقیت بروزرسانی شد",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در بروزرسانی وضعیت فاکتور",
      });
    },
  });

  // Transaction form submission
  const onTransactionSubmit = (data: TransactionFormValues) => {
    createTransaction.mutate(data);
  };

  // Invoice form submission
  const onInvoiceSubmit = (data: InvoiceFormValues) => {
    createInvoice.mutate(data);
  };

  // Open dialog to add new transaction
  const handleAddTransaction = (type: "income" | "expense") => {
    setCurrentTransaction(null);
    transactionForm.reset({
      transactionType: type,
      date: new Date().toISOString().split('T')[0],
      amount: "",
      category: "",
      description: "",
      referenceId: "",
    });
    setTransactionDialogOpen(true);
  };

  // Open dialog to add new invoice
  const handleAddInvoice = () => {
    setCurrentInvoice(null);
    const currentDate = new Date();
    
    // Default due date to 30 days from now
    const dueDate = new Date(currentDate);
    dueDate.setDate(dueDate.getDate() + 30);

    invoiceForm.reset({
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      clientName: "",
      issueDate: currentDate.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      amount: "",
      status: "pending",
      notes: "",
    });
    setInvoiceDialogOpen(true);
  };

  // Toggle invoice status
  const toggleInvoiceStatus = (invoice: Invoice) => {
    const newStatus = invoice.status === "paid" ? "pending" : "paid";
    updateInvoiceStatus.mutate({ id: invoice.id, status: newStatus });
  };

  // Filter transactions based on search term and type
  const filteredTransactions = transactions.filter((transaction: Transaction) => 
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.amount.toString().includes(searchTerm) ||
    (transaction.referenceId && transaction.referenceId.includes(searchTerm))
  );

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter((invoice: Invoice) => 
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.clientName && invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    invoice.amount.toString().includes(searchTerm) ||
    invoice.status.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">مدیریت مالی</h2>
        <div className="flex items-center space-x-2 space-x-reverse">
          {activeTab === "transactions" ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleAddTransaction("expense")}
                className="mr-2"
              >
                <ArrowDownCircle className="w-4 h-4 ml-2 text-red-500" />
                ثبت هزینه
              </Button>
              <Button onClick={() => handleAddTransaction("income")}>
                <ArrowUpCircle className="w-4 h-4 ml-2 text-green-500" />
                ثبت درآمد
              </Button>
            </>
          ) : (
            <Button onClick={handleAddInvoice}>
              <FileText className="w-4 h-4 ml-2" />
              ایجاد فاکتور جدید
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={activeTab === "transactions" ? "جستجو در تراکنش‌ها..." : "جستجو در فاکتورها..."}
          className="flex-1 border-0 focus:ring-0 focus:outline-none text-sm bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue={initialTab} className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="transactions">
            <ArrowUpCircle className="w-4 h-4 ml-2" />
            تراکنش‌ها
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="w-4 h-4 ml-2" />
            فاکتورها
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {transactionsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction: Transaction) => (
                <TransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? (
                <p>هیچ تراکنشی با معیار جستجوی شما پیدا نشد</p>
              ) : (
                <p>هیچ تراکنشی ثبت نشده است</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          {invoicesLoading ? (
            <div className="space-y-4">
              {Array(3).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice: Invoice) => (
                <InvoiceCard 
                  key={invoice.id} 
                  invoice={invoice} 
                  onStatusToggle={() => toggleInvoiceStatus(invoice)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? (
                <p>هیچ فاکتوری با معیار جستجوی شما پیدا نشد</p>
              ) : (
                <p>هیچ فاکتوری ثبت نشده است</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Transaction form dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {transactionForm.getValues("transactionType") === "income" 
                ? "ثبت درآمد جدید" 
                : "ثبت هزینه جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات تراکنش را وارد کنید و دکمه ذخیره را بزنید.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...transactionForm}>
            <form onSubmit={transactionForm.handleSubmit(onTransactionSubmit)} className="space-y-4">
              <FormField
                control={transactionForm.control}
                name="transactionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع تراکنش</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="نوع تراکنش را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">درآمد</SelectItem>
                        <SelectItem value="expense">هزینه</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={transactionForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={transactionForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبلغ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مبلغ به تومان" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={transactionForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>دسته‌بندی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="دسته‌بندی تراکنش" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transactionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="توضیحات تراکنش را وارد کنید"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={transactionForm.control}
                name="referenceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره مرجع</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="شماره مرجع یا رسید" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTransactionDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTransaction.isPending}
                >
                  {createTransaction.isPending ? "در حال ثبت..." : "ذخیره تراکنش"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Invoice form dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              ایجاد فاکتور جدید
            </DialogTitle>
            <DialogDescription>
              اطلاعات فاکتور را وارد کنید و دکمه ذخیره را بزنید.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(onInvoiceSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره فاکتور</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="شماره فاکتور" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={invoiceForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مبلغ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مبلغ به تومان" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={invoiceForm.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مشتری</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="نام مشتری یا شرکت" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ صدور</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={invoiceForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ سررسید</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={invoiceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="وضعیت فاکتور را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                        <SelectItem value="paid">پرداخت شده</SelectItem>
                        <SelectItem value="overdue">معوقه</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>یادداشت</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="یادداشت یا توضیحات اضافی"
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInvoiceDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  disabled={createInvoice.isPending}
                >
                  {createInvoice.isPending ? "در حال ثبت..." : "ذخیره فاکتور"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Transaction Card Component
interface TransactionCardProps {
  transaction: Transaction;
}

function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div className="flex items-center">
            {transaction.transactionType === "income" ? (
              <ArrowUpCircle className="h-5 w-5 text-green-500 ml-2" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500 ml-2" />
            )}
            <CardTitle className="text-lg">
              {transaction.transactionType === "income" ? "درآمد" : "هزینه"}
              {transaction.category && ` - ${transaction.category}`}
            </CardTitle>
          </div>
          <div className={`text-lg font-bold ${
            transaction.transactionType === "income" 
              ? "text-green-600" 
              : "text-red-600"
          }`}>
            {Number(transaction.amount).toLocaleString()} تومان
          </div>
        </div>
        <CardDescription className="mt-1 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {transaction.date}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transaction.description && (
          <p className="text-sm text-gray-600">{transaction.description}</p>
        )}
        {transaction.referenceId && (
          <div className="mt-2 text-xs text-gray-500">
            شماره مرجع: {transaction.referenceId}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Invoice Card Component
interface InvoiceCardProps {
  invoice: Invoice;
  onStatusToggle: () => void;
}

function InvoiceCard({ invoice, onStatusToggle }: InvoiceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 ml-2 text-blue-500" />
              فاکتور #{invoice.invoiceNumber}
            </CardTitle>
            {invoice.clientName && (
              <CardDescription className="mt-1">
                مشتری: {invoice.clientName}
              </CardDescription>
            )}
          </div>
          <div>
            <Badge
              className={
                invoice.status === "paid"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : invoice.status === "overdue"
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }
            >
              {invoice.status === "paid"
                ? "پرداخت شده"
                : invoice.status === "overdue"
                ? "معوقه"
                : "در انتظار پرداخت"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="text-sm text-gray-500">تاریخ صدور</div>
            <div className="font-medium">{invoice.issueDate}</div>
          </div>
          {invoice.dueDate && (
            <div>
              <div className="text-sm text-gray-500">تاریخ سررسید</div>
              <div className="font-medium">{invoice.dueDate}</div>
            </div>
          )}
        </div>
        <div className="text-lg font-bold text-right border-t pt-2 mt-2">
          {Number(invoice.amount).toLocaleString()} تومان
        </div>
        {invoice.notes && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="text-xs text-gray-500">یادداشت:</div>
            {invoice.notes}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onStatusToggle}>
          {invoice.status === "paid" ? (
            <>
              <X className="h-4 w-4 ml-1 text-red-500" />
              علامت‌گذاری به عنوان پرداخت نشده
            </>
          ) : (
            <>
              <Check className="h-4 w-4 ml-1 text-green-500" />
              علامت‌گذاری به عنوان پرداخت شده
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm">
          <Download className="h-4 w-4 ml-1" />
          دانلود PDF
        </Button>
      </CardFooter>
    </Card>
  );
}