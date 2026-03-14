import { prisma } from "@/lib/prisma";
import { taxCalculationService } from "./taxCalculationService";

export const reportService = {
  async getMonthlyReport(userId: string, year: number, month: number) {
    const startDate = new Date(`${year}-${month.toString().padStart(2, "0")}-01`);
    const endofMonthDay = new Date(year, month, 0).getDate();
    const endDate = new Date(`${year}-${month.toString().padStart(2, "0")}-${endofMonthDay}`);

    const incomes = await prisma.income.findMany({
      where: { userId, issueDate: { gte: startDate, lte: endDate } },
    });

    const invoices = await prisma.invoice.findMany({
      where: { userId, issueDate: { gte: startDate, lte: endDate } },
    });

    const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalRetention = incomes.reduce((sum, item) => sum + item.retention, 0);
    const deductibleExpenses = invoices.reduce((sum, item) => sum + item.deductibleValue, 0);

    return {
      totalIncome,
      totalRetention,
      deductibleExpenses,
      estimatedDeduction: taxCalculationService.calculateAnnualDeduction(deductibleExpenses),
    };
  },

  async getAnnualReport(userId: string, year: number) {
    const taxEstimate = await taxCalculationService.estimateAnnualTax(userId, year);
    return {
      year,
      yearlyIncome: taxEstimate.totalIncome,
      retentionPaid: taxEstimate.totalRetention,
      deductibleExpenses: taxEstimate.totalDeductibles,
      deductionApplied: taxEstimate.finalDeduction,
      estimatedTax: taxEstimate.estimatedTax,
    };
  }
};
