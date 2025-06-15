import { getGameState } from '../../lib/gamemechanics/gameState';
import { useDisplayUpdate } from '../../lib/gamemechanics/displayManager';
import { formatNumber, MONTH_NAMES, calculateAbsoluteDays } from '../../lib/gamemechanics/utils';
import { ViewHeader } from '../ui/ViewHeader';
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge, Button } from '../ui/ShadCN';
import { uiEmojis, formatEuro } from '../ui/resources/emojiMap';
import { calculateFinancialTotals, Transaction, calculateCashFlow } from '../../lib/finance/financeService';
import { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Balance Sheet component showing assets, liabilities, and equity
 */
const BalanceSheet = () => {
  // Get all financial values from the finance service
  const financials = calculateFinancialTotals();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Total Company Value Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 md:p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold">Total Company Value</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Sum of all assets</p>
            </div>
            <div className="text-xl md:text-3xl font-bold text-blue-700">
              {formatEuro(formatNumber(financials.totalAssets, { decimals: 2 }))}
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-xl md:text-2xl font-semibold">Balance Sheet</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Assets Section */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0 space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Current Assets</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash</span>
                  <span>{formatEuro(formatNumber(financials.money, { decimals: 2 }))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inventory</span>
                  <span>{formatEuro(formatNumber(financials.inventoryValue, { decimals: 2 }))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Current Assets</span>
                  <span>{formatEuro(formatNumber(financials.totalCurrentAssets, { decimals: 2 }))}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Fixed Assets</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buildings & Fleet</span>
                  <span>{formatEuro(formatNumber(financials.buildingValue, { decimals: 2 }))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Fixed Assets</span>
                  <span>{formatEuro(formatNumber(financials.totalFixedAssets, { decimals: 2 }))}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between font-medium text-base md:text-lg border-t pt-2">
              <span>Total Assets</span>
              <span>{formatEuro(formatNumber(financials.totalAssets, { decimals: 2 }))}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Liabilities & Equity Section */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle>Liabilities & Equity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0 space-y-4">
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Liabilities</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground italic">
                  <span>No liabilities</span>
                  <span>{formatEuro(0)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Liabilities</span>
                  <span>{formatEuro(formatNumber(financials.totalLiabilities, { decimals: 2 }))}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-base md:text-lg font-medium mb-2">Equity</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Value</span>
                  <span>{formatEuro(formatNumber(financials.totalEquity, { decimals: 2 }))}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Equity</span>
                  <span>{formatEuro(formatNumber(financials.totalEquity, { decimals: 2 }))}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between font-medium text-base md:text-lg border-t pt-2">
              <span>Total Liabilities & Equity</span>
              <span>{formatEuro(formatNumber(financials.totalLiabilities + financials.totalEquity, { decimals: 2 }))}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for future Fleet/Building Details */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>Asset Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0">
          <div className="text-center text-muted-foreground py-6">
            Fleet and building management will be displayed here once implemented.
            <br />
            <span className="text-sm">Current focus: Core financial tracking</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Cash Flow component showing income and expenses
 */
const CashFlow = () => {
  const gameState = getGameState();
  const transactions = (gameState as any).transactions || [] as Transaction[];
  const [timeFilter, setTimeFilter] = useState<string>('current_month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 20;
  
  // Get unique categories from transactions
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach((transaction: Transaction) => {
      uniqueCategories.add(transaction.category);
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [transactions]);
  
  // Build filter criteria based on time filter
  const buildFilterCriteria = (timeFilter: string) => {
    const { month: currentMonth, year: currentYear } = gameState;
    
    switch (timeFilter) {
      case 'last_hour':
        return { hours: 1 };
      case 'last_6_hours':
        return { hours: 6 };
      case 'last_12_hours':
        return { hours: 12 };
      case 'last_day':
        return { days: 1 };
      case 'last_week':
        return { weeks: 1 };
      case 'last_4_weeks':
        return { weeks: 4 };
      case 'current_month':
        return { month: currentMonth, year: currentYear };
      case 'last_month':
        const lastMonth = currentMonth - 1;
        if (lastMonth >= 1) {
          return { month: lastMonth, year: currentYear };
        } else {
          return { month: 12, year: currentYear - 1 };
        }
      case 'current_year':
        return { year: currentYear };
      case 'all_time':
        return { year: 'all' };
      default:
        return { hours: 24 }; // Default to last 24 hours
    }
  };
  
  // Filter transactions based on selected filters
  const filteredTransactions = useMemo(() => {
    const filterCriteria = buildFilterCriteria(timeFilter);
    return transactions.filter((transaction: Transaction) => {
      if (!transaction.gameDay || !transaction.gameWeek || !transaction.gameMonth || !transaction.gameYear) return false;

      // Apply year filter
      if (filterCriteria.year && filterCriteria.year !== 'all' && transaction.gameYear !== filterCriteria.year) {
        return false;
      }

      // Apply month filter
      if (filterCriteria.month && typeof filterCriteria.month === 'number' && transaction.gameMonth !== filterCriteria.month) {
        return false;
      }

      // Apply day filter (for relative periods like 'last_day')
      if ((filterCriteria as any).days && (filterCriteria as any).days > 0) {
        const currentAbsoluteDays = calculateAbsoluteDays(gameState.year, gameState.month, gameState.week, gameState.day);
        const transactionAbsoluteDays = calculateAbsoluteDays(transaction.gameYear, transaction.gameMonth, transaction.gameWeek, transaction.gameDay);
        
        if (currentAbsoluteDays - transactionAbsoluteDays > (filterCriteria as any).days) return false;
      }

      // Apply week filter (for relative periods like 'last_week', 'last_4_weeks')
      if ((filterCriteria as any).weeks && (filterCriteria as any).weeks > 0) {
        const currentAbsoluteDays = calculateAbsoluteDays(gameState.year, gameState.month, gameState.week, gameState.day);
        const transactionAbsoluteDays = calculateAbsoluteDays(transaction.gameYear, transaction.gameMonth, transaction.gameWeek, transaction.gameDay);
        
        if (currentAbsoluteDays - transactionAbsoluteDays > (filterCriteria as any).weeks * 7) return false;
      }

      // Apply category filter
      if (categoryFilter !== 'all' && transaction.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, timeFilter, categoryFilter, gameState]);
  
  // Calculate cash flow data
  const cashFlowData = useMemo(() => {
    const filterCriteria = buildFilterCriteria(timeFilter);
    return calculateCashFlow(filterCriteria as any);
  }, [timeFilter, gameState]);
  
  // Helper function to calculate absolute hours since game start
  const calculateAbsoluteHours = (year: number, month: number, week: number, day: number, hour: number): number => {
    const absoluteDays = calculateAbsoluteDays(year, month, week, day);
    return absoluteDays * 24 + hour;
  };

  // Group transactions by date for display
  const groupedTransactions = useMemo(() => {
    const grouped: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach((transaction: Transaction) => {
      const dateKey = `${transaction.gameHour || 0}-${transaction.gameDay}-${transaction.gameWeek}-${transaction.gameMonth}-${transaction.gameYear}`;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });
    
    // Sort by date (newest first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      const [hourA, dayA, weekA, monthA, yearA] = a.split('-');
      const [hourB, dayB, weekB, monthB, yearB] = b.split('-');
      
      const absoluteHoursA = calculateAbsoluteHours(parseInt(yearA), parseInt(monthA), parseInt(weekA), parseInt(dayA), parseInt(hourA));
      const absoluteHoursB = calculateAbsoluteHours(parseInt(yearB), parseInt(monthB), parseInt(weekB), parseInt(dayB), parseInt(hourB));
      
      return absoluteHoursB - absoluteHoursA; // Newest first
    });
    
    return sortedKeys.map(key => ({
      dateKey: key,
      transactions: grouped[key].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }));
  }, [filteredTransactions]);
  
  // Pagination
  const totalPages = Math.ceil(groupedTransactions.length / transactionsPerPage);
  const currentDates = groupedTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  // Parse date key for display
  const parseDateKey = (key: string) => {
    const [hour, day, week, month, year] = key.split('-');
    return {
      hour: parseInt(hour),
      day: parseInt(day),
      week: parseInt(week),
      month: parseInt(month),
      year: parseInt(year)
    };
  };
  
  // Format date for display
  const formatDisplayDate = (dateKey: string) => {
    const { hour, day, week, month, year } = parseDateKey(dateKey);
    const monthName = MONTH_NAMES[month - 1] || 'Unknown';
    return `${hour.toString().padStart(2, '0')}:00 - Day ${day}, Week ${week}, ${monthName} ${year}`;
  };
  
  // Calculate category summaries
  const incomeCategories = Object.entries(cashFlowData.income).sort(([,a], [,b]) => b - a);
  const expenseCategories = Object.entries(cashFlowData.expenses).sort(([,a], [,b]) => b - a);
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(c => c !== 'all').map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_hour">Last Hour</SelectItem>
              <SelectItem value="last_6_hours">Last 6 Hours</SelectItem>
              <SelectItem value="last_12_hours">Last 12 Hours</SelectItem>
              <SelectItem value="last_day">Last Day</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_4_weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-10 text-center">
              <p className="text-muted-foreground">
                No transactions found for the selected filters.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Start your airline operations to see financial data here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Cash Flow Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card className={cashFlowData.netCashFlow >= 0 ? "bg-green-50" : "bg-red-50"}>
              <CardHeader className="p-3 pb-1 md:pb-2 md:p-4">
                <CardTitle className="text-sm md:text-base font-medium">Net Cash Flow</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 md:p-4 md:pt-0">
                <div className={`text-lg md:text-2xl font-bold ${cashFlowData.netCashFlow >= 0 ? "text-green-600" : "text-red-600"} flex items-center gap-2`}>
                  {cashFlowData.netCashFlow >= 0 ? <ArrowUp className="h-4 w-4 md:h-5 md:w-5" /> : <ArrowDown className="h-4 w-4 md:h-5 md:w-5" />}
                  {formatEuro(formatNumber(Math.abs(cashFlowData.netCashFlow), { decimals: 2 }))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardHeader className="p-3 pb-1 md:pb-2 md:p-4">
                <CardTitle className="text-sm md:text-base font-medium">Total Income</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 md:p-4 md:pt-0">
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  {formatEuro(formatNumber(Object.values(cashFlowData.income).reduce((sum, val) => sum + val, 0), { decimals: 2 }))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50">
              <CardHeader className="p-3 pb-1 md:pb-2 md:p-4">
                <CardTitle className="text-sm md:text-base font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 md:p-4 md:pt-0">
                <div className="text-lg md:text-2xl font-bold text-red-600">
                  {formatEuro(formatNumber(Object.values(cashFlowData.expenses).reduce((sum, val) => sum + val, 0), { decimals: 2 }))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Income Categories */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle>Income by Category</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0">
                {incomeCategories.length > 0 ? (
                  <div className="space-y-3">
                    {incomeCategories.map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`bg-green-50 text-green-700 border-green-200 cursor-pointer ${categoryFilter === category ? 'ring-2 ring-green-500' : ''}`}
                            onClick={() => setCategoryFilter(category === categoryFilter ? 'all' : category)}
                          >
                            {category}
                          </Badge>
                        </div>
                        <div className="text-green-600 font-medium">
                          {formatEuro(formatNumber(amount, { decimals: 2 }))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No income recorded in this period
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Expense Categories */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0">
                {expenseCategories.length > 0 ? (
                  <div className="space-y-3">
                    {expenseCategories.map(([category, amount]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`bg-red-50 text-red-700 border-red-200 cursor-pointer ${categoryFilter === category ? 'ring-2 ring-red-500' : ''}`}
                            onClick={() => setCategoryFilter(category === categoryFilter ? 'all' : category)}
                          >
                            {category}
                          </Badge>
                        </div>
                        <div className="text-red-600 font-medium">
                          {formatEuro(formatNumber(amount, { decimals: 2 }))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No expenses recorded in this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Transaction History */}
          <Card>
            <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <CardTitle>Transaction History</CardTitle>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 md:p-6 md:pt-0">
              {currentDates.length > 0 ? (
                <div className="space-y-4 md:space-y-6">
                  {currentDates.map(({ dateKey, transactions }) => (
                    <div key={dateKey} className="space-y-2">
                      <h3 className="text-sm font-medium border-b pb-1">
                        {formatDisplayDate(dateKey)}
                      </h3>
                      <div className="space-y-2">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center text-sm p-2 rounded border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${transaction.amount >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                >
                                  {transaction.category}
                                </Badge>
                              </div>
                              <div className="text-muted-foreground truncate mt-1">
                                {transaction.description}
                              </div>
                            </div>
                            <div className={`font-medium text-right ml-4 ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.amount >= 0 ? '+' : ''}{formatEuro(formatNumber(transaction.amount, { decimals: 2 }))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No transactions found for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export function FinanceView() {
  useDisplayUpdate();
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <ViewHeader 
        title="Financial Management" 
        icon={uiEmojis.finance}
      />
      
      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="balance-sheet" className="space-y-4 md:space-y-6 mt-6">
          <BalanceSheet />
        </TabsContent>
        
        <TabsContent value="cash-flow" className="space-y-4 md:space-y-6 mt-6">
          <CashFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
} 