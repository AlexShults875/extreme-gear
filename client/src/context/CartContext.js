import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { cartApi } from '../api';
import { useAuth } from '../AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadCart = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setCartItems([]);
            return;
        }
        setLoading(true);
        try {
            const items = await cartApi.getCart();
            setCartItems(items);
        } catch (err) {
            console.error('Failed to load cart', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, token]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const addToCart = async (product, quantity = 1) => {
        if (!isAuthenticated) return;
        try {
            const updatedCart = await cartApi.addToCart(product.id, quantity);
            setCartItems(updatedCart);
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const removeFromCart = async (productId) => {
        if (!isAuthenticated) return;
        try {
            const updatedCart = await cartApi.removeFromCart(productId);
            setCartItems(updatedCart);
        } catch (err) {
            console.error(err);
        }
    };

    const updateQuantity = async (productId, amount) => {
        if (!isAuthenticated) return;
        const currentItem = cartItems.find(item => item.id === productId);
        if (!currentItem) return;
        const newQuantity = currentItem.quantity + amount;
        if (newQuantity < 1) return;
        try {
            const updatedCart = await cartApi.updateCartItem(productId, newQuantity);
            setCartItems(updatedCart);
        } catch (err) {
            console.error(err);
        }
    };

    const clearCart = async () => {
        if (!isAuthenticated) return;
        try {
            await cartApi.clearCart();
            setCartItems([]);
        } catch (err) {
            console.error(err);
        }
    };

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
