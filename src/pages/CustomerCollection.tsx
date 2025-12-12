import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

export default function CustomerCollection() {
  const customers: unknown[] = []
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Collection</h1>
        <p className="text-gray-600 mt-1">View and manage customers</p>
      </div>
      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Email</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No customers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
