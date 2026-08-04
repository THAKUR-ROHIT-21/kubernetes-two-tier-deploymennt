import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as cartApi from '../api/cartApi';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState(new Set());

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart({ items: [] });
    }
  }, [user]);

  const refreshCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cartApi.getCart();
      setCart(data.cart);
    } catch (err) {
      setCart({ items: [] });
    } finally {
      setLoading(false);
    }
  };

  const setItemPending = (productId, isPendingNow) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      isPendingNow ? next.add(productId) : next.delete(productId);
      return next;
    });
  };

  const isPending = useCallback((productId) => pendingIds.has(productId), [pendingIds]);

  const addItem = async (productId, quantity = 1) => {
    setError('');
    try {
      const data = await cartApi.addToCart(productId, quantity);
      setCart(data.cart);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not add to cart';
      setError(message);
      throw err;
    }
  };

  const updateItem = async (productId, quantity) => {
    setError('');
    setItemPending(productId, true);
    try {
      const data = await cartApi.updateCartItem(productId, quantity);
      setCart(data.cart);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update quantity');
      return { success: false };
    } finally {
      setItemPending(productId, false);
    }
  };

  const removeItem = async (productId) => {
    setError('');
    setItemPending(productId, true);
    try {
      const data = await cartApi.removeFromCart(productId);
      setCart(data.cart);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove item');
      return { success: false };
    } finally {
      setItemPending(productId, false);
    }
  };

  const empty = async () => {
    setError('');
    try {
      const data = await cartApi.clearCart();
      setCart(data.cart);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not clear cart');
    }
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = cart.items.reduce((sum, item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        itemCount,
        totalPrice,
        isPending,
        addItem,
        updateItem,
        removeItem,
        empty,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}