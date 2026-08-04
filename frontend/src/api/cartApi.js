import axiosInstance from './axiosInstance';

export const getCart = async () => {
  const response = await axiosInstance.get('/cart');
  return response.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const response = await axiosInstance.post('/cart', { productId, quantity });
  return response.data;
};

export const updateCartItem = async (productId, quantity) => {
  const response = await axiosInstance.put(`/cart/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await axiosInstance.delete(`/cart/${productId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await axiosInstance.delete('/cart');
  return response.data;
};