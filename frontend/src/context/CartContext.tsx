'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SourcingType } from '@/types/product';

interface Product {
  id: number;
  name: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image?: string;
  stock: number;
  sourcingType?: SourcingType;
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
  neighborhood: string;
  phone: string;
  email?: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  description: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  deliveryMethod: DeliveryMethod | null;
  subtotal: number;
  deliveryCost: number;
  discountAmount: number;
  coupon: AppliedCoupon | null;
  shippingAddress: ShippingAddress | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Product & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { id: number; quantity: number } }
  | { type: 'SET_DELIVERY_METHOD'; payload: DeliveryMethod }
  | { type: 'SET_SHIPPING_ADDRESS'; payload: ShippingAddress | null }
  | { type: 'APPLY_COUPON'; payload: AppliedCoupon }
  | { type: 'REMOVE_COUPON' }
  | { type: 'CLEAR_CART' }
  | { type: 'RESTORE_CART'; payload: CartState };

const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 50000;

const calculateTotals = (
  items: CartItem[],
  deliveryMethod: DeliveryMethod | null,
  coupon: AppliedCoupon | null = null
) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discountAmount = Math.round(subtotal * (coupon.value / 100));
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === 'free_shipping') {
      discountAmount = 0;
    }
  }

  let deliveryCost = deliveryMethod?.cost || 0;
  const isFreeShipping =
    (subtotal >= FREE_SHIPPING_THRESHOLD || coupon?.type === 'free_shipping') &&
    deliveryMethod?.id !== 'pickup';

  if (isFreeShipping) {
    deliveryCost = 0;
  }

  const total = Math.max(0, subtotal - discountAmount + deliveryCost);
  return { subtotal, deliveryCost, discountAmount, total };
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

      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        updatedItems,
        state.deliveryMethod,
        state.coupon
      );
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        discountAmount,
        total,
      };
    }
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload);
      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        updatedItems,
        state.deliveryMethod,
        state.coupon
      );
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        discountAmount,
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

      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        updatedItems,
        state.deliveryMethod,
        state.coupon
      );
      return {
        ...state,
        items: updatedItems,
        subtotal,
        deliveryCost,
        discountAmount,
        total,
      };
    }
    case 'SET_DELIVERY_METHOD': {
      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        state.items,
        action.payload,
        state.coupon
      );
      return {
        ...state,
        deliveryMethod: action.payload,
        subtotal,
        deliveryCost,
        discountAmount,
        total,
      };
    }
    case 'SET_SHIPPING_ADDRESS': {
      return {
        ...state,
        shippingAddress: action.payload,
      };
    }
    case 'APPLY_COUPON': {
      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        state.items,
        state.deliveryMethod,
        action.payload
      );
      return {
        ...state,
        coupon: action.payload,
        subtotal,
        deliveryCost,
        discountAmount,
        total,
      };
    }
    case 'REMOVE_COUPON': {
      const { subtotal, deliveryCost, discountAmount, total } = calculateTotals(
        state.items,
        state.deliveryMethod,
        null
      );
      return {
        ...state,
        coupon: null,
        subtotal,
        deliveryCost,
        discountAmount,
        total,
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        deliveryMethod: null,
        subtotal: 0,
        deliveryCost: 0,
        discountAmount: 0,
        coupon: null,
        total: 0,
        shippingAddress: null,
      };
    case 'RESTORE_CART':
      return action.payload;
    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    deliveryMethod: null,
    subtotal: 0,
    deliveryCost: 0,
    discountAmount: 0,
    coupon: null,
    total: 0,
    shippingAddress: null,
  });

  // Load cart from localStorage on mount & auto-apply Instagram welcome promo (Story 7.4)
  useEffect(() => {
    const savedCart = localStorage.getItem('prana-cart');
    let hasRestoredCoupon = false;

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'RESTORE_CART', payload: parsedCart });
        if (parsedCart.coupon) hasRestoredCoupon = true;
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const promoParam = params.get('promo') || (params.get('utm_source') === 'instagram' ? 'BIENVENIDA10' : null);
      if (promoParam && promoParam.toUpperCase() === 'BIENVENIDA10' && !hasRestoredCoupon) {
        dispatch({
          type: 'APPLY_COUPON',
          payload: {
            code: 'BIENVENIDA10',
            type: 'percentage',
            value: 10,
            description: 'Incentivo de Bienvenida Instagram 10%',
          },
        });
      }
    }
  }, []);

  // Save cart to localStorage on state change
  useEffect(() => {
    localStorage.setItem('prana-cart', JSON.stringify(state));
  }, [state]);

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