import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { z } from 'zod';
import { toast } from 'sonner';
import { Money } from '@/shared/domain/money';
import { type Product, MAX_ORDER_QUANTITY } from '@/modules/catalog/domain/entities/product';
import { Cart } from '../../domain/aggregates/cart';
import { CartItem } from '../../domain/entities/cart-item';

const StoredCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1), sku: z.string(), title: z.string(), publisher: z.string(),
    unitPrice: z.object({ amount: z.number().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) }),
    quantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY),
    imageUrl: z.string().url(),
    maxQuantity: z.number().int().min(1).max(MAX_ORDER_QUANTITY),
  })),
});
type StoredCart = z.infer<typeof StoredCartSchema>;

const inactiveStorage: StateStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
let storageWarningShown = false;
function warnStorage() {
  if (!storageWarningShown) {
    storageWarningShown = true;
    toast.warning('Your cart could not be saved in this browser. Keep this page open until checkout.');
  }
}
const browserStorage: StateStorage = {
  getItem: (name) => { try { return window.localStorage.getItem(name); } catch { warnStorage(); return null; } },
  setItem: (name, value) => { try { window.localStorage.setItem(name, value); } catch { warnStorage(); } },
  removeItem: (name) => { try { window.localStorage.removeItem(name); } catch { warnStorage(); } },
};

export interface CartStore {
  cart: Cart;
  userId: string | null;
  isHydrated: boolean;
  setAccount: (userId: string | null) => Promise<void>;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(persist((set, get) => ({
  cart: Cart.empty(),
  userId: null,
  isHydrated: false,
  setAccount: async (userId) => {
    if (get().userId === userId && get().isHydrated) return;
    // Detach before resetting so neither account's saved basket gets overwritten.
    useCartStore.persist.setOptions({ storage: createJSONStorage<StoredCart>(() => inactiveStorage) });
    set({ cart: Cart.empty(), userId, isHydrated: false });
    if (userId) {
      useCartStore.persist.setOptions({
        name: 'vocamarket:cart:' + userId,
        storage: createJSONStorage<StoredCart>(() => browserStorage),
      });
      await useCartStore.persist.rehydrate();
    }
    if (get().userId === userId) set({ isHydrated: true });
  },
  addItem: (product, quantity = 1) => {
    if (product.isOutOfStock) return;
    const item = CartItem.create({
      productId: product.id, sku: product.sku, title: product.title, publisher: product.publisher,
      unitPrice: product.price, quantity, imageUrl: product.imageUrl, maxQuantity: product.maxOrderQuantity,
    });
    set((state) => ({ cart: state.cart.addItem(item) }));
  },
  updateQuantity: (productId, quantity) => set((state) => ({ cart: state.cart.updateItemQuantity(productId, quantity) })),
  removeItem: (productId) => set((state) => ({ cart: state.cart.removeItem(productId) })),
  clearCart: () => set({ cart: Cart.empty() }),
}), {
  name: 'vocamarket:cart:inactive',
  storage: createJSONStorage<StoredCart>(() => inactiveStorage),
  version: 1,
  skipHydration: true,
  partialize: (state): StoredCart => ({
    items: state.cart.items.map((item) => ({
      productId: item.productId, sku: item.sku, title: item.title, publisher: item.publisher,
      unitPrice: item.unitPrice.toJSON(), quantity: item.quantity, imageUrl: item.imageUrl, maxQuantity: item.maxQuantity,
    })),
  }),
  merge: (saved, current) => {
    if (saved === undefined) return current;
    const snapshot = StoredCartSchema.parse(saved);
    const items = snapshot.items.map((item) => CartItem.create({ ...item, unitPrice: Money.fromJSON(item.unitPrice) }));
    return { ...current, cart: Cart.fromItems(items) };
  },
  migrate: () => {
    toast.warning('Your saved cart uses an older format and has been reset.');
    return { items: [] };
  },
  onRehydrateStorage: () => (_state, error) => {
    if (error) {
      useCartStore.persist.clearStorage();
      toast.warning('Your saved cart could not be restored and has been reset.');
    }
  },
}));
