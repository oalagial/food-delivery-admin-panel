import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

export default function Orders() {
  // Placeholder table for orders; wire to API when available
  const orders: unknown[] = []
  return (
    <div>
      <h1>Orders</h1>
      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Customer</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Total</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
