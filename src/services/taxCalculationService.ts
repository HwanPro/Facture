import { prisma } from "@/lib/prisma";

export const taxCalculationService = {
  calculateTotalIncome(incomes: { amount: number }[]) {
    return incomes.reduce((acc, current) => acc + current.amount, 0);
  },

  calculateTotalRetention(incomes: { retention: number }[]) {
    return incomes.reduce((acc, current) => acc + current.retention, 0);
  },

  calculateDeductibleExpenses(invoices: { deductibleValue: number }[]) {
    return invoices.reduce((acc, current) => acc + current.deductibleValue, 0);
  },

  calculateAnnualDeduction(deductionTotal: number, currentUIT: number = 5150) {
    const maxDeduction = currentUIT * 3;
    return Math.min(deductionTotal, maxDeduction);
  },

  async estimateAnnualTax(userId: string, year: number) {
    // 1. Get incomes for the year
    const incomes = await prisma.income.findMany({
      where: {
        userId,
        issueDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    // 2. Get invoices/expenses
    const invoices = await prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
      },
    });

    const totalIncome = this.calculateTotalIncome(incomes);
    const totalRetention = this.calculateTotalRetention(incomes);
    const totalDeductibles = this.calculateDeductibleExpenses(invoices);
    const finalDeduction = this.calculateAnnualDeduction(totalDeductibles);

    // Simplistic Peruvian 4th category estimate (Just a placeholder logic for 8% or scale)
    // Actually there is a 20% flat deduction first, then the 7 UIT max deduction
    const uit = 5150;
    const standardDeduction = Math.min( totalIncome * 0.2, 24 * uit ); 
    const netIncomeBefore7UIT = totalIncome - standardDeduction;
    const finalNetIncomeBeforeRates = netIncomeBefore7UIT - (7 * uit) - finalDeduction;

    let estimatedTax = 0;
    if (finalNetIncomeBeforeRates > 0) {
      // Very basic bracket logic: 8% up to 5 UIT, 14% up to 20 UIT... 
      // (Implementation requires full SUNAT brackets)
      estimatedTax = finalNetIncomeBeforeRates * 0.08; 
    }

    return {
      totalIncome,
      totalRetention,
      totalDeductibles,
      finalDeduction,
      estimatedTax,
    };
  }
};
