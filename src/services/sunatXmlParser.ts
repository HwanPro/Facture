export const sunatXmlParser = {
  parseXml(xmlString: string) {
    // In a real scenario, you'd use a robust XML parser like fxp or xml2js
    // Dummy extraction implementation based on UBL 2.1 standard structure tags
    
    // Stub values
    const issueDate = new Date();
    const series = "F001";
    const number = "0000123";
    const supplierRuc = "20123456789";
    const supplierName = "Empresa Ejemplo SAC";
    const total = 118.00;
    const subtotal = 100.00;
    const igv = 18.00;

    return {
      issueDate,
      invoiceType: "01", // Factura
      series,
      number,
      supplierRuc,
      supplierName,
      subtotal,
      igv,
      total,
    };
  }
};
