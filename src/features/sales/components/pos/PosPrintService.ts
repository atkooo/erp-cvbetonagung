export const printReceipt = (
  info: any,
  companyProfile: any,
  stocks: any[],
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    onTriggerNotification('Gagal membuka jendela cetak. Pastikan pop-up diizinkan.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Struk Pembayaran - ${info.orderNumber}</title>
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
      <div class="text-center mb-1"><img src="${companyProfile?.logoUrl || (window.location.origin + '/logo.png')}" style="max-width: 60px; max-height: 60px; filter: grayscale(100%); object-fit: contain;" alt="Logo" /></div>
      <div class="text-center mb-2 font-bold" style="font-size: 14px;">${companyProfile?.name ? companyProfile.name.toUpperCase() : 'PERUSAHAAN'}</div>
      <div class="text-center border-b mb-2" style="font-size: 10px;">
        ${(companyProfile?.address || 'Jl. Raya Konstruksi No.123').replace(/\n/g, '<br>')}
        <br>Telp: ${companyProfile?.phone || '0812-3456-7890'}
      </div>
      
      <div class="mb-2" style="font-size: 10px;">
        <div class="flex"><span>No:</span> <span>${info.orderNumber}</span></div>
        <div class="flex"><span>Tgl:</span> <span>${info.date}</span></div>
        <div class="flex"><span>Kasir:</span> <span>Admin</span></div>
        <div class="flex"><span>Plg:</span> <span>${info.customerName}</span></div>
      </div>
      
      <div class="border-b"></div>
      
      <table class="mb-2" style="font-size: 11px;">
        ${info.items.map((item: any) => {
    const price = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
    const discountAmount = item.discount_amount || 0;
    const subtotal = (price * item.quantity) - discountAmount;
    const hasActiveDiscount = item.product.discount && (item.product.discount.is_active === true || item.product.discount.is_active === 1);
    const discountType = hasActiveDiscount ? item.product.discount.type : null;
    const discountValue = hasActiveDiscount ? item.product.discount.value : 0;
    const discountLabel = discountAmount > 0 ? `<div style="font-size: 10px; color: #555; margin-top: 2px;">Diskon ${discountType === 'percentage' ? '(' + parseFloat(discountValue) + '%)' : ''}: -Rp ${new Intl.NumberFormat('id-ID').format(discountAmount)}</div>` : '';
    
    const maxStock = parseFloat(stocks.find(s => s.product_id === item.product.id && s.location_id === item.location_id)?.quantity || '0');
    const isCustom = Number((item.product as any).is_customizable);
    const indentQty = isCustom ? item.quantity : Math.max(0, item.quantity - maxStock);
    const indentText = indentQty > 0 ? `<div style="font-size: 10px; font-weight: normal; margin-top: 2px;">(Indent/PO: ${indentQty} ${item.product.unit?.name || (typeof item.product.unit === 'string' ? item.product.unit : 'Unit')})</div>` : '';
    return `
            <tr>
              <td colspan="3">
                ${item.product.name}
                ${indentText}
                ${discountLabel}
              </td>
            </tr>
            <tr>
              <td>${item.quantity}x</td>
              <td>${new Intl.NumberFormat('id-ID').format(price)}</td>
              <td class="text-right">${new Intl.NumberFormat('id-ID').format(subtotal)}</td>
            </tr>
          `;
  }).join('')}
      </table>
      
      <div class="border-b"></div>
      
      <table class="mb-2 font-bold" style="font-size: 11px;">
        <tr>
          <td>SUBTOTAL</td>
          <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.cartTotal)}</td>
        </tr>
        ${info.globalDiscountAmount > 0 ? `
        <tr>
          <td>DISKON TRANSAKSI</td>
          <td class="text-right">-Rp ${new Intl.NumberFormat('id-ID').format(info.globalDiscountAmount)}</td>
        </tr>
        <tr>
          <td>GRAND TOTAL</td>
          <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.grandTotal || info.cartTotal)}</td>
        </tr>
        ` : ''}
        <tr>
          <td>BAYAR (DP)</td>
          <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(info.amountPaid)}</td>
        </tr>
        <tr>
          <td>${info.change >= 0 ? 'KEMBALI' : 'SISA TAGIHAN'}</td>
          <td class="text-right">Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(info.change))}</td>
        </tr>
      </table>
      
      <div class="text-center mb-2 font-bold" style="font-size: 11px;">
        STATUS: ${info.change >= 0 ? 'LUNAS' : 'BELUM LUNAS (OUTSTANDING RECEIVABLE)'}
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
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
  info: any,
  companyProfile: any,
  stocks: any[],
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '80mm';
    container.style.backgroundColor = '#ffffff';

    const htmlContent = `
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 12px; font-weight: 600; line-height: 1.2; padding: 2mm; color: #000; box-sizing: border-box; width: 69mm; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 5px;"><img src="${companyProfile?.logoUrl || (window.location.origin + '/logo.png')}" style="max-width: 60px; max-height: 60px; filter: grayscale(100%); object-fit: contain;" alt="Logo" crossorigin="anonymous" /></div>
        <div class="text-center mb-2 font-bold" style="text-align: center; font-size: 14px; font-weight: 900; margin-bottom: 10px;">${companyProfile?.name ? companyProfile.name.toUpperCase() : 'PERUSAHAAN'}</div>
        <div class="text-center border-b mb-2" style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; font-size: 10px;">
          ${(companyProfile?.address || 'Jl. Raya Konstruksi No.123').replace(/\n/g, '<br>')}
          <br>Telp: ${companyProfile?.phone || '0812-3456-7890'}
        </div>
        
        <div class="mb-2" style="margin-bottom: 10px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between;"><span>No:</span> <span>${info.orderNumber}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Tgl:</span> <span>${info.date}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Kasir:</span> <span>Admin</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Plg:</span> <span>${info.customerName}</span></div>
        </div>
        
        <div class="border-b" style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;"></div>
        
        <table class="mb-2" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
          ${info.items.map((item: any) => {
      const price = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
      const discountAmount = item.discount_amount || 0;
      const subtotal = (price * item.quantity) - discountAmount;
      const hasActiveDiscount = item.product.discount && (item.product.discount.is_active === true || item.product.discount.is_active === 1);
      const discountType = hasActiveDiscount ? item.product.discount.type : null;
      const discountValue = hasActiveDiscount ? item.product.discount.value : 0;
      const discountLabel = discountAmount > 0 ? `<div style="font-size: 10px; color: #555; margin-top: 2px;">Diskon ${discountType === 'percentage' ? '(' + parseFloat(discountValue) + '%)' : ''}: -Rp ${new Intl.NumberFormat('id-ID').format(discountAmount)}</div>` : '';
      
      const maxStock = parseFloat(stocks.find(s => s.product_id === item.product.id && s.location_id === item.location_id)?.quantity || '0');
      const isCustom = Number((item.product as any).is_customizable);
      const indentQty = isCustom ? item.quantity : Math.max(0, item.quantity - maxStock);
      const indentText = indentQty > 0 ? `<div style="font-size: 10px; font-weight: normal; margin-top: 2px;">(Indent/PO: ${indentQty} ${item.product.unit?.name || (typeof item.product.unit === 'string' ? item.product.unit : 'Unit')})</div>` : '';
      return `
              <tr>
                <td colspan="3" style="padding: 2px 0; vertical-align: top;">
                  ${item.product.name}
                  ${indentText}
                  ${discountLabel}
                </td>
              </tr>
              <tr>
                <td style="padding: 2px 0; vertical-align: top;">${item.quantity}x</td>
                <td style="padding: 2px 0; vertical-align: top;">${new Intl.NumberFormat('id-ID').format(price)}</td>
                <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">${new Intl.NumberFormat('id-ID').format(subtotal)}</td>
              </tr>
            `;
    }).join('')}
        </table>
        
        <div class="border-b" style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;"></div>
        
        <table class="mb-2 font-bold" style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; font-weight: 900;">
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">SUBTOTAL</td>
            <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(info.cartTotal)}</td>
          </tr>
          ${info.globalDiscountAmount > 0 ? `
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">DISKON TRANSAKSI</td>
            <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">-Rp ${new Intl.NumberFormat('id-ID').format(info.globalDiscountAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">GRAND TOTAL</td>
            <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(info.grandTotal || info.cartTotal)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">BAYAR (DP)</td>
            <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(info.amountPaid)}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0; vertical-align: top;">${info.change >= 0 ? 'KEMBALI' : 'SISA TAGIHAN'}</td>
            <td class="text-right" style="padding: 2px 0; vertical-align: top; text-align: right;">Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(info.change))}</td>
          </tr>
        </table>
        
        <div class="text-center mb-2 font-bold" style="text-align: center; margin-bottom: 10px; font-size: 11px; font-weight: 900;">
          STATUS: ${info.change >= 0 ? 'LUNAS' : 'BELUM LUNAS (OUTSTANDING RECEIVABLE)'}
        </div>
      </div>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    await new Promise(resolve => setTimeout(resolve, 150));

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

    document.body.removeChild(container);
    onTriggerNotification('Struk berhasil diunduh sebagai PDF');

  } catch (error) {
    onTriggerNotification('Gagal membuat PDF: ' + (error as Error).message);
  }
};

export const printBluetoothReceipt = async (
  info: any,
  companyProfile: any,
  stocks: any[],
  onTriggerNotification: (msg: string) => void
) => {
  if (!info) return;

  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error("Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome/Edge dan pastikan HTTPS/localhost.");
    }

    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
    }).catch((err: any) => {
      throw new Error(err.message === 'User cancelled the requestDevice() chooser.'
        ? 'Pencarian perangkat dibatalkan.'
        : 'Bluetooth tidak tersedia / diblokir: ' + err.message);
    });

    if (!device) return;

    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terkoneksi ke GATT Server perangkat");

    const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
    const printCharacteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

    const encoder = new TextEncoder();
    let payload = new Uint8Array();

    const appendBytes = (bytes: Uint8Array) => {
      const newPayload = new Uint8Array(payload.length + bytes.length);
      newPayload.set(payload);
      newPayload.set(bytes, payload.length);
      payload = newPayload;
    };

    const appendStr = (str: string) => {
      appendBytes(encoder.encode(str));
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

    // WIDTH 48 = printer 80mm (sesuai dengan USB/kabel yang pakai width 69mm)
    const WIDTH = 48;

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
    appendStr('-'.repeat(WIDTH));
    appendBytes(lineFeed);

    appendBytes(left);
    appendStr(`No   : ${info.orderNumber}`);
    appendBytes(lineFeed);
    appendStr(`Tgl  : ${info.date}`);
    appendBytes(lineFeed);
    appendStr(`Kasir: Admin`);
    appendBytes(lineFeed);
    appendStr(`Plg  : ${info.customerName}`);
    appendBytes(lineFeed);
    appendStr('-'.repeat(WIDTH));
    appendBytes(lineFeed);
    appendBytes(lineFeed);

    info.items.forEach((item: any) => {
      const price = parseFloat(item.product.sellingPrice?.toString() || item.product.selling_price?.toString() || '0');
      const discountAmount = item.discount_amount || 0;
      const subtotal = (price * item.quantity) - discountAmount;
      const maxStock = parseFloat(stocks.find((s: any) => s.product_id === item.product.id && s.location_id === item.location_id)?.quantity || '0');
      const isCustom = Number((item.product as any).is_customizable);
      const indentQty = isCustom ? item.quantity : Math.max(0, item.quantity - maxStock);

      appendStr(item.product.name);
      appendBytes(lineFeed);
      
      if (indentQty > 0) {
        appendStr(`(Indent/PO: ${indentQty} ${item.product.unit?.name || (typeof item.product.unit === 'string' ? item.product.unit : 'Unit')})`);
        appendBytes(lineFeed);
      }
      
      if (discountAmount > 0) {
        const hasActiveDiscount = item.product.discount && (item.product.discount.is_active === true || item.product.discount.is_active === 1);
        const discountType = hasActiveDiscount ? item.product.discount.type : null;
        const discountValue = hasActiveDiscount ? item.product.discount.value : 0;
        const discountLabel = discountType === 'percentage' ? `(${parseFloat(discountValue)}%)` : '';
        appendStr(` Diskon ${discountLabel}: -Rp ${formatRupiahStr(discountAmount)}`);
        appendBytes(lineFeed);
      }

      const qtyStr = `${item.quantity}x`;
      const priceStr = formatRupiahStr(price);
      const subtotalStr = formatRupiahStr(subtotal);

      const leftPart = `${qtyStr.padEnd(6)}${priceStr}`;
      const spaces = WIDTH - leftPart.length - subtotalStr.length;
      appendStr(leftPart + ' '.repeat(Math.max(0, spaces)) + subtotalStr);
      appendBytes(lineFeed);
    });

    appendStr('-'.repeat(WIDTH));
    appendBytes(lineFeed);

    appendBytes(boldOn);
    const subtotalStr2 = `SUBTOTAL           Rp ${formatRupiahStr(info.cartTotal).padStart(12)}`;
    appendStr(subtotalStr2.padStart(WIDTH));
    appendBytes(lineFeed);

    if (info.globalDiscountAmount > 0) {
      const globalDiscStr = `DISKON TRANSAKSI  -Rp ${formatRupiahStr(info.globalDiscountAmount).padStart(12)}`;
      appendStr(globalDiscStr.padStart(WIDTH));
      appendBytes(lineFeed);
      
      const grandTotalStr = `GRAND TOTAL        Rp ${formatRupiahStr(info.grandTotal || info.cartTotal).padStart(12)}`;
      appendStr(grandTotalStr.padStart(WIDTH));
      appendBytes(lineFeed);
    }

    const bayarStr = `BAYAR (DP)         Rp ${formatRupiahStr(info.amountPaid).padStart(12)}`;
    appendStr(bayarStr.padStart(WIDTH));
    appendBytes(lineFeed);

    const sisaStr = `${info.change >= 0 ? 'KEMBALI' : 'SISA TAGIHAN'}       Rp ${formatRupiahStr(Math.abs(info.change)).padStart(12)}`;
    appendStr(sisaStr.padStart(WIDTH));
    appendBytes(lineFeed);

    appendBytes(center);
    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendStr(`STATUS: ${info.change >= 0 ? 'LUNAS' : 'BELUM LUNAS (OUTSTANDING RECEIVABLE)'}`);
    appendBytes(lineFeed);
    appendBytes(boldOff);

    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendBytes(lineFeed);
    appendBytes(lineFeed);

    // Cut command
    appendBytes(new Uint8Array([GS, 0x56, 0x41, 0x00]));

    // Send to printer in 512 byte chunks
    const chunkSize = 512;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      await printCharacteristic.writeValue(chunk);
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
