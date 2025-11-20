export default function DeliveryLocations() {
  const zones: unknown[] = []
  return (
    <div>
      <h1>Delivery Locations</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Zone</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {zones.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>No delivery locations found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
