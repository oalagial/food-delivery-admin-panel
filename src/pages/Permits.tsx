export default function Permits() {
  const permits: unknown[] = []
  return (
    <div>
      <h1>Permits</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Description</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {permits.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>No permits found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
