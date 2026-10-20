/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompanyProfile } from '../../../utils/companyProfile';

export interface SalesOrderItemPrint {
  productName: string;
  pieceCount?: number;
  length?: number;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountAmount?: number;
  subtotal: number;
  description?: string;
}

export interface SalesOrderPrintInfo {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone?: string;
  status: string;
  notes?: string;
  quotationNumber?: string;
  source?: string;
  total: number;
  globalDiscountAmount?: number;
  globalDiscountType?: 'percentage' | 'nominal';
  globalDiscountValue?: number;
  items: SalesOrderItemPrint[];
}

const PRINTER_WIDTH_80MM = 48;
const BLUETOOTH_CHUNK_SIZE = 100;
const BLUETOOTH_CHUNK_DELAY_MS = 50;

const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatIDR = (num: number): string => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

export const buildSalesOrderThermalHTML = (
  info: SalesOrderPrintInfo,
  companyProfile: CompanyProfile,
  isPdf: boolean = false
): string => {
  const containerStyle = isPdf
    ? `font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 600; line-height: 1.25; padding: 2mm; color: #000; box-sizing: border-box; width: 69mm; margin: 0 auto;`
    : ``;

  const imgCrossorigin = isPdf ? `crossorigin="anonymous"` : ``;

  const subtotalBeforeGlobalDiscount = (Number(info.total) || 0) + (Number(info.globalDiscountAmount) || 0);
  const globalDiscountAmount = Number(info.globalDiscountAmount) || 0;
  const grandTotal = Number(info.total) || 0;

  const now = new Date();
  const printTimestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return `
    <div ${isPdf ? `style="${containerStyle}"` : ''}>
      <!-- Header -->
      <div class="text-center mb-1" ${isPdf ? 'style="text-align: center; margin-bottom: 4px;"' : ''}>
        ${
          companyProfile?.logoUrl
            ? `<img id="receipt-logo" src="${escapeHtml(companyProfile.logoUrl)}" style="max-width: 55px; max-height: 55px; filter: grayscale(100%); object-fit: contain; margin-bottom: 4px;" alt="Logo" ${imgCrossorigin} />`
            : ''
        }
      </div>
      <div class="text-center font-bold" ${isPdf ? 'style="text-align: center; font-size: 13px; font-weight: 900; margin-bottom: 2px;"' : 'style="font-size: 13px;"'}>
        ${escapeHtml(companyProfile?.name ? companyProfile.name.toUpperCase() : 'CV. BETON AGUNG')}
      </div>
      <div class="text-center border-b mb-2" ${isPdf ? 'style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 8px; font-size: 10px;"' : 'style="font-size: 10px;"'}>
        ${escapeHtml(companyProfile?.address || '').replace(/\\n/g, '<br>')}
        ${companyProfile?.phone ? `<br>Telp: ${escapeHtml(companyProfile.phone)}` : ''}
      </div>

      <!-- Title -->
      <div class="text-center font-bold mb-2" ${isPdf ? 'style="text-align: center; font-size: 12px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px;"' : 'style="font-size: 12px; letter-spacing: 1px;"'}>
        === SALES ORDER ===
      </div>

      <!-- Document Metadata -->
      <div class="mb-2" ${isPdf ? 'style="margin-bottom: 8px; font-size: 10px;"' : 'style="font-size: 10px;"'}>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}>
          <span>No. SO:</span> <strong class="font-bold">${escapeHtml(info.orderNumber)}</strong>
        </div>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}>
          <span>Tgl Order:</span> <span>${escapeHtml(info.orderDate)}</span>
        </div>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}>
          <span>Customer:</span> <strong>${escapeHtml(info.customerName)}</strong>
        </div>
        ${
          info.quotationNumber
            ? `<div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}>
                <span>Ref. Penawaran:</span> <span>${escapeHtml(info.quotationNumber)}</span>
              </div>`
            : ''
        }
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}>
          <span>Status:</span> <span>${escapeHtml(info.status)}</span>
        </div>
      </div>

      <div class="border-b" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px;"' : ''}></div>

      <!-- Items Table -->
      <table class="mb-2" ${isPdf ? 'style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px;"' : 'style="font-size: 10px;"'}>
        ${info.items
          .map(
            (item) => `
          <tr>
            <td colspan="3" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; font-weight: bold;"' : 'class="font-bold"'}>
              ${escapeHtml(item.productName)}
              ${
                item.pieceCount && item.length
                  ? `<div style="font-size: 9px; font-weight: normal; color: #333;">[${item.pieceCount} Fisik @ ${item.length} ${escapeHtml(item.unit || 'M')}]</div>`
                  : ''
              }
              ${
                item.description
                  ? `<div style="font-size: 9px; font-weight: normal; font-style: italic; color: #555;">${escapeHtml(item.description)}</div>`
                  : ''
              }
              ${
                item.discountAmount && item.discountAmount > 0
                  ? `<div style="font-size: 9px; color: #555;">Diskon Item: -Rp ${formatIDR(item.discountAmount)}</div>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td ${isPdf ? 'style="padding: 1px 0; vertical-align: top;"' : ''}>${item.quantity} ${escapeHtml(item.unit || 'Unit')}</td>
            <td ${isPdf ? 'style="padding: 1px 0; vertical-align: top;"' : ''}>@ ${formatIDR(item.unitPrice)}</td>
            <td class="text-right" ${isPdf ? 'style="padding: 1px 0; vertical-align: top; text-align: right;"' : ''}>${formatIDR(item.subtotal)}</td>
          </tr>
        `
          )
          .join('')}
      </table>

      <div class="border-b" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px;"' : ''}></div>

      <!-- Summary / Totals -->
      <table class="mb-2 font-bold" ${isPdf ? 'style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 11px; font-weight: 900;"' : 'style="font-size: 11px;"'}>
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>SUBTOTAL</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>Rp ${formatIDR(subtotalBeforeGlobalDiscount)}</td>
        </tr>
        ${
          globalDiscountAmount > 0
            ? `
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>DISKON TRANSAKSI</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>-Rp ${formatIDR(globalDiscountAmount)}</td>
        </tr>
        `
            : ''
        }
        <tr style="border-top: 1px dashed #000;">
          <td ${isPdf ? 'style="padding: 3px 0; vertical-align: top; font-size: 12px;"' : 'style="font-size: 12px;"'}>TOTAL SO</td>
          <td class="text-right" ${isPdf ? 'style="padding: 3px 0; vertical-align: top; text-align: right; font-size: 12px;"' : 'style="font-size: 12px;"'}>Rp ${formatIDR(grandTotal)}</td>
        </tr>
      </table>

      ${
        info.notes
          ? `
      <div class="border-b mb-2" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px;"' : ''}></div>
      <div class="mb-2" ${isPdf ? 'style="margin-bottom: 8px; font-size: 9px;"' : 'style="font-size: 9px;"'}>
        <strong>Catatan:</strong>
        <div style="white-space: pre-wrap; font-style: italic;">${escapeHtml(info.notes)}</div>
      </div>
      `
          : ''
      }

      <!-- Footer Info (No signature as requested) -->
      <div class="border-b mb-2" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px;"' : ''}></div>
      <div class="text-center" ${isPdf ? 'style="text-align: center; font-size: 9px; color: #444;"' : 'style="font-size: 9px; color: #444;"'}>
        <p>Dokumen ini adalah bukti pemesanan barang (Sales Order).</p>
        <p style="margin-top: 2px;">Waktu Cetak: ${printTimestamp}</p>
      </div>
    </div>
  `;
};

/**
 * Cetak struk thermal 80mm via browser dialog (Window Print)
 */
export const printSalesOrderThermal = (
  info: SalesOrderPrintInfo,
  companyProfile: CompanyProfile,
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  const printWindow = window.open('', '_blank', 'width=420,height=650');
  if (!printWindow) {
    onTriggerNotification('Gagal membuka jendela cetak. Pastikan pop-up diizinkan di browser.');
    return;
  }

  const bodyHtml = buildSalesOrderThermalHTML(info, companyProfile, false);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sales Order Thermal - ${escapeHtml(info.orderNumber)}</title>
      <style>
        @page { margin: 0; size: auto; }
        body { 
          font-family: 'Consolas', 'Courier New', Courier, monospace; 
          width: 69mm; 
          margin: 0; 
          padding: 0 2mm; 
          box-sizing: border-box;
          font-size: 11px; 
          font-weight: 600;
          line-height: 1.25;
          color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 900; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px; }
        .flex { display: flex; justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; vertical-align: top; }
      </style>
    </head>
    <body>
      ${bodyHtml}
      <script>
        window.onload = function() {
          var doPrint = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 200);
          };
          var img = document.getElementById('receipt-logo');
          if (img && !img.complete) {
            img.onload = doPrint;
            img.onerror = doPrint;
          } else {
            doPrint();
          }
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Unduh slip thermal Sales Order sebagai file PDF 80mm
 */
export const downloadSalesOrderThermalPdf = async (
  info: SalesOrderPrintInfo,
  companyProfile: CompanyProfile,
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '80mm';
  container.style.backgroundColor = '#ffffff';

  try {
    container.innerHTML = buildSalesOrderThermalHTML(info, companyProfile, true);
    document.body.appendChild(container);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(container, { pixelRatio: 2, backgroundColor: '#ffffff' });

    const { jsPDF } = await import('jspdf');

    const pxToMm = 0.264583;
    const heightInMm = container.offsetHeight * pxToMm;
    const docWidth = 80;
    const docHeight = Math.max(100, heightInMm + 10);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [docWidth, docHeight],
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = docWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, 'PNG', 0, 4, pdfWidth, pdfHeight);
    pdf.save(`SO_${info.orderNumber}.pdf`);

    onTriggerNotification('Sales Order thermal berhasil diunduh sebagai PDF');
  } catch (error) {
    onTriggerNotification('Gagal membuat PDF thermal: ' + (error as Error).message);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Cetak Sales Order langsung via Web Bluetooth API (ESC/POS)
 */
export const printBluetoothSalesOrder = async (
  info: SalesOrderPrintInfo,
  companyProfile: CompanyProfile,
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error('Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome/Edge dan pastikan HTTPS/localhost.');
    }

    const PRINTER_SERVICES = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '0000ff00-0000-1000-8000-00805f9b34fb',
    ];

    const device = await nav.bluetooth
      .requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      })
      .catch((err: any) => {
        throw new Error(
          err.message === 'User cancelled the requestDevice() chooser.'
            ? 'Pencarian perangkat dibatalkan.'
            : 'Bluetooth tidak tersedia / diblokir: ' + err.message
        );
      });

    if (!device) return;

    const server = await device.gatt?.connect();
    if (!server) throw new Error('Gagal terkoneksi ke GATT Server perangkat');

    let service: any = null;
    let printCharacteristic: any = null;

    const services = await server.getPrimaryServices();
    for (const s of services) {
      if (PRINTER_SERVICES.includes(s.uuid)) {
        service = s;
        break;
      }
    }

    if (!service) {
      throw new Error('Tidak ditemukan service printer yang kompatibel pada perangkat ini.');
    }

    const characteristics = await service.getCharacteristics();
    for (const c of characteristics) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        printCharacteristic = c;
        break;
      }
    }

    if (!printCharacteristic) {
      throw new Error('Tidak ditemukan characteristic untuk mengirim data cetak.');
    }

    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const appendBytes = (bytes: Uint8Array) => {
      chunks.push(bytes);
    };

    const appendStr = (str: string) => {
      const asciiStr = str.replace(/[^\x00-\x7F]/g, '');
      appendBytes(encoder.encode(asciiStr));
    };

    const ESC = 0x1b;
    const GS = 0x1d;

    const init = new Uint8Array([ESC, 0x40]);
    const center = new Uint8Array([ESC, 0x61, 0x01]);
    const left = new Uint8Array([ESC, 0x61, 0x00]);
    const boldOn = new Uint8Array([ESC, 0x45, 0x01]);
    const boldOff = new Uint8Array([ESC, 0x45, 0x00]);
    const lineFeed = new Uint8Array([0x0a]);
    const fontNormal = new Uint8Array([GS, 0x21, 0x00]);
    const fontLarge = new Uint8Array([GS, 0x21, 0x11]);

    const formatRupiahStr = (num: number) => {
      return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    };

    appendBytes(init);
    appendBytes(center);
    appendBytes(boldOn);
    appendBytes(fontLarge);
    appendStr(companyProfile?.name ? companyProfile.name.toUpperCase() : 'CV. BETON AGUNG');
    appendBytes(lineFeed);
    appendBytes(fontNormal);
    appendBytes(boldOff);

    const addressLines = (companyProfile?.address || '').split('\\n');
    addressLines.forEach((line: string) => {
      if (line.trim()) {
        appendStr(line.trim());
        appendBytes(lineFeed);
      }
    });
    if (companyProfile?.phone) {
      appendStr(`Telp: ${companyProfile.phone}`);
      appendBytes(lineFeed);
    }
    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(boldOn);
    appendStr('SALES ORDER');
    appendBytes(lineFeed);
    appendBytes(boldOff);
    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(left);
    appendStr(`No. SO  : ${info.orderNumber}`);
    appendBytes(lineFeed);
    appendStr(`Tanggal : ${info.orderDate}`);
    appendBytes(lineFeed);
    appendStr(`Customer: ${info.customerName}`);
    appendBytes(lineFeed);
    if (info.quotationNumber) {
      appendStr(`Ref. Qtn: ${info.quotationNumber}`);
      appendBytes(lineFeed);
    }
    appendStr(`Status  : ${info.status}`);
    appendBytes(lineFeed);
    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    info.items.forEach((item) => {
      appendBytes(boldOn);
      appendStr(item.productName);
      appendBytes(lineFeed);
      appendBytes(boldOff);

      if (item.pieceCount && item.length) {
        appendStr(` [${item.pieceCount} Fisik @ ${item.length} ${item.unit || 'M'}]`);
        appendBytes(lineFeed);
      }

      if (item.description) {
        appendStr(` ${item.description}`);
        appendBytes(lineFeed);
      }

      if (item.discountAmount && item.discountAmount > 0) {
        appendStr(` Diskon: -Rp ${formatRupiahStr(item.discountAmount)}`);
        appendBytes(lineFeed);
      }

      const qtyStr = `${item.quantity} ${item.unit || 'Unit'} x ${formatRupiahStr(item.unitPrice)}`;
      const subtotalStr = formatRupiahStr(item.subtotal);
      const spaces = PRINTER_WIDTH_80MM - qtyStr.length - subtotalStr.length;
      appendStr(qtyStr + ' '.repeat(Math.max(1, spaces)) + subtotalStr);
      appendBytes(lineFeed);
    });

    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(boldOn);
    const subtotalBeforeDiscount = (Number(info.total) || 0) + (Number(info.globalDiscountAmount) || 0);
    const subtotalStr = `SUBTOTAL         Rp ${formatRupiahStr(subtotalBeforeDiscount).padStart(12)}`;
    appendStr(subtotalStr.padStart(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    const globalDiscountAmount = Number(info.globalDiscountAmount) || 0;
    if (globalDiscountAmount > 0) {
      const discStr = `DISKON TRANSAKSI -Rp ${formatRupiahStr(globalDiscountAmount).padStart(12)}`;
      appendStr(discStr.padStart(PRINTER_WIDTH_80MM));
      appendBytes(lineFeed);
    }

    const totalStr = `TOTAL SO         Rp ${formatRupiahStr(info.total).padStart(12)}`;
    appendStr(totalStr.padStart(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);
    appendBytes(boldOff);

    if (info.notes) {
      appendStr('-'.repeat(PRINTER_WIDTH_80MM));
      appendBytes(lineFeed);
      appendStr(`Catatan: ${info.notes}`);
      appendBytes(lineFeed);
    }

    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);
    appendBytes(center);
    appendStr('Bukti Pemesanan Barang (Sales Order)');
    appendBytes(lineFeed);
    const now = new Date();
    const printTimestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    appendStr(`Waktu Cetak: ${printTimestamp}`);
    appendBytes(lineFeed);

    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendBytes(lineFeed);

    // Paper Cut
    appendBytes(new Uint8Array([GS, 0x56, 0x41, 0x00]));

    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const payload = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      payload.set(chunk, offset);
      offset += chunk.length;
    }

    for (let i = 0; i < payload.length; i += BLUETOOTH_CHUNK_SIZE) {
      const chunk = payload.slice(i, i + BLUETOOTH_CHUNK_SIZE);
      await printCharacteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, BLUETOOTH_CHUNK_DELAY_MS));
    }

    onTriggerNotification('Berhasil mencetak Sales Order ke Bluetooth Printer!');

    setTimeout(() => {
      if (device.gatt?.connected) device.gatt.disconnect();
    }, 1000);
  } catch (error) {
    console.error(error);
    onTriggerNotification('Gagal mencetak Bluetooth: ' + (error as Error).message);
  }
};
