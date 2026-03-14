import { NextResponse } from "next/server";
import { incomeService } from "@/services/incomeService";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // Assuming user authentication happens here or passed via headers
    const newIncome = await incomeService.registerIncome({
      ...data,
      issueDate: new Date(data.issueDate),
      userId: "temp-user-id" // Get from real session
    });

    return NextResponse.json(newIncome, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create income" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const incomes = await incomeService.getUserIncomes("temp-user-id");
    return NextResponse.json(incomes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incomes" }, { status: 500 });
  }
}
