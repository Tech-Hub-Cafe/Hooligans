export interface Modifier {
  id: string;
  name: string;
  price: number;
  square_id: string;
}

export interface ModifierList {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  modifiers: Modifier[];
  square_id: string;
  required?: boolean; // Whether at least one modifier must be selected
}

export interface MenuItem {
  id: number | string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  available: boolean;
  created_at?: string;
  square_id?: string;
  modifierLists?: ModifierList[];
}

export interface SelectedModifier {
  modifierListId: string;
  modifierListName: string;
  modifierId: string;
  modifierName: string;
  modifierPrice: number;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  modifiers?: SelectedModifier[];
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  special_instructions?: string | null;
  created_at?: string;
}

export interface CartItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: SelectedModifier[];
  basePrice?: number; // Original item price before modifiers
  comment?: string; // Special instructions/notes for this item
}
