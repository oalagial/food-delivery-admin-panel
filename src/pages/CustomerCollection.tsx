import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

export default function CustomerCollection() {
  const customers: unknown[] = []
  return (
    <div>
      <h1>Customer Collection</h1>
      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
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
