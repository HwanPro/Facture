import { prisma } from "@/lib/prisma";

export const invoiceService = {
  async registerInvoice(data: {
    issueDate: Date;
    invoiceType: string;
    series: string;
    number: string;
    supplierRuc: string;
    supplierName: string;
    subtotal: number;
    igv: number;
    total: number;
    expenseCategory?: string;
    userId: string;
  }) {
    // Determine rate based on category
    let rate = 0;
    if (data.expenseCategory === "restaurants" || data.expenseCategory === "hotels") {
      rate = 0.15;
    } else if (data.expenseCategory === "medical" || data.expenseCategory === "professional_services") {
      rate = 0.30; // Usually 30%
    }
    
    const deductibleValue = data.total * rate;

    return await prisma.invoice.create({
      data: {
        ...data,
        deductibleRate: rate,
        deductibleValue,
      },
    });
  },

  async getUserInvoices(userId: string) {
    return await prisma.invoice.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" },
    });
  }
};
