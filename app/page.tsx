"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Slider } from "@/components/ui/slider"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Home, Plus, Trash2, Edit, Moon, Sun, DollarSign, Target, TrendingUp, History, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CheckCircle, ChevronDown, ChevronUp, Sparkles, Calendar, TrendingUpIcon } from "lucide-react"
import {
  getBudget,
  setBudget as apiSetBudget,
  getSpendingHistory,
  addSpending,
  editSpending as apiEditSpending,
  deleteSpending as apiDeleteSpending,
  getWishlist,
  addWishlistItem as apiAddWishlistItem,
  editWishlistItem,
  deleteWishlistItem as apiDeleteWishlistItem,
  fundWishlist,
} from "@/lib/api"

interface WishlistItem {
  id: string
  name: string
  targetPrice: number
  currentAmount: number
  allocationPercentage: number
}

interface SpendingEntry {
  id: string
  date: string
  amount: number
  description?: string
}

interface BudgetData {
  monthlyBudget: number
  dailyAllowance: number
  todaySpent: number
  remainingToday: number
}

interface FundingLog {
  id: string
  date: string
  totalAllocated: number
  allocations: {
    itemId: string
    itemName: string
    amount: number
  }[]
}

interface DailyFunding {
  date: string
  totalLeftover: number
  allocations: {
    itemId: string
    amount: number
  }[]
}

export default function BudgetApp() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("dashboard")

  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState(3000)
  const [todaySpent, setTodaySpent] = useState(0)
  const [spendingAmount, setSpendingAmount] = useState("")
  const [newBudget, setNewBudget] = useState("")

  // Wishlist state
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([
    { id: "1", name: "New Laptop", targetPrice: 1200, currentAmount: 480, allocationPercentage: 40 },
    { id: "2", name: "Vacation Fund", targetPrice: 2000, currentAmount: 600, allocationPercentage: 35 },
    { id: "3", name: "Emergency Fund", targetPrice: 5000, currentAmount: 1250, allocationPercentage: 25 },
  ])

  const [newWishlistItem, setNewWishlistItem] = useState({ name: "", targetPrice: "" })
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null)

  // History state
  const [spendingHistory, setSpendingHistory] = useState<SpendingEntry[]>([
    { id: "1", date: "2024-01-22", amount: 25.5, description: "Lunch" },
    { id: "2", date: "2024-01-22", amount: 20.0, description: "Coffee" },
    { id: "3", date: "2024-01-21", amount: 85.0, description: "Groceries" },
    { id: "4", date: "2024-01-21", amount: 12.5, description: "Transport" },
    { id: "5", date: "2024-01-20", amount: 150.0, description: "Utilities" },
  ])

  // Chart data
  const [chartData, setChartData] = useState([
    { date: "Jan 18", spent: 0, allowance: 100 },
    { date: "Jan 19", spent: 0, allowance: 100 },
    { date: "Jan 20", spent: 0, allowance: 100 },
    { date: "Jan 21", spent: 0, allowance: 100 },
    { date: "Jan 22", spent: 0, allowance: 100 },
  ])

  // Funding state
  const [lastFundingDate, setLastFundingDate] = useState("2024-01-22")
  const [todaysFunding, setTodaysFunding] = useState<DailyFunding>({
    date: "2024-01-22",
    totalLeftover: 54.5,
    allocations: [
      { itemId: "1", amount: 21.8 },
      { itemId: "2", amount: 19.075 },
      { itemId: "3", amount: 13.625 },
    ],
  })

  const [fundingLogs, setFundingLogs] = useState<FundingLog[]>([
    {
      id: "1",
      date: "2024-01-22",
      totalAllocated: 54.5,
      allocations: [
        { itemId: "1", itemName: "New Laptop", amount: 21.8 },
        { itemId: "2", itemName: "Vacation Fund", amount: 19.075 },
        { itemId: "3", itemName: "Emergency Fund", amount: 13.625 },
      ],
    },
    {
      id: "2",
      date: "2024-01-21",
      totalAllocated: 2.5,
      allocations: [
        { itemId: "1", itemName: "New Laptop", amount: 1.0 },
        { itemId: "2", itemName: "Vacation Fund", amount: 0.875 },
        { itemId: "3", itemName: "Emergency Fund", amount: 0.625 },
      ],
    },
  ])

  const [showFundingLogs, setShowFundingLogs] = useState(false)
  const [isManualFunding, setIsManualFunding] = useState(false)
  const [celebratingItems, setCelebratingItems] = useState<string[]>([])

  // Calculate budget data
  const dailyAllowance = monthlyBudget / 30
  const remainingToday = Math.max(0, dailyAllowance - todaySpent)
  const totalWishlistAllocation = Array.isArray(wishlistItems) ? wishlistItems.reduce((sum, item) => sum + item.allocationPercentage, 0) : 0;

  // Handle spending submission
  const handleSpendingSubmit = async () => {
    const amount = Number.parseFloat(spendingAmount);
    if (amount > 0) {
      try {
        await addSpending(amount, new Date().toISOString().split("T")[0]);
        const historyRes = await getSpendingHistory();
        setSpendingHistory(Array.isArray(historyRes.data?.history) ? historyRes.data.history : []);
        setSpendingAmount("");
        toast({ title: "Spending added", description: "Your spending was saved." });
      } catch (error: any) {
        toast({ title: "Error", description: error?.response?.data?.message || "Failed to add spending.", variant: "destructive" });
      }
    }
  };

  // Handle budget update
  const handleBudgetUpdate = () => {
    const budget = Number.parseFloat(newBudget)
    if (budget > 0) {
      setMonthlyBudget(budget)
      setNewBudget("")
    }
  }

  // Handle wishlist item addition
  const handleAddWishlistItem = () => {
    const price = Number.parseFloat(newWishlistItem.targetPrice)
    if (newWishlistItem.name && price > 0) {
      const newItem: WishlistItem = {
        id: Date.now().toString(),
        name: newWishlistItem.name,
        targetPrice: price,
        currentAmount: 0,
        allocationPercentage: 0,
      }
      setWishlistItems((prev) => [...prev, newItem])
      setNewWishlistItem({ name: "", targetPrice: "" })
    }
  }

  // Handle wishlist item deletion
  const handleDeleteWishlistItem = (id: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Handle allocation update
  const handleAllocationUpdate = (id: string, percentage: number) => {
    setWishlistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, allocationPercentage: percentage } : item)),
    )
  }

  // Handle spending entry deletion
  const handleDeleteSpendingEntry = async (id: string) => {
    try {
      await apiDeleteSpending(id);
      const historyRes = await getSpendingHistory();
      setSpendingHistory(Array.isArray(historyRes.data?.history) ? historyRes.data.history : []);
      toast({ title: 'Spending deleted', description: 'The entry was removed from the backend.' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error?.response?.data?.message || 'Could not delete spending entry.', variant: 'destructive' });
    }
  };

  // Handle manual wishlist funding
  const handleManualFunding = async () => {
    setIsManualFunding(true);

    try {
      // Call backend to trigger funding
      const response = await fundWishlist();

      // Optionally, show allocations in a toast
      toast({
        title: "Wishlist Funded! 🎉",
        description: `Successfully allocated RF${response.data.leftover.toFixed(2)} to your wishlist items.`,
      });

      // Refresh wishlist from backend
      const wishlistRes = await getWishlist();
      setWishlistItems(Array.isArray(wishlistRes.data?.wishlist)
        ? wishlistRes.data.wishlist.map((item: any) => ({
            ...item,
            currentAmount: typeof item.currentAmount === 'number' ? item.currentAmount : (typeof item.funded === 'number' ? item.funded : 0),
            allocationPercentage: typeof item.allocationPercentage === 'number' ? item.allocationPercentage : (typeof item.allocationRatio === 'number' ? item.allocationRatio : 0),
          }))
        : []);
    } catch (error: any) {
      toast({
        title: "Funding Failed",
        description: error?.response?.data?.message || "There was an error allocating funds to your wishlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManualFunding(false);
    }
  };

  // Get today's funding for a specific item
  const getTodaysFundingForItem = (itemId: string) => {
    const allocation = todaysFunding.allocations.find((a) => a.itemId === itemId)
    return allocation?.amount || 0
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const budgetRes = await getBudget();
        const amount = budgetRes.data?.budget?.amount ?? 0;
        setMonthlyBudget(amount);
        setSpendingAmount("");

        const wishlistRes = await getWishlist();
        setWishlistItems(Array.isArray(wishlistRes.data?.wishlist)
          ? wishlistRes.data.wishlist.map((item: any) => ({
              ...item,
              currentAmount: typeof item.currentAmount === 'number' ? item.currentAmount : (typeof item.funded === 'number' ? item.funded : 0),
              allocationPercentage: typeof item.allocationPercentage === 'number' ? item.allocationPercentage : (typeof item.allocationRatio === 'number' ? item.allocationRatio : 0),
            }))
          : []);

        // Fetch spending history from backend
        const historyRes = await getSpendingHistory();
        const history = Array.isArray(historyRes.data?.history) ? historyRes.data.history : [];
        setSpendingHistory(history);

        // Calculate todaySpent from backend data
        const today = new Date().toISOString().split("T")[0];
        const todaySpentSum = history.filter((e: any) => e.date === today).reduce((sum: number, e: any) => sum + e.amount, 0);
        setTodaySpent(todaySpentSum);

        // Optionally update chartData with backend data
        // (This example just updates the last entry for today)
        setChartData(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              spent: todaySpentSum,
              allowance: monthlyBudget / 30,
            };
          }
          return updated;
        });

      } catch (error) {
        toast({
          title: "Failed to load data",
          description: "Could not fetch budget, wishlist, or spending history. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [monthlyBudget]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Budget Tracker
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="spending" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Spending</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RF{typeof monthlyBudget === 'number' ? monthlyBudget.toFixed(2) : '0.00'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily Allowance</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RF{typeof dailyAllowance === 'number' ? dailyAllowance.toFixed(2) : '0.00'}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Spent Today</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RF{todaySpent.toFixed(2)}</div>
                  {todaySpent > dailyAllowance && (
                    <Badge variant="destructive" className="mt-1">
                      Over Budget
                    </Badge>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Remaining Today</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">RF{remainingToday.toFixed(2)}</div>
                  {remainingToday === 0 && (
                    <Badge variant="secondary" className="mt-1">
                      Budget Used
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Wishlist Funding Progress */}
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Daily Wishlist Funding
                    </CardTitle>
                    <CardDescription>
                      Automatic allocation of leftover daily funds • Last funded: {lastFundingDate}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleManualFunding}
                    disabled={isManualFunding || remainingToday <= 0}
                    className="flex items-center gap-2"
                  >
                    {isManualFunding ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Funding...
                      </>
                    ) : (
                      <>
                        <TrendingUpIcon className="h-4 w-4" />
                        Trigger Funding
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Available for allocation today:</span>
                  <span className="text-lg font-bold text-green-600">RF{remainingToday.toFixed(2)}</span>
                </div>

                <div className="grid gap-3">
                  {wishlistItems.map((item) => {
                    const todaysFundingAmount = getTodaysFundingForItem(item.id)
                    const isCompleted = item.currentAmount >= item.targetPrice
                    const isCelebrating = celebratingItems.includes(item.id)

                    return (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg transition-all duration-300 RF{
                          isCelebrating ? "border-green-500 bg-green-50 dark:bg-green-900/20 animate-pulse" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {isCelebrating && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Sparkles className="h-4 w-4 animate-bounce" />
                                <span className="text-xs font-medium">COMPLETED!</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              RF{typeof item.currentAmount === 'number' ? item.currentAmount.toFixed(2) : '0.00'} / RF{typeof item.targetPrice === 'number' ? item.targetPrice.toFixed(2) : '0.00'}
                            </div>
                            {todaysFundingAmount > 0 && (
                              <div className="text-xs text-green-600 font-medium">
                                +RF{todaysFundingAmount.toFixed(2)} today
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Progress
                            value={(item.currentAmount / item.targetPrice) * 100}
                            className={`h-2 RF{isCelebrating ? "animate-pulse" : ""}`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{((item.currentAmount / item.targetPrice) * 100).toFixed(1)}% funded</span>
                            <span>{item.allocationPercentage}% allocation</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Funding Logs Toggle */}
                <Collapsible open={showFundingLogs} onOpenChange={setShowFundingLogs}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex items-center justify-between p-2">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        View Funding History
                      </span>
                      {showFundingLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-3">
                    {fundingLogs.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{log.date}</span>
                          <span className="text-sm font-semibold text-green-600">
                            RF{log.totalAllocated.toFixed(2)} allocated
                          </span>
                        </div>
                        <div className="space-y-1">
                          {log.allocations.map((allocation) => (
                            <div key={allocation.itemId} className="flex justify-between text-sm text-muted-foreground">
                              <span>{allocation.itemName}</span>
                              <span>+RF{allocation.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>

            {/* Wishlist Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Wishlist Progress</CardTitle>
                <CardDescription>Track your savings goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        RF{typeof item.currentAmount === 'number' ? item.currentAmount.toFixed(2) : '0.00'} / RF{typeof item.targetPrice === 'number' ? item.targetPrice.toFixed(2) : '0.00'}
                      </span>
                    </div>
                    <Progress value={(item.currentAmount / item.targetPrice) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{((item.currentAmount / item.targetPrice) * 100).toFixed(1)}% complete</span>
                      <span>{item.allocationPercentage}% allocation</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Spending Input */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Spending Entry</CardTitle>
                <CardDescription>Log today's expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Amount spent"
                    value={spendingAmount}
                    onChange={(e) => setSpendingAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleSpendingSubmit} disabled={!spendingAmount}>
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spending Tab */}
          <TabsContent value="spending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending Input</CardTitle>
                <CardDescription>Record your expenses for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spending-amount">Amount Spent</Label>
                  <Input
                    id="spending-amount"
                    type="number"
                    placeholder="0.00"
                    value={spendingAmount}
                    onChange={(e) => setSpendingAmount(e.target.value)}
                  />
                </div>
                <Button onClick={handleSpendingSubmit} className="w-full" disabled={!spendingAmount}>
                  Submit Spending
                </Button>

                {todaySpent > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Today's Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Daily Allowance:</span>
                        <span>RF{dailyAllowance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Amount Spent:</span>
                        <span>RF{todaySpent.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Remaining:</span>
                        <span className={remainingToday < 0 ? "text-destructive" : "text-green-600"}>
                          RF{remainingToday.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-6">
            {/* Add New Wishlist Item */}
            <Card>
              <CardHeader>
                <CardTitle>Add Wishlist Item</CardTitle>
                <CardDescription>Set a new savings goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      placeholder="e.g., New Phone"
                      value={newWishlistItem.name}
                      onChange={(e) => setNewWishlistItem((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-price">Target Price</Label>
                    <Input
                      id="target-price"
                      type="number"
                      placeholder="0.00"
                      value={newWishlistItem.targetPrice}
                      onChange={(e) => setNewWishlistItem((prev) => ({ ...prev, targetPrice: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddWishlistItem} className="w-full">
                  Add to Wishlist
                </Button>
              </CardContent>
            </Card>

            {/* Allocation Management */}
            <Card>
              <CardHeader>
                <CardTitle>Allocation Management</CardTitle>
                <CardDescription>
                  Set how much of your savings goes to each goal (Total: {totalWishlistAllocation}%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          RF{typeof item.currentAmount === 'number' ? item.currentAmount.toFixed(2) : '0.00'} / RF{typeof item.targetPrice === 'number' ? item.targetPrice.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Wishlist Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteWishlistItem(item.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Allocation: {item.allocationPercentage}%</Label>
                      </div>
                      <Slider
                        value={[item.allocationPercentage]}
                        onValueChange={(value) => handleAllocationUpdate(item.id, value[0])}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <Progress value={(item.currentAmount / item.targetPrice) * 100} className="h-2" />
                  </div>
                ))}

                {totalWishlistAllocation !== 100 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Total allocation should equal 100%. Currently: {totalWishlistAllocation}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            {/* Budget Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Settings</CardTitle>
                <CardDescription>Adjust your monthly budget</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly-budget">Monthly Budget</Label>
                  <div className="flex gap-2">
                    <Input
                      id="monthly-budget"
                      type="number"
                      placeholder={monthlyBudget.toString()}
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleBudgetUpdate} disabled={!newBudget}>
                      Update
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Budget</p>
                    <p className="text-lg font-semibold">RF{monthlyBudget.toFixed(2)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Daily Allowance</p>
                    <p className="text-lg font-semibold">RF{dailyAllowance.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Trends</CardTitle>
                <CardDescription>Daily spending vs. allowance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="allowance"
                        stroke="#10b981"
                        strokeDasharray="5 5"
                        name="Daily Allowance"
                      />
                      <Line type="monotone" dataKey="spent" stroke="#3b82f6" name="Amount Spent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending History</CardTitle>
                <CardDescription>View and manage your past expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {spendingHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">RF{entry.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.date} {entry.description && `• RF{entry.description}`}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Spending Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this RF{entry.amount.toFixed(2)} expense from {entry.date}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSpendingEntry(entry.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Wishlist Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wishlist Item</DialogTitle>
            <DialogDescription>Update the details of your wishlist item</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Target Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingItem.targetPrice}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, targetPrice: Number.parseFloat(e.target.value) || 0 } : null,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-current">Current Amount</Label>
                <Input
                  id="edit-current"
                  type="number"
                  value={editingItem.currentAmount}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, currentAmount: Number.parseFloat(e.target.value) || 0 } : null,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editingItem) {
                  try {
                    await editWishlistItem(editingItem.id, {
                      name: editingItem.name,
                      targetPrice: editingItem.targetPrice,
                      allocationRatio: editingItem.allocationPercentage,
                      funded: editingItem.currentAmount,
                    });
                    setWishlistItems((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
                    setEditingItem(null);
                    toast({ title: 'Wishlist item updated', description: 'Changes saved to backend.' });
                  } catch (error) {
                    toast({ title: 'Update failed', description: 'Could not save changes to backend.', variant: 'destructive' });
                  }
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  )
}
