import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

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
  DialogTrigger,
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
import { Search, Plus, Edit, Users } from "lucide-react";

// Form validation schema
const employeeSchema = z.object({
  name: z.string().min(2, { message: "نام کارمند باید حداقل 2 کاراکتر باشد" }),
  position: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email({ message: "لطفاً یک ایمیل معتبر وارد کنید" }).optional().nullable(),
  phone: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
  salary: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['/api/employees'],
  });

  // Employee form
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      hireDate: "",
      salary: "",
      isActive: true,
    },
  });

  // Create employee mutation
  const createEmployee = useMutation({
    mutationFn: async (data: EmployeeFormValues) => {
      const response = await apiRequest("/api/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create employee");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "کارمند جدید",
        description: "کارمند جدید با موفقیت اضافه شد",
      });
      setEmployeeDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد کارمند جدید",
      });
    },
  });

  // Update employee mutation
  const updateEmployee = useMutation({
    mutationFn: async (data: { id: number; data: Partial<EmployeeFormValues> }) => {
      const response = await apiRequest(`/api/employees/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify(data.data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update employee");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "به‌روزرسانی کارمند",
        description: "اطلاعات کارمند با موفقیت به‌روزرسانی شد",
      });
      setEmployeeDialogOpen(false);
      setCurrentEmployee(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی اطلاعات کارمند",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: EmployeeFormValues) => {
    if (currentEmployee) {
      updateEmployee.mutate({ id: currentEmployee.id, data });
    } else {
      createEmployee.mutate(data);
    }
  };

  // Open dialog to edit employee
  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    form.reset({
      name: employee.name,
      position: employee.position || "",
      department: employee.department || "",
      email: employee.email || "",
      phone: employee.phone || "",
      hireDate: employee.hireDate || "",
      salary: employee.salary || "",
      isActive: employee.isActive === null ? true : employee.isActive,
    });
    setEmployeeDialogOpen(true);
  };

  // Open dialog to add new employee
  const handleAddEmployee = () => {
    setCurrentEmployee(null);
    form.reset({
      name: "",
      position: "",
      department: "",
      email: "",
      phone: "",
      hireDate: "",
      salary: "",
      isActive: true,
    });
    setEmployeeDialogOpen(true);
  };

  // Filter employees based on search term and active status
  const filteredActiveEmployees = employees.filter((employee: Employee) => 
    employee.isActive && 
    (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredInactiveEmployees = employees.filter((employee: Employee) => 
    !employee.isActive && 
    (employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.position && employee.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.department && employee.department.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">مدیریت کارمندان</h2>
        <Button onClick={handleAddEmployee}>
          <Plus className="w-4 h-4 mr-2" />
          افزودن کارمند
        </Button>
      </div>

      <div className="flex items-center space-x-2 bg-white border rounded-md px-3 py-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در کارمندان..."
          className="flex-1 border-0 focus:ring-0 focus:outline-none text-sm bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="active">
            <Users className="w-4 h-4 mr-2" />
            کارمندان فعال
          </TabsTrigger>
          <TabsTrigger value="inactive">
            <Users className="w-4 h-4 mr-2" />
            کارمندان غیرفعال
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array(6).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredActiveEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredActiveEmployees.map((employee: Employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={() => handleEditEmployee(employee)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? (
                <p>هیچ کارمند فعالی با معیار جستجوی شما پیدا نشد</p>
              ) : (
                <p>هیچ کارمند فعالی وجود ندارد</p>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="inactive">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array(3).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredInactiveEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {filteredInactiveEmployees.map((employee: Employee) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  onEdit={() => handleEditEmployee(employee)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {searchTerm ? (
                <p>هیچ کارمند غیرفعالی با معیار جستجوی شما پیدا نشد</p>
              ) : (
                <p>هیچ کارمند غیرفعالی وجود ندارد</p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Employee form dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentEmployee ? "ویرایش اطلاعات کارمند" : "افزودن کارمند جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات کارمند را وارد کنید و دکمه ذخیره را بزنید.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام و نام خانوادگی</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="نام و نام خانوادگی کارمند" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سمت سازمانی</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="سمت سازمانی" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>بخش / دپارتمان</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="بخش یا دپارتمان" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ایمیل</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="آدرس ایمیل" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره تلفن</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="شماره تلفن" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ استخدام</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="YYYY-MM-DD" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حقوق</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مبلغ حقوق" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-x-reverse">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel>کارمند فعال</FormLabel>
                      <FormDescription>
                        این کارمند در حال حاضر در سازمان فعال است
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmployeeDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
                  {createEmployee.isPending || updateEmployee.isPending ? (
                    "در حال پردازش..."
                  ) : (
                    "ذخیره اطلاعات"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Employee Card Component
interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
}

function EmployeeCard({ employee, onEdit }: EmployeeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{employee.name}</CardTitle>
            <CardDescription>
              {employee.position || "بدون سمت"}
              {employee.department && ` | ${employee.department}`}
            </CardDescription>
          </div>
          {!employee.isActive && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
              غیرفعال
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          {employee.email && (
            <div className="flex items-center text-muted-foreground">
              <span>ایمیل:</span>
              <span className="mr-1">{employee.email}</span>
            </div>
          )}
          {employee.phone && (
            <div className="flex items-center text-muted-foreground">
              <span>تلفن:</span>
              <span className="mr-1">{employee.phone}</span>
            </div>
          )}
          {employee.hireDate && (
            <div className="flex items-center text-muted-foreground">
              <span>تاریخ استخدام:</span>
              <span className="mr-1">{employee.hireDate}</span>
            </div>
          )}
          {employee.salary && (
            <div className="flex items-center text-muted-foreground">
              <span>حقوق:</span>
              <span className="mr-1">{employee.salary} تومان</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          ویرایش
        </Button>
      </CardFooter>
    </Card>
  );
}