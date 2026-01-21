import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { checkOrderingAvailabilityByType } from "@/lib/orderingTime";
import { getItemTypeFromCategory } from "@/lib/itemCategory";
import { orderSchema, sanitizeString } from "@/lib/validation";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  special_instructions: string | null;
  user_id: number | null;
  created_at: string;
}

// GET /api/orders - Get all orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { created_at: "desc" },
    });

    // Convert total from Decimal to number
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as OrderItem[],
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input with Zod schema
    const validationResult = orderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      total,
      special_instructions,
      user_id,
    } = validationResult.data;

    // Validate and recalculate total server-side to prevent price manipulation
    const calculatedTotal = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity;
      if (!Number.isFinite(itemTotal) || itemTotal < 0) {
        throw new Error(`Invalid item total for ${item.name}`);
      }
      return sum + itemTotal;
    }, 0);

    // Allow small floating point differences (0.01)
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return NextResponse.json(
        { 
          error: "Total mismatch. Please refresh and try again.",
          calculatedTotal,
          providedTotal: total,
        },
        { status: 400 }
      );
    }

    // Check if ordering is currently available for each item
    const settings = await prisma.cafeSettings.findFirst();
    if (settings) {
      const orderingHours = {
        monday_food_ordering_hours: settings.monday_food_ordering_hours,
        tuesday_food_ordering_hours: settings.tuesday_food_ordering_hours,
        wednesday_food_ordering_hours: settings.wednesday_food_ordering_hours,
        thursday_food_ordering_hours: settings.thursday_food_ordering_hours,
        friday_food_ordering_hours: settings.friday_food_ordering_hours,
        saturday_food_ordering_hours: settings.saturday_food_ordering_hours,
        sunday_food_ordering_hours: settings.sunday_food_ordering_hours,
        monday_drinks_ordering_hours: settings.monday_drinks_ordering_hours,
        tuesday_drinks_ordering_hours: settings.tuesday_drinks_ordering_hours,
        wednesday_drinks_ordering_hours: settings.wednesday_drinks_ordering_hours,
        thursday_drinks_ordering_hours: settings.thursday_drinks_ordering_hours,
        friday_drinks_ordering_hours: settings.friday_drinks_ordering_hours,
        saturday_drinks_ordering_hours: settings.saturday_drinks_ordering_hours,
        sunday_drinks_ordering_hours: settings.sunday_drinks_ordering_hours,
      };

      // Validate each item against its appropriate ordering hours
      const unavailableItems: string[] = [];
      for (const item of items) {
        const category = item.category || "";
        const itemType = getItemTypeFromCategory(category);
        const availability = checkOrderingAvailabilityByType(orderingHours, itemType);
        
        if (!availability.isAvailable) {
          unavailableItems.push(`${item.name} (${itemType})`);
        }
      }

      if (unavailableItems.length > 0) {
        return NextResponse.json(
          { 
            error: "Some items cannot be ordered at this time",
            unavailableItems,
            message: `The following items are outside ordering hours: ${unavailableItems.join(", ")}`
          },
          { status: 403 }
        );
      }
    }

    // Get user_id from session if not provided
    let finalUserId = user_id ? parseInt(user_id.toString()) : null;
    if (!finalUserId) {
      const session = await auth();
      finalUserId = session?.user?.id ? parseInt(session.user.id) : null;
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(customer_name);
    const sanitizedEmail = customer_email.toLowerCase().trim();
    const sanitizedPhone = customer_phone ? sanitizeString(customer_phone) : null;
    const sanitizedInstructions = special_instructions ? sanitizeString(special_instructions) : null;

    const order = await prisma.order.create({
      data: {
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: sanitizedPhone,
        items: items as any,
        total: calculatedTotal.toString(), // Use calculated total, not client-provided
        special_instructions: sanitizedInstructions,
        status: "pending",
        user_id: finalUserId,
      },
    });

    return NextResponse.json(
      {
        ...order,
        total: parseFloat(order.total.toString()),
        items: order.items as OrderItem[],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

