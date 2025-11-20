import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

export default function Permits() {
  const permits: unknown[] = []
  return (
    <div>
      <h1>Permits</h1>
      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Description</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {permits.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No permits found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
