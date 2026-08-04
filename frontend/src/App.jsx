import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AddProduct from './pages/ProductManagement';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Addresses from './pages/Addresses';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AllOrders from './pages/AllOrders';
import NotFound from './pages/NotFound';

function App() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthProvider>
      <CartProvider>
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <Routes>
          <Route path="/" element={<Home searchQuery={searchQuery} />} />
          <Route path="/products" element={<Home searchQuery={searchQuery} />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/manage-product" element={<AddProduct />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/orders" element={<AllOrders />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;