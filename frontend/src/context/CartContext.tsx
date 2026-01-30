'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  stock: number;
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

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  email?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  deliveryMethod: DeliveryMethod | null;
  subtotal: number;
  deliveryCost: number;
  shippingAddress: ShippingAddress | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'SET_DELIVERY_METHOD'; payload: DeliveryMethod }
  | { type: 'SET_SHIPPING_ADDRESS'; payload: ShippingAddress | null }
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
      const { quantity = 1, ...product } = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = state.items.map(item => {
          if (item.id === product.id) {
            const newQuantity = Math.min(item.quantity + quantity, item.stock);
            return { ...item, quantity: newQuantity };
          }
          return item;
        });
      } else {
        const newItem: CartItem = { ...product, quantity: Math.min(quantity, product.stock) };
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
      const updatedItems = state.items.map(item => {
        if (item.id === action.payload.id) {
          const newQuantity = Math.min(action.payload.quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);

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
    case 'SET_SHIPPING_ADDRESS': {
      return {
        ...state,
        shippingAddress: action.payload,
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        deliveryMethod: null,
        subtotal: 0,
        deliveryCost: 0,
        total: 0,
        shippingAddress: null,
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
    shippingAddress: null,
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