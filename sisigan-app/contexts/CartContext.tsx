import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem } from '@/services/menu';

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: MenuItem, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        return prevItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prevItems, { ...item, quantity }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCartItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems((prevItems) =>
        prevItems.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return total + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
