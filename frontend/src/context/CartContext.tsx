'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryMethod {
  id: string;
  name: string;
  cost: number;
  description: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  deliveryMethod: DeliveryMethod | null;
  subtotal: number;
  deliveryCost: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'SET_DELIVERY_METHOD'; payload: DeliveryMethod }
  | { type: 'CLEAR_CART' };

const calculateTotals = (items: CartItem[], deliveryMethod: DeliveryMethod | null) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryCost = deliveryMethod?.cost || 0;
  const total = subtotal + deliveryCost;
  return { subtotal, deliveryCost, total };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem: CartItem = { ...action.payload, quantity: 1 };
        updatedItems = [...state.items, newItem];
      }

      const { subtotal, deliveryCost, total } = calculateTotals(updatedItems, state.deliveryMethod);
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        total,
      };
    }
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const { subtotal, deliveryCost, total } = calculateTotals(updatedItems, state.deliveryMethod);
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        total,
      };
    }
    case 'UPDATE_QUANTITY': {
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

      const { subtotal, deliveryCost, total } = calculateTotals(updatedItems, state.deliveryMethod);
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        total,
      };
    }
    case 'SET_DELIVERY_METHOD': {
      const { subtotal, deliveryCost, total } = calculateTotals(state.items, action.payload);
      return {
        ...state,
        deliveryMethod: action.payload,
        subtotal,
        deliveryCost,
        total,
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        deliveryMethod: null,
        subtotal: 0,
        deliveryCost: 0,
        total: 0,
      };
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    deliveryMethod: null,
    subtotal: 0,
    deliveryCost: 0,
    total: 0,
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};