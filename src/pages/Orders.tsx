export default function Orders() {
  // Placeholder table for orders; wire to API when available
  const orders: unknown[] = []
  return (
    <div>
      <h1>Orders</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: 8 }}>ID</th>
              <th style={{ padding: 8 }}>Customer</th>
              <th style={{ padding: 8 }}>Status</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Created</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 12 }}>No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
