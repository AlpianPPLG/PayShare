import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/useI18n"
import { formatCurrency } from "@/lib/utils/format"

type CategoryData = {
  category: string
  expense_count: number
  total_amount: number
  avg_amount: number
  min_amount: number
  max_amount: number
  unique_payers: number
  total_transactions: number
  last_transaction_date: string
  largest_expense_desc: string
  first_transaction_date: string
  top_payers: string
}

interface CategoryAnalyticsProps {
  data: CategoryData[]
}

export function CategoryAnalytics({ data }: CategoryAnalyticsProps) {
  const { t, locale } = useI18n()

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'PP', { locale: locale === 'id' ? id : undefined })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return dateString
    }
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('analytics.noCategoryData')}</p>
      </div>
    )
  }

  // Calculate summary statistics
  const totalSpent = data.reduce((sum, cat) => sum + cat.total_amount, 0)
  const avgPerCategory = totalSpent / (data.length || 1)
  const highestCategory = data[0] || null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('analytics.totalCategories')}
            </CardTitle>
            <CardTitle className="text-2xl">{data.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('analytics.totalSpent')}
            </CardTitle>
            <CardTitle className="text-2xl">{formatCurrency(totalSpent)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('analytics.avgPerCategory')}
            </CardTitle>
            <CardTitle className="text-2xl">{formatCurrency(avgPerCategory)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('analytics.highestCategory')}
            </CardTitle>
            <CardTitle className="text-xl truncate">
              {highestCategory?.category.replace(/_/g, ' ').toLowerCase() || '-'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('analytics.categoryOverview')}</CardTitle>
          <CardDescription>
            {t('analytics.categoryOverviewSubtitle', { count: data.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t('analytics.category')}</TableHead>
                  <TableHead className="text-right">{t('analytics.totalSpent')}</TableHead>
                  <TableHead className="text-right">{t('analytics.transactions')}</TableHead>
                  <TableHead className="text-right">{t('analytics.avgTransaction')}</TableHead>
                  <TableHead className="text-right">{t('analytics.uniquePayers')}</TableHead>
                  <TableHead className="text-right">{t('analytics.lastTransaction')}</TableHead>
                  <TableHead className="text-right">{t('analytics.topPayers')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((category) => (
                  <TableRow key={category.category} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="capitalize font-medium">
                          {category.category.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t('analytics.firstTransaction')}: {formatDate(category.first_transaction_date)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <div className="flex flex-col">
                        <span>{formatCurrency(category.total_amount)}</span>
                        <span className="text-xs text-muted-foreground">
                          {((category.total_amount / totalSpent) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {category.expense_count}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(category.avg_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={category.unique_payers > 1 ? 'default' : 'outline'} className="text-xs">
                        {category.unique_payers} {t('analytics.people')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDate(category.last_transaction_date)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <div className="flex flex-col items-end">
                        {category.top_payers ? (
                          category.top_payers.split(',').map((payer, i) => (
                            <span key={i} className="text-xs text-muted-foreground">
                              {payer.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.topCategories')}</CardTitle>
            <CardDescription>
              {t('analytics.topCategoriesSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.slice(0, 5).map((category, index) => (
                <div key={category.category} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {index + 1}. {category.category.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(category.total_amount)}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{
                        width: `${(category.total_amount / data[0].total_amount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.categoryStats')}</CardTitle>
            <CardDescription>
              {t('analytics.categoryStatsSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('analytics.totalCategories')}
                </div>
                <div className="text-2xl font-bold">
                  {data.length}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('analytics.totalSpent')}
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.reduce((sum, cat) => sum + cat.total_amount, 0))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('analytics.avgPerCategory')}
                </div>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.reduce((sum, cat) => sum + cat.total_amount, 0) / data.length)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {t('analytics.highestCategory')}
                </div>
                <div className="text-xl font-bold truncate">
                  {data[0]?.category.replace(/_/g, ' ').toLowerCase()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(data[0]?.total_amount || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
