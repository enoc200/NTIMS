'use client'
import Modal from './Modal'
import { formatKES, formatDateTime } from '@/lib/utils'
import { HiOutlinePrinter, HiOutlineXCircle, HiOutlineCheckCircle } from 'react-icons/hi'
import type { Sale } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
}

export default function ReceiptModal({ isOpen, onClose, sale }: Props) {
  if (!sale) return null

  function handlePrint() {
    if (!sale) return;
    const printContent = document.getElementById('receipt-content');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${sale.receiptNumber}</title>
            <style>
              body { font-family: 'Outfit', sans-serif; padding: 20px; color: #1e293b; }
              .receipt-container { max-width: 300px; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 20px; }
              .store-name { font-size: 20px; font-weight: 800; text-transform: uppercase; }
              .divider { border-top: 1px dashed #cbd5e1; margin: 15px 0; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; }
              th { text-align: left; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
              td { padding: 8px 0; }
              .totals { margin-top: 15px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
              .grand { font-weight: 800; font-size: 16px; border-top: 2px solid #1e293b; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              ${printContent?.innerHTML}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth={560}>
      <div style={{ background: 'var(--gradient-success)', padding: '32px', textAlign: 'center', color: 'white' }}>
        <HiOutlineCheckCircle style={{ fontSize: '48px', marginBottom: '12px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Transaction Success</h2>
        <p style={{ opacity: 0.8, fontSize: '14px' }}>Receipt generated for <strong>{sale.receiptNumber}</strong></p>
      </div>

      <div className="modal-body" style={{ padding: '32px' }}>
        <div id="receipt-content" style={{ padding: '20px', background: 'var(--gray-50)', borderRadius: '16px', border: '1px solid var(--gray-200)', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dark)' }}>SME INVENTORY PRO</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>123 Business Avenue, Nairobi</div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>TEL: +254 700 000 000</div>
          </div>

          <div style={{ borderTop: '1px dashed var(--gray-300)', margin: '16px 0' }}></div>

          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RECEIPT:</span>
              <span style={{ fontWeight: 700 }}>{sale.receiptNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DATE:</span>
              <span>{formatDateTime(sale.createdAt)}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--gray-300)', margin: '16px 0' }}></div>

          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                <th style={{ paddingBottom: '8px' }}>ITEM</th>
                <th style={{ textAlign: 'center', paddingBottom: '8px' }}>QTY</th>
                <th style={{ textAlign: 'right', paddingBottom: '8px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 0' }}>{item.productName}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatKES(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px dashed var(--gray-300)', margin: '16px 0' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>SUBTOTAL:</span>
              <span>{formatKES(sale.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>TAX (8%):</span>
              <span>{formatKES(sale.tax)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--dark)' }}>
              <span>GRAND TOTAL:</span>
              <span>{formatKES(sale.total)}</span>
            </div>
          </div>

          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '12px', color: 'var(--gray-500)', fontStyle: 'italic' }}>
            *** Thank you for shopping with us! ***<br />
            Goods once sold are not returnable.
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: '24px 32px', gap: '16px' }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
          <HiOutlineXCircle /> Close
        </button>
        <button className="btn btn-primary" style={{ flex: 1.5 }} onClick={handlePrint}>
          <HiOutlinePrinter /> Print Receipt
        </button>
      </div>
    </Modal>
  )
}
