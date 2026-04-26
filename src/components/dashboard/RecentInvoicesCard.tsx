'use client'

import { Receipt, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TransactionDoc {
  id: string
  invoiceNo: string
  customerName: string
  totalAmount: number
  currency: string
  paymentStatus: string
  bookingType: string
  createdAt: string
}

interface RecentInvoicesCardProps {
  invoices: TransactionDoc[]
}

export default function RecentInvoicesCard({ invoices }: RecentInvoicesCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Receipt size={22} className="text-muted-foreground" />
          Recent Paid Invoices
        </CardTitle>
        <Badge variant="outline" className="text-success border-success/30 bg-success/5">
          Verified Payment
        </Badge>
      </CardHeader>

      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada invoice lunas
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs uppercase tracking-wider">Invoice</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Amount</TableHead>
                    <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <code className="text-sm text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                          {inv.invoiceNo}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{inv.customerName}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{inv.bookingType}</TableCell>
                      <TableCell className="font-semibold">
                        {inv.currency} {inv.totalAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1">
                          <CheckCircle size={12} /> Paid
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-3">
              {invoices.map((inv, idx) => (
                <div
                  key={idx}
                  className="bg-muted/30 dark:bg-muted/10 rounded-lg p-3 border border-border/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <code className="text-xs text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                      {inv.invoiceNo}
                    </code>
                    <Badge variant="outline" className="text-success border-success/30 bg-success/5 gap-1 text-xs">
                      <CheckCircle size={10} /> Paid
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{inv.customerName}</span>
                    <span className="font-semibold text-primary">
                      {inv.currency} {inv.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">{inv.bookingType}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
