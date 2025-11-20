export default function CustomerCollection() {
  const customers: unknown[] = []
  return (
    <div>
      <h1>Customer Collection</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Email</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 12 }}>No customers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
