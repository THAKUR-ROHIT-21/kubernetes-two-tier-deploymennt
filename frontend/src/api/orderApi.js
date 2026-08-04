import axiosInstance from './axiosInstance';

export const createRazorpayOrder = async (addressId) => {
  const response = await axiosInstance.post('/orders/razorpay', { addressId });
  return response.data;
};

export const verifyPayment = async (paymentData) => {
  const response = await axiosInstance.post('/orders/verify', paymentData);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await axiosInstance.get('/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axiosInstance.get(`/orders/${id}`);
  return response.data;
};

export const getAllOrdersAdmin = async () => {
  const response = await axiosInstance.get('/orders/admin/all');
  return response.data;
};

export const updateOrderStatusAdmin = async (orderId, orderStatus) => {
  const response = await axiosInstance.patch(`/orders/admin/${orderId}/status`, { orderStatus });
  return response.data;
};

export const getSalesAnalytics = async (days = 7) => {
  const response = await axiosInstance.get(`/orders/admin/analytics?days=${days}`);
  return response.data;
};