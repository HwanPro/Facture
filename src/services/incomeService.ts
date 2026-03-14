import { prisma } from "@/lib/prisma";

export const incomeService = {
  async registerIncome(data: {
    issueDate: Date;
    receiptNumber: string;
    clientName: string;
    clientRuc: string;
    amount: number;
    suspensionApplied: boolean;
    paymentMethod?: string;
    userId: string;
  }) {
    let retention = 0;
    if (!data.suspensionApplied) {
      retention = data.amount * 0.08;
    }
    const netAmount = data.amount - retention;

    return await prisma.income.create({
      data: {
        ...data,
        retention,
        netAmount,
      },
    });
  },

  async getUserIncomes(userId: string) {
    return await prisma.income.findMany({
      where: { userId },
      orderBy: { issueDate: "desc" },
    });
  }
};
