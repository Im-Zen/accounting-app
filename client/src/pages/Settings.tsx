import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUpFromLine,
  CloudUpload,
  Download,
  Loader2,
  Building,
  Shield,
  Users,
  Settings as SettingsIcon,
} from "lucide-react";

// Company form schema
const companyFormSchema = z.object({
  companyName: z.string().min(1, { message: "نام شرکت الزامی است" }),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "ایمیل معتبر نیست" }).optional().or(z.literal('')),
  website: z.string().optional(),
  logo: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// User form schema
const userFormSchema = z.object({
  username: z.string().min(3, { message: "نام کاربری باید حداقل 3 کاراکتر باشد" }),
  currentPassword: z.string().min(1, { message: "رمز عبور فعلی الزامی است" }),
  newPassword: z.string().min(6, { message: "رمز عبور جدید باید حداقل 6 کاراکتر باشد" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "رمز عبور جدید و تکرار آن باید یکسان باشند",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function Settings() {
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [googleAuthDialogOpen, setGoogleAuthDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get settings
  const { data: settings = {}, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Company form
  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      companyName: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      logo: "",
    },
  });

  // User form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Set form values when settings are loaded
  useState(() => {
    if (settings.company) {
      companyForm.reset({
        companyName: settings.company.name || "",
        address: settings.company.address || "",
        phone: settings.company.phone || "",
        email: settings.company.email || "",
        website: settings.company.website || "",
        logo: settings.company.logo || "",
      });
    }
    
    if (settings.user) {
      userForm.setValue("username", settings.user.username || "");
    }
  });

  // Update company settings mutation
  const updateCompanySettings = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await apiRequest('/api/settings/company', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در بروزرسانی اطلاعات شرکت");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "بروزرسانی اطلاعات",
        description: "اطلاعات شرکت با موفقیت بروزرسانی شد",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در بروزرسانی اطلاعات شرکت",
      });
    },
  });

  // Change password mutation
  const changePassword = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const response = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در تغییر رمز عبور");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "تغییر رمز عبور",
        description: "رمز عبور با موفقیت تغییر یافت",
      });
      setPasswordDialogOpen(false);
      userForm.reset({
        username: userForm.getValues("username"),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در تغییر رمز عبور",
      });
    },
  });

  // Backup database mutation
  const backupDatabase = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/backup', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در پشتیبان‌گیری");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "پشتیبان‌گیری",
        description: "پشتیبان‌گیری با موفقیت انجام شد",
      });
      setBackupDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در پشتیبان‌گیری",
      });
    },
  });

  // Restore database mutation
  const restoreDatabase = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiRequest('/api/restore', {
        method: 'POST',
        body: JSON.stringify({ fileId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در بازیابی پشتیبان");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "بازیابی اطلاعات",
        description: "بازیابی اطلاعات با موفقیت انجام شد. سیستم در حال بارگذاری مجدد است...",
      });
      setRestoreDialogOpen(false);
      
      // Reload after 2 seconds to allow server to restart
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در بازیابی اطلاعات",
      });
    },
  });

  // Google Drive authorization mutation
  const authorizeGoogleDrive = useMutation({
    mutationFn: async (authCode: string) => {
      const response = await apiRequest('/api/google/authorize', {
        method: 'POST',
        body: JSON.stringify({ authCode }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در احراز هویت Google Drive");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "اتصال Google Drive",
        description: "اتصال به Google Drive با موفقیت انجام شد",
      });
      setGoogleAuthDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در اتصال به Google Drive",
      });
    },
  });

  // Toggle auto backup mutation
  const toggleAutoBackup = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('/api/settings/auto-backup', {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "خطا در تنظیم پشتیبان‌گیری خودکار");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "پشتیبان‌گیری خودکار",
        description: data.enabled 
          ? "پشتیبان‌گیری خودکار فعال شد" 
          : "پشتیبان‌گیری خودکار غیرفعال شد",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در تنظیم پشتیبان‌گیری خودکار",
      });
    },
  });

  // Company form submission
  const onCompanySubmit = (data: CompanyFormValues) => {
    updateCompanySettings.mutate(data);
  };

  // User form submission
  const onUserSubmit = (data: UserFormValues) => {
    changePassword.mutate(data);
  };

  // Disconnect Google Drive
  const disconnectGoogleDrive = async () => {
    try {
      const response = await apiRequest('/api/google/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "قطع اتصال",
          description: "اتصال به Google Drive با موفقیت قطع شد",
        });
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "خطا",
          description: error.error || "خطا در قطع اتصال از Google Drive",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در قطع اتصال از Google Drive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">تنظیمات</h2>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full md:w-[600px] grid-cols-3">
          <TabsTrigger value="company">
            <Building className="h-4 w-4 ml-2" />
            اطلاعات شرکت
          </TabsTrigger>
          <TabsTrigger value="backup">
            <CloudUpload className="h-4 w-4 ml-2" />
            پشتیبان‌گیری
          </TabsTrigger>
          <TabsTrigger value="account">
            <Shield className="h-4 w-4 ml-2" />
            امنیت حساب
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات شرکت</CardTitle>
              <CardDescription>
                اطلاعات شرکت شما در گزارش‌ها و فاکتورها نمایش داده می‌شود
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4 mt-4"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <Form {...companyForm}>
                  <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                    <FormField
                      control={companyForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام شرکت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="نام شرکت یا کسب و کار" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={companyForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>شماره تماس</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="شماره تماس شرکت" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={companyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ایمیل</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="ایمیل شرکت" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>وب‌سایت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="آدرس وب‌سایت" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آدرس</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="آدرس شرکت" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end mt-6">
                      <Button
                        type="submit"
                        disabled={updateCompanySettings.isPending}
                      >
                        {updateCompanySettings.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            در حال ذخیره...
                          </>
                        ) : (
                          "ذخیره اطلاعات"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Backup/Restore Card */}
            <Card>
              <CardHeader>
                <CardTitle>پشتیبان‌گیری و بازیابی</CardTitle>
                <CardDescription>
                  پشتیبان‌گیری از داده‌ها و بازیابی آن‌ها در صورت نیاز
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium">پشتیبان‌گیری دستی</h3>
                    <p className="text-sm text-muted-foreground">
                      ایجاد یک نسخه پشتیبان از تمام داده‌های سیستم در لحظه فعلی
                    </p>
                    <Button 
                      className="mt-2 w-full"
                      onClick={() => setBackupDialogOpen(true)}
                    >
                      <ArrowUpFromLine className="mr-2 h-4 w-4" />
                      پشتیبان‌گیری
                    </Button>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium">بازیابی اطلاعات</h3>
                    <p className="text-sm text-muted-foreground">
                      بازیابی اطلاعات از آخرین نسخه پشتیبان یا انتخاب از لیست نسخه‌های قبلی
                    </p>
                    <Button 
                      className="mt-2 w-full" 
                      variant="outline"
                      onClick={() => setRestoreDialogOpen(true)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      بازیابی اطلاعات
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Drive Integration Card */}
            <Card>
              <CardHeader>
                <CardTitle>اتصال به Google Drive</CardTitle>
                <CardDescription>
                  پشتیبان‌گیری خودکار در Google Drive با قابلیت همگام‌سازی
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.googleDrive?.connected ? (
                  <>
                    <div className="p-3 bg-green-50 text-green-700 rounded-md">
                      <div className="flex items-center">
                        <CloudUpload className="h-5 w-5 mr-2" />
                        <p className="font-medium">به Google Drive متصل شده‌اید</p>
                      </div>
                      <p className="text-sm mt-1">
                        آخرین همگام‌سازی: {settings.googleDrive.lastSync || "همگام‌سازی نشده"}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">پشتیبان‌گیری خودکار</h3>
                          <p className="text-sm text-muted-foreground">
                            پشتیبان‌گیری خودکار روزانه در Google Drive
                          </p>
                        </div>
                        <Switch
                          checked={settings.autoBackup?.enabled}
                          onCheckedChange={(checked) => toggleAutoBackup.mutate(checked)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      className="w-full mt-4"
                      onClick={disconnectGoogleDrive}
                    >
                      قطع اتصال از Google Drive
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md">
                      <div className="flex items-center">
                        <CloudUpload className="h-5 w-5 mr-2" />
                        <p className="font-medium">به Google Drive متصل نشده‌اید</p>
                      </div>
                      <p className="text-sm mt-1">
                        با اتصال به Google Drive، می‌توانید از داده‌های خود پشتیبان‌گیری خودکار داشته باشید
                      </p>
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => setGoogleAuthDialogOpen(true)}
                    >
                      <CloudUpload className="mr-2 h-4 w-4" />
                      اتصال به Google Drive
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Security Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>امنیت حساب کاربری</CardTitle>
              <CardDescription>
                مدیریت اطلاعات حساب کاربری و تنظیمات امنیتی
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">اطلاعات کاربر</h3>
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">نام کاربری</p>
                      <p className="text-muted-foreground">{settings.user?.username || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">آخرین ورود</p>
                      <p className="text-muted-foreground">{settings.user?.lastLogin || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">تغییر رمز عبور</h3>
                <p className="text-sm text-muted-foreground">
                  برای امنیت بیشتر، توصیه می‌شود هر چند ماه یکبار رمز عبور خود را تغییر دهید
                </p>
                <Button 
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  تغییر رمز عبور
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>پشتیبان‌گیری از اطلاعات</DialogTitle>
            <DialogDescription>
              یک نسخه پشتیبان از تمام اطلاعات سیستم ایجاد می‌شود.
              {settings.googleDrive?.connected ? 
                " این نسخه در Google Drive ذخیره خواهد شد." : 
                " این نسخه به صورت فایل قابل دانلود ارائه می‌شود."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-amber-500 text-sm mb-4">
              <strong>توجه:</strong> در حین پشتیبان‌گیری سیستم را ترک نکنید و پنجره را نبندید.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setBackupDialogOpen(false)}
              >
                انصراف
              </Button>
              <Button
                onClick={() => backupDatabase.mutate()}
                disabled={backupDatabase.isPending}
              >
                {backupDatabase.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال پشتیبان‌گیری...
                  </>
                ) : (
                  "شروع پشتیبان‌گیری"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>بازیابی اطلاعات</DialogTitle>
            <DialogDescription>
              بازیابی اطلاعات از نسخه پشتیبان. این عملیات اطلاعات فعلی را با نسخه پشتیبان جایگزین می‌کند.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {settings.backups && settings.backups.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium mb-2">انتخاب نسخه پشتیبان:</p>
                <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                  {settings.backups.map((backup: any) => (
                    <div
                      key={backup.id}
                      className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => restoreDatabase.mutate(backup.id)}
                    >
                      <div>
                        <p className="font-medium">{backup.date}</p>
                        <p className="text-sm text-muted-foreground">{backup.size}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                هیچ نسخه پشتیبانی یافت نشد
              </p>
            )}
            
            <p className="text-red-500 text-sm mt-4">
              <strong>هشدار:</strong> بازیابی اطلاعات تمام داده‌های فعلی را با نسخه پشتیبان جایگزین می‌کند. این عملیات غیرقابل بازگشت است.
            </p>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setRestoreDialogOpen(false)}
              >
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Auth Dialog */}
      <Dialog open={googleAuthDialogOpen} onOpenChange={setGoogleAuthDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>اتصال به Google Drive</DialogTitle>
            <DialogDescription>
              برای اتصال به Google Drive، مراحل زیر را دنبال کنید:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>روی دکمه "ورود به حساب Google" کلیک کنید</li>
              <li>وارد حساب Google خود شوید و دسترسی‌های لازم را تأیید کنید</li>
              <li>کد احراز هویت را در کادر زیر وارد کنید</li>
            </ol>
            
            <div className="flex justify-center my-4">
              <Button onClick={() => window.open(settings.googleAuthUrl || '#', '_blank')}>
                ورود به حساب Google
              </Button>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="authCode" className="text-sm font-medium">
                کد احراز هویت:
              </label>
              <Input
                id="authCode"
                placeholder="کد احراز هویت را وارد کنید"
                onChange={(e) => {}}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setGoogleAuthDialogOpen(false)}
              >
                انصراف
              </Button>
              <Button
                onClick={() => authorizeGoogleDrive.mutate("auth_code_here")}
                disabled={authorizeGoogleDrive.isPending}
              >
                {authorizeGoogleDrive.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال اتصال...
                  </>
                ) : (
                  "تأیید و اتصال"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تغییر رمز عبور</DialogTitle>
            <DialogDescription>
              برای تغییر رمز عبور، رمز فعلی و رمز جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4 py-4">
              <FormField
                control={userForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور فعلی</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رمز عبور جدید</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={userForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تکرار رمز عبور جدید</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                >
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      در حال اعمال تغییرات...
                    </>
                  ) : (
                    "تغییر رمز عبور"
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