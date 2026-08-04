import axiosInstance from './axiosInstance';

// naya product create karta hai
export const createProduct = async (productData) => {
  const response = await axiosInstance.post('/products', productData);
  return response.data;
};

// saare products fetch karta hai
export const getProducts = async () => {
  const response = await axiosInstance.get('/products');
  return response.data;
};

// bulk create multiple products from a JSON array
export const bulkCreateProducts = async (productsArray) => {
  const response = await axiosInstance.post('/products/bulk', { products: productsArray });
  return response.data;
};

// fetches a single product by its MongoDB _id
export const getProductById = async (id) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};