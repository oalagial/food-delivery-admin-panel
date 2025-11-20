import Table, { TableHead, TableBody, TableRow, TableHeadCell, TableCell } from '../components/ui/table'

export default function DeliveryLocations() {
  const zones: unknown[] = []
  return (
    <div>
      <h1>Delivery Locations</h1>
      <div>
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Zone</TableHeadCell>
              <TableHeadCell>Created</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {zones.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>No delivery locations found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
