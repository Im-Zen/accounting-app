import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Users,
  FileText,
  Activity,
  BarChart3
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Transaction {
  id: number;
  date: string;
  transactionType: string;
  category: string;
  description: string;
  amount: number;
}

interface DashboardData {
  employeeCount: number;
  activeEmployees: number;
  income: number;
  expenses: number;
  balance: number;
  pendingInvoices: number;
  overdueInvoices: number;
  recentTransactions: Transaction[];
}

export default function Dashboard() {
  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
  });

  // Default values
  const income = data?.income || 0;
  const expenses = data?.expenses || 0;
  const balance = data?.balance || 0;
  const employeeCount = data?.employeeCount || 0;
  const pendingInvoices = data?.pendingInvoices || 0;
  const overdueInvoices = data?.overdueInvoices || 0;
  const transactions = data?.recentTransactions || [];
  
  // Calculate total invoices for progress bar
  const totalInvoices = pendingInvoices + overdueInvoices;
  
  // Sample data for charts
  const financialData = [
    { name: 'فروردین', income: 400000, expenses: 240000 },
    { name: 'اردیبهشت', income: 300000, expenses: 139000 },
    { name: 'خرداد', income: 200000, expenses: 980000 },
    { name: 'تیر', income: 278000, expenses: 390000 },
    { name: 'مرداد', income: 189000, expenses: 480000 },
    { name: 'شهریور', income: 239000, expenses: 380000 },
    { name: 'مهر', income: 349000, expenses: 430000 },
  ];
  
  const pieData = [
    { name: 'درآمد', value: income, color: '#00FFFF' },
    { name: 'هزینه', value: expenses, color: '#FF1493' },
  ];
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        خطا در بارگیری اطلاعات داشبورد. لطفاً صفحه را بارگذاری مجدد کنید.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">داشبورد</h2>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('fa-IR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="درآمد ماه جاری"
          value={`${income.toLocaleString()} تومان`}
          description="کل درآمد ثبت شده"
          icon={<ArrowUpCircle className="h-4 w-4 text-custom-blue" />}
          loading={isLoading}
        />
        <StatsCard
          title="هزینه‌های ماه جاری"
          value={`${expenses.toLocaleString()} تومان`}
          description="کل هزینه‌های ثبت شده"
          icon={<ArrowDownCircle className="h-4 w-4 text-custom-pink" />}
          loading={isLoading}
        />
        <StatsCard
          title="موجودی حساب"
          value={`${balance.toLocaleString()} تومان`}
          description="موجودی فعلی"
          icon={<DollarSign className="h-4 w-4 text-custom-purple" />}
          loading={isLoading}
        />
        <StatsCard
          title="تعداد کارمندان"
          value={employeeCount}
          description="کارمندان فعال"
          icon={<Users className="h-4 w-4 text-custom-teal" />}
          loading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Financial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-4 w-4 text-custom-blue mr-2" />
              <span>روند مالی</span>
            </CardTitle>
            <CardDescription>
              نمودار درآمد و هزینه‌های ماه‌های اخیر
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              {isLoading ? (
                <div className="w-full h-full bg-card animate-pulse rounded-md"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={financialData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FFFF" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#00FFFF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF1493" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#FF1493" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#262f45"
                      vertical={false}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} تومان`]}
                      contentStyle={{
                        backgroundColor: 'hsl(260 15% 15%)',
                        borderColor: 'hsl(260 15% 20%)',
                        color: 'white'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#00FFFF"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6, className: 'animate-pulse' }}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      name="درآمد"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#FF1493"
                      strokeWidth={2}
                      dot={true}
                      activeDot={{ r: 6, className: 'animate-pulse' }}
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                      name="هزینه"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-4 w-4 text-custom-pink mr-2" />
              <span>توزیع مالی</span>
            </CardTitle>
            <CardDescription>
              نسبت درآمد به هزینه در دوره جاری
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex h-[300px] items-center justify-center">
              {isLoading ? (
                <div className="w-full h-full bg-card animate-pulse rounded-md"></div>
              ) : (
                <>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        className="chart-circle"
                        stroke="transparent"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="chart-pulse" />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value.toLocaleString()} تومان`]}
                        contentStyle={{
                          backgroundColor: 'hsl(260 15% 15%)',
                          borderColor: 'hsl(260 15% 20%)',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    {pieData.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <div className="text-sm font-medium">{item.name}: {item.value.toLocaleString()} تومان</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Transactions */}
        <Card className="lg:col-span-4 bg-custom-dark border-custom-dark">
          <CardHeader>
            <CardTitle className="text-custom-blue">تراکنش‌های اخیر</CardTitle>
            <CardDescription>
              تراکنش‌های مالی ثبت شده در ۳۰ روز گذشته
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(5).fill(null).map((_, i) => (
                  <div key={i} className="h-12 bg-card animate-pulse rounded"></div>
                ))}
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-custom-dark pb-2">
                    <div className="flex items-center">
                      <div className={`mr-2 p-2 rounded-full ${
                        transaction.transactionType === 'income' 
                          ? 'bg-custom-blue/10' 
                          : 'bg-custom-pink/10'
                      }`}>
                        {transaction.transactionType === 'income' ? (
                          <ArrowUpCircle className="h-4 w-4 text-custom-blue" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-custom-pink" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description || transaction.category}</div>
                        <div className="text-sm text-muted-foreground">{transaction.date}</div>
                      </div>
                    </div>
                    <div className={`font-medium ${
                      transaction.transactionType === 'income' 
                        ? 'text-custom-blue' 
                        : 'text-custom-pink'
                    }`}>
                      {transaction.transactionType === 'income' ? '+' : '-'}
                      {transaction.amount.toLocaleString()} تومان
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                هیچ تراکنشی ثبت نشده است
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status */}
        <Card className="lg:col-span-3 bg-custom-dark border-custom-dark">
          <CardHeader>
            <CardTitle className="text-custom-blue">وضعیت فاکتورها</CardTitle>
            <CardDescription>
              نمای کلی از وضعیت فاکتورهای موجود
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3).fill(null).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-card animate-pulse rounded"></div>
                    <div className="h-3 bg-card animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>فاکتورهای در انتظار پرداخت</span>
                    <span className="text-amber-400 font-medium">{pendingInvoices}</span>
                  </div>
                  <Progress 
                    value={totalInvoices ? (pendingInvoices / totalInvoices) * 100 : 0}
                    className="h-2 bg-custom-darker" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>فاکتورهای پرداخت شده</span>
                    <span className="text-custom-blue font-medium">0</span>
                  </div>
                  <Progress 
                    value={0} 
                    className="h-2 bg-custom-darker" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>فاکتورهای معوقه</span>
                    <span className="text-custom-pink font-medium">{overdueInvoices}</span>
                  </div>
                  <Progress 
                    value={totalInvoices ? (overdueInvoices / totalInvoices) * 100 : 0} 
                    className="h-2 bg-custom-darker" 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard 
          title="ثبت درآمد جدید" 
          icon={<ArrowUpCircle className="h-8 w-8" />} 
          href="/accounting?type=income"
        />
        <QuickActionCard 
          title="ثبت هزینه جدید" 
          icon={<ArrowDownCircle className="h-8 w-8" />}
          href="/accounting?type=expense" 
        />
        <QuickActionCard 
          title="صدور فاکتور" 
          icon={<FileText className="h-8 w-8" />}
          href="/accounting?tab=invoices" 
        />
        <QuickActionCard 
          title="مدیریت کارمندان" 
          icon={<Users className="h-8 w-8" />}
          href="/employees" 
        />
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, description, icon, loading = false }: StatsCardProps) {
  return (
    <Card className="bg-custom-dark border-none overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-custom-darker to-custom-dark opacity-50"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        <div className="p-2 rounded-full bg-custom-darker/50">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <div className="h-6 bg-card animate-pulse rounded w-20"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Quick Action Card Component
interface QuickActionCardProps {
  title: string;
  icon: React.ReactNode;
  href: string;
}

function QuickActionCard({ title, icon, href }: QuickActionCardProps) {
  return (
    <Card className="hover:bg-custom-dark/90 transition-colors cursor-pointer border-custom-dark bg-custom-dark">
      <CardContent className="flex flex-col items-center p-6">
        <div className="p-3 rounded-full bg-custom-darker mb-3 text-custom-blue">
          {icon}
        </div>
        <h3 className="font-medium text-custom-blue">{title}</h3>
        <a href={href} className="absolute inset-0">
          <span className="sr-only">{title}</span>
        </a>
      </CardContent>
    </Card>
  );
}