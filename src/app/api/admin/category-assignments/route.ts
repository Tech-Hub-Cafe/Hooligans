import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { z } from "zod";

const assignmentSchema = z.object({
  category_name: z.string().min(1).max(255),
  section: z.enum(["food", "drinks", "combo"]),
});

const bulkUpdateSchema = z.object({
  assignments: z.array(assignmentSchema),
});

// GET - Fetch all category assignments
export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const assignments = await prisma.categoryOrderingAssignment.findMany({
      orderBy: { category_name: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Error fetching category assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch category assignments" },
      { status: 500 }
    );
  }
}

// PUT - Bulk update category assignments
export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const validationResult = bulkUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { assignments } = validationResult.data;

    // Use transaction to update all assignments
    const results = await prisma.$transaction(
      assignments.map((assignment) =>
        prisma.categoryOrderingAssignment.upsert({
          where: { category_name: assignment.category_name.trim() },
          update: {
            section: assignment.section,
          },
          create: {
            category_name: assignment.category_name.trim(),
            section: assignment.section,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      assignments: results,
    });
  } catch (error: any) {
    console.error("Error updating category assignments:", error);
    return NextResponse.json(
      { error: "Failed to update category assignments" },
      { status: 500 }
    );
  }
}
