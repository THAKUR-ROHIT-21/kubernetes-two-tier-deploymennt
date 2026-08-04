import axiosInstance from './axiosInstance';

export const getAddresses = async () => {
  const response = await axiosInstance.get('/addresses');
  return response.data;
};

export const createAddress = async (data) => {
  const response = await axiosInstance.post('/addresses', data);
  return response.data;
};

export const updateAddress = async (id, data) => {
  const response = await axiosInstance.put(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await axiosInstance.delete(`/addresses/${id}`);
  return response.data;
};

export const setDefaultAddress = async (id) => {
  const response = await axiosInstance.patch(`/addresses/${id}/default`);
  return response.data;
};