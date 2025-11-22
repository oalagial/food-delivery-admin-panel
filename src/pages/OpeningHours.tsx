import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableBody, TableHead, TableRow, TableCell, TableHeadCell } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { getOpeningHoursList } from '../utils/api'

export default function OpeningHours() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getOpeningHoursList()
      .then(d => { if (mounted) setItems(d) })
      .catch(e => { if (mounted) setError(String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Opening Hours</h1>
        <Link to="/opening-hours/creation"><Button variant="primary">Create</Button></Link>
      </div>

      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>ID</TableHeadCell>
              <TableHeadCell>Day</TableHeadCell>
              <TableHeadCell>Open</TableHeadCell>
              <TableHeadCell>Close</TableHeadCell>
              <TableHeadCell>Actions</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(it => (
              <TableRow key={String(it.id)}>
                <TableCell>{it.id}</TableCell>
                <TableCell>{it.day}</TableCell>
                <TableCell>{it.open}</TableCell>
                <TableCell>{it.close}</TableCell>
                <TableCell>
                  <Link to={`/opening-hours/creation/${it.id}`}><Button size="sm" variant="ghost">Edit</Button></Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
