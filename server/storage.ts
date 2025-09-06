import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  type User,
  type UpsertUser,
  type Product,
  type ProductWithSeller,
  type InsertProduct,
  type CartItem,
  type CartItemWithProduct,
  type InsertCartItem,
  type Order,
  type OrderWithItems,
  type InsertOrder,
  type InsertOrderItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  getProducts(): Promise<ProductWithSeller[]>;
  getProductById(id: string): Promise<ProductWithSeller | undefined>;
  getProductsByCategory(category: string): Promise<ProductWithSeller[]>;
  getProductsBySeller(sellerId: string): Promise<ProductWithSeller[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder, orderItems: InsertOrderItem[]): Promise<Order>;
  getOrdersByUser(userId: string): Promise<OrderWithItems[]>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async getProducts(): Promise<ProductWithSeller[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt))
      .then(rows => rows.map(row => ({
        ...row.products,
        seller: row.users!
      })));
  }

  async getProductById(id: string): Promise<ProductWithSeller | undefined> {
    const rows = await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(and(eq(products.id, id), eq(products.isActive, true)));
    
    if (rows.length === 0) return undefined;
    
    return {
      ...rows[0].products,
      seller: rows[0].users!
    };
  }

  async getProductsByCategory(category: string): Promise<ProductWithSeller[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(and(eq(products.category, category), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .then(rows => rows.map(row => ({
        ...row.products,
        seller: row.users!
      })));
  }

  async getProductsBySeller(sellerId: string): Promise<ProductWithSeller[]> {
    return await db
      .select()
      .from(products)
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(products.createdAt))
      .then(rows => rows.map(row => ({
        ...row.products,
        seller: row.users!
      })));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(users, eq(products.sellerId, users.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt))
      .then(rows => rows.map(row => ({
        ...row.cart_items,
        product: {
          ...row.products!,
          seller: row.users!
        }
      })));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, cartItem.userId),
        eq(cartItems.productId, cartItem.productId)
      ));

    if (existing.length > 0) {
      // Update quantity
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + (cartItem.quantity ?? 1) })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new cart item
      const [newCartItem] = await db
        .insert(cartItems)
        .values(cartItem)
        .returning();
      return newCartItem;
    }
  }

  async updateCartItemQuantity(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
    return (result.rowCount ?? 0) >= 0;
  }

  // Order operations
  async createOrder(order: InsertOrder, orderItemsData: InsertOrderItem[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values(order)
        .returning();

      await tx
        .insert(orderItems)
        .values(orderItemsData.map(item => ({ ...item, orderId: newOrder.id })));

      return newOrder;
    });
  }

  async getOrdersByUser(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items.map(item => ({
            ...item.order_items,
            product: item.products!
          }))
        };
      })
    );

    return ordersWithItems;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ deliveryStatus: status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
