export interface PrintInfo {
  orderNumber: string;
  date: string;
  customerName: string;
  cashierName?: string;
  cartTotal: number;
  globalDiscountAmount?: number;
  grandTotal?: number;
  amountPaid: number;
  change: number;
  items: Array<any>;
  isHistory?: boolean;
}

export interface CompanyProfile {
  name?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

export interface StockItem {
  product_id: string;
  location_id: string;
  quantity: string | number;
}

interface NormalizedItem {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  indentQty: number;
  indentText: string;
}

const PRINTER_WIDTH_80MM = 48;
const BLUETOOTH_CHUNK_SIZE = 100;
const BLUETOOTH_CHUNK_DELAY_MS = 50;

const escapeHtml = (unsafe: string | null | undefined): string => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const normalizeReceiptItems = (items: any[], stocks: StockItem[], isHistory: boolean = false): NormalizedItem[] => {
  return (items || []).map((item: any) => {
    const price = parseFloat(item.product?.sellingPrice?.toString() || item.product?.selling_price?.toString() || '0');
    const discountAmount = Number(item.discount_amount) || 0;
    const qty = Number(item.quantity) || 0;
    const subtotal = (price * qty) - discountAmount;

    const hasActiveDiscount = item.product?.discount && (item.product.discount.is_active === true || item.product.discount.is_active === 1);
    const discountType = hasActiveDiscount ? item.product.discount.type : null;
    const discountValue = hasActiveDiscount ? item.product.discount.value : 0;
    const discountLabel = discountType === 'percentage' ? `(${parseFloat(String(discountValue))}%)` : '';

    const maxStock = parseFloat(String(stocks.find((s) => s.product_id === item.product?.id && s.location_id === item.location_id)?.quantity || '0'));
    const isCustom = Number(item.product?.is_customizable);
    const indentQty = isHistory ? 0 : (isCustom ? qty : Math.max(0, qty - maxStock));
    const unitName = item.product?.unit?.name || (typeof item.product?.unit === 'string' ? item.product.unit : 'Unit');
    const indentText = indentQty > 0 ? `(Indent/PO: ${indentQty} ${unitName})` : '';

    return {
      name: item.product?.name || 'Item',
      quantity: qty,
      price,
      subtotal,
      discountAmount,
      discountLabel,
      indentQty,
      indentText
    };
  });
};

const buildReceiptHTML = (info: PrintInfo, companyProfile: CompanyProfile, normalizedItems: NormalizedItem[], isPdf: boolean = false) => {
  const containerStyle = isPdf
    ? `font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 600; line-height: 1.2; padding: 2mm; color: #000; box-sizing: border-box; width: 69mm; margin: 0 auto;`
    : ``;

  const imgCrossorigin = isPdf ? `crossorigin="anonymous"` : ``;
  
  const cartTotal = Number(info.cartTotal) || 0;
  const globalDiscountAmount = Number(info.globalDiscountAmount) || 0;
  const grandTotal = Number(info.grandTotal || info.cartTotal) || 0;
  const amountPaid = Number(info.amountPaid) || 0;
  const change = Number(info.change) || 0;

  return `
    <div ${isPdf ? `style="${containerStyle}"` : ''}>
      <div class="text-center mb-1" ${isPdf ? 'style="text-align: center; margin-bottom: 5px;"' : ''}>
        <img id="receipt-logo" src="${escapeHtml(companyProfile?.logoUrl) || (window.location.origin + '/logo.png')}" style="max-width: 60px; max-height: 60px; filter: grayscale(100%); object-fit: contain;" alt="Logo" ${imgCrossorigin} />
      </div>
      <div class="text-center mb-2 font-bold" ${isPdf ? 'style="text-align: center; font-size: 14px; font-weight: 900; margin-bottom: 10px;"' : 'style="font-size: 14px;"'}>
        ${escapeHtml(companyProfile?.name ? companyProfile.name.toUpperCase() : 'PERUSAHAAN')}
      </div>
      <div class="text-center border-b mb-2" ${isPdf ? 'style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; font-size: 10px;"' : 'style="font-size: 10px;"'}>
        ${escapeHtml(companyProfile?.address || 'Jl. Raya Konstruksi No.123').replace(/\\n/g, '<br>')}
        <br>Telp: ${escapeHtml(companyProfile?.phone || '0812-3456-7890')}
      </div>
      
      <div class="mb-2" ${isPdf ? 'style="margin-bottom: 10px; font-size: 10px;"' : 'style="font-size: 10px;"'}>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}><span>No:</span> <span>${escapeHtml(info.orderNumber)}</span></div>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}><span>Tgl:</span> <span>${escapeHtml(info.date)}</span></div>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}><span>Kasir:</span> <span>${escapeHtml(info.cashierName || 'Admin')}</span></div>
        <div ${isPdf ? 'style="display: flex; justify-content: space-between;"' : 'class="flex"'}><span>Plg:</span> <span>${escapeHtml(info.customerName)}</span></div>
      </div>
      
      <div class="border-b" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;"' : ''}></div>
      
      <table class="mb-2" ${isPdf ? 'style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;"' : 'style="font-size: 11px;"'}>
        ${normalizedItems.map(item => `
          <tr>
            <td colspan="3" ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>
              ${escapeHtml(item.name)}
              ${item.indentQty > 0 ? `<div style="font-size: 10px; font-weight: normal; margin-top: 2px;">${escapeHtml(item.indentText)}</div>` : ''}
              ${item.discountAmount > 0 ? `<div style="font-size: 10px; color: #555; margin-top: 2px;">Diskon ${escapeHtml(item.discountLabel)}: -Rp ${new Intl.NumberFormat('id-ID').format(item.discountAmount)}</div>` : ''}
            </td>
          </tr>
          <tr>
            <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>${item.quantity}x</td>
            <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>${new Intl.NumberFormat('id-ID').format(item.price)}</td>
            <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>${new Intl.NumberFormat('id-ID').format(item.subtotal)}</td>
          </tr>
        `).join('')}
      </table>
      
      <div class="border-b" ${isPdf ? 'style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;"' : ''}></div>
      
      <table class="mb-2 font-bold" ${isPdf ? 'style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; font-weight: 900;"' : 'style="font-size: 11px;"'}>
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>SUBTOTAL</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>Rp ${new Intl.NumberFormat('id-ID').format(cartTotal)}</td>
        </tr>
        ${globalDiscountAmount > 0 ? `
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>DISKON TRANSAKSI</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>-Rp ${new Intl.NumberFormat('id-ID').format(globalDiscountAmount)}</td>
        </tr>
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>GRAND TOTAL</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>Rp ${new Intl.NumberFormat('id-ID').format(grandTotal)}</td>
        </tr>
        ` : ''}
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>BAYAR (DP)</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>Rp ${new Intl.NumberFormat('id-ID').format(amountPaid)}</td>
        </tr>
        <tr>
          <td ${isPdf ? 'style="padding: 2px 0; vertical-align: top;"' : ''}>${change >= 0 ? 'KEMBALI' : 'SISA TAGIHAN'}</td>
          <td class="text-right" ${isPdf ? 'style="padding: 2px 0; vertical-align: top; text-align: right;"' : ''}>Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(change))}</td>
        </tr>
      </table>
      
      <div class="text-center mb-2 font-bold" ${isPdf ? 'style="text-align: center; margin-bottom: 10px; font-size: 11px; font-weight: 900;"' : 'style="font-size: 11px;"'}>
        STATUS: ${change >= 0 ? 'LUNAS' : 'BELUM LUNAS (OUTSTANDING RECEIVABLE)'}
      </div>
    </div>
  `;
};

export const printReceipt = (
  info: PrintInfo,
  companyProfile: CompanyProfile,
  stocks: StockItem[],
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    onTriggerNotification('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
    return;
  }

  const normalizedItems = normalizeReceiptItems(info.items, stocks, info.isHistory);
  const bodyHtml = buildReceiptHTML(info, companyProfile, normalizedItems, false);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Pembayaran - ${escapeHtml(info.orderNumber)}</title>
      <style>
        @page { margin: 0; size: auto; }
        body { 
          font-family: 'Consolas', 'Courier New', Courier, monospace; 
          width: 69mm; 
          margin: 0; 
          padding: 0 2mm; 
          box-sizing: border-box;
          font-size: 12px; 
          font-weight: 600;
          line-height: 1.2;
          color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 900; }
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .border-b { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px; }
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

export const downloadReceipt = async (
  info: PrintInfo,
  companyProfile: CompanyProfile,
  stocks: StockItem[],
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
    const normalizedItems = normalizeReceiptItems(info.items, stocks, info.isHistory);
    container.innerHTML = buildReceiptHTML(info, companyProfile, normalizedItems, true);
    
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 200)); // wait for DOM and images

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

    pdf.addImage(dataUrl, 'PNG', 0, 5, pdfWidth, pdfHeight);
    pdf.save(`Struk_${info.orderNumber}.pdf`);

    onTriggerNotification('Struk berhasil diunduh sebagai PDF');

  } catch (error) {
    onTriggerNotification('Gagal membuat PDF: ' + (error as Error).message);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

export const printBluetoothReceipt = async (
  info: PrintInfo,
  companyProfile: CompanyProfile,
  stocks: StockItem[],
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error("Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome/Edge dan pastikan HTTPS/localhost.");
    }

    const PRINTER_SERVICES = [
      '000018f0-0000-1000-8000-00805f9b34fb',
      '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
      '0000ff00-0000-1000-8000-00805f9b34fb'
    ];

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES
    }).catch((err: any) => {
      throw new Error(err.message === 'User cancelled the requestDevice() chooser.'
        ? 'Pencarian perangkat dibatalkan.'
        : 'Bluetooth tidak tersedia / diblokir: ' + err.message);
    });

    if (!device) return;

    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terkoneksi ke GATT Server perangkat");

    let service: any = null;
    let printCharacteristic: any = null;

    // Coba temukan service yang cocok dari daftar yang didukung printer
    const services = await server.getPrimaryServices();
    for (const s of services) {
      if (PRINTER_SERVICES.includes(s.uuid)) {
        service = s;
        break;
      }
    }

    if (!service) {
      throw new Error(`Tidak ditemukan service printer yang kompatibel pada perangkat ini.`);
    }

    // Cari characteristic yang bisa di-write
    const characteristics = await service.getCharacteristics();
    for (const c of characteristics) {
      if (c.properties.write || c.properties.writeWithoutResponse) {
        printCharacteristic = c;
        break;
      }
    }

    if (!printCharacteristic) {
      throw new Error("Tidak ditemukan characteristic untuk mengirim data cetak.");
    }

    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];

    const appendBytes = (bytes: Uint8Array) => {
      chunks.push(bytes);
    };

    const appendStr = (str: string) => {
      // Hilangkan karakter non-ASCII untuk mencegah error pada printer
      const asciiStr = str.replace(/[^\x00-\x7F]/g, '');
      appendBytes(encoder.encode(asciiStr));
    };

    const ESC = 0x1B;
    const GS = 0x1D;

    const init = new Uint8Array([ESC, 0x40]);
    const center = new Uint8Array([ESC, 0x61, 0x01]);
    const left = new Uint8Array([ESC, 0x61, 0x00]);
    const boldOn = new Uint8Array([ESC, 0x45, 0x01]);
    const boldOff = new Uint8Array([ESC, 0x45, 0x00]);
    const lineFeed = new Uint8Array([0x0A]);
    const fontNormal = new Uint8Array([GS, 0x21, 0x00]);
    const fontLarge = new Uint8Array([GS, 0x21, 0x11]);

    const formatRupiahStr = (num: number) => {
      return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    };

    appendBytes(init);
    appendBytes(center);
    appendBytes(boldOn);
    appendBytes(fontLarge);
    appendStr(companyProfile?.name ? companyProfile.name.toUpperCase() : 'PERUSAHAAN');
    appendBytes(lineFeed);
    // Reset font ke normal SEBELUM teks berikutnya agar tidak ikut membesar
    appendBytes(fontNormal);
    appendBytes(boldOff);
    const addressLines = (companyProfile?.address || 'Jl. Raya Konstruksi No.123').split('\\n');
    addressLines.forEach((line: string) => {
      appendStr(line);
      appendBytes(lineFeed);
    });
    appendStr(`Telp: ${companyProfile?.phone || '0812-3456-7890'}`);
    appendBytes(lineFeed);
    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(left);
    appendStr(`No   : ${info.orderNumber}`);
    appendBytes(lineFeed);
    appendStr(`Tgl  : ${info.date}`);
    appendBytes(lineFeed);
    appendStr(`Kasir: ${info.cashierName || 'Admin'}`);
    appendBytes(lineFeed);
    appendStr(`Plg  : ${info.customerName}`);
    appendBytes(lineFeed);
    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);
    appendBytes(lineFeed);

    const normalizedItems = normalizeReceiptItems(info.items, stocks, info.isHistory);

    normalizedItems.forEach((item) => {
      appendStr(item.name);
      appendBytes(lineFeed);

      if (item.indentQty > 0) {
        appendStr(item.indentText);
        appendBytes(lineFeed);
      }

      if (item.discountAmount > 0) {
        appendStr(` Diskon ${item.discountLabel}: -Rp ${formatRupiahStr(item.discountAmount)}`);
        appendBytes(lineFeed);
      }

      const qtyStr = `${item.quantity}x`;
      const priceStr = formatRupiahStr(item.price);
      const subtotalStr = formatRupiahStr(item.subtotal);

      const leftPart = `${qtyStr.padEnd(6)}${priceStr}`;
      const spaces = PRINTER_WIDTH_80MM - leftPart.length - subtotalStr.length;
      appendStr(leftPart + ' '.repeat(Math.max(0, spaces)) + subtotalStr);
      appendBytes(lineFeed);
    });

    appendStr('-'.repeat(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(boldOn);
    const cartTotal = Number(info.cartTotal) || 0;
    const subtotalStr2 = `SUBTOTAL           Rp ${formatRupiahStr(cartTotal).padStart(12)}`;
    appendStr(subtotalStr2.padStart(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    const globalDiscountAmount = Number(info.globalDiscountAmount) || 0;
    const grandTotal = Number(info.grandTotal || info.cartTotal) || 0;
    if (globalDiscountAmount > 0) {
      const globalDiscStr = `DISKON TRANSAKSI  -Rp ${formatRupiahStr(globalDiscountAmount).padStart(12)}`;
      appendStr(globalDiscStr.padStart(PRINTER_WIDTH_80MM));
      appendBytes(lineFeed);

      const grandTotalStr = `GRAND TOTAL        Rp ${formatRupiahStr(grandTotal).padStart(12)}`;
      appendStr(grandTotalStr.padStart(PRINTER_WIDTH_80MM));
      appendBytes(lineFeed);
    }

    const amountPaid = Number(info.amountPaid) || 0;
    const bayarStr = `BAYAR (DP)         Rp ${formatRupiahStr(amountPaid).padStart(12)}`;
    appendStr(bayarStr.padStart(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    const change = Number(info.change) || 0;
    const sisaStr = `${change >= 0 ? 'KEMBALI' : 'SISA TAGIHAN'}       Rp ${formatRupiahStr(Math.abs(change)).padStart(12)}`;
    appendStr(sisaStr.padStart(PRINTER_WIDTH_80MM));
    appendBytes(lineFeed);

    appendBytes(center);
    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendStr(`STATUS: ${change >= 0 ? 'LUNAS' : 'BELUM LUNAS (OUTSTANDING RECEIVABLE)'}`);
    appendBytes(lineFeed);
    appendBytes(boldOff);

    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendBytes(lineFeed);

    // Cut command
    appendBytes(new Uint8Array([GS, 0x56, 0x41, 0x00]));

    // Gabungkan semua chunk
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const payload = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      payload.set(chunk, offset);
      offset += chunk.length;
    }

    // Send to printer in smaller chunks with delay
    for (let i = 0; i < payload.length; i += BLUETOOTH_CHUNK_SIZE) {
      const chunk = payload.slice(i, i + BLUETOOTH_CHUNK_SIZE);
      await printCharacteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, BLUETOOTH_CHUNK_DELAY_MS));
    }

    onTriggerNotification('Berhasil mencetak ke Bluetooth Printer!');

    setTimeout(() => {
      if (device.gatt?.connected) device.gatt.disconnect();
    }, 1000);

  } catch (error) {
    console.error(error);
    onTriggerNotification('Gagal mencetak Bluetooth: ' + (error as Error).message);
  }
};

