import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import './styles.css';
import { AuthProvider, CartProvider, ToastProvider } from './store.jsx';
import { Layout } from './components/Layout.jsx';
import { RequireAuth } from './components/ui.jsx';
import { Catalog } from './pages/Catalog.jsx';
import { Product } from './pages/Product.jsx';
import { Cart } from './pages/Cart.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { OrderDetail, Orders } from './pages/Orders.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { AdminProductForm, AdminProducts } from './pages/admin/AdminProducts.jsx';
import { Playground } from './pages/Playground.jsx';
import { NotFound } from './pages/NotFound.jsx';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Catalog /> },
      { path: '/produto/:id', element: <Product /> },
      { path: '/carrinho', element: <Cart /> },
      { path: '/checkout', element: <RequireAuth><Checkout /></RequireAuth> },
      { path: '/pedidos', element: <RequireAuth><Orders /></RequireAuth> },
      { path: '/pedidos/:id', element: <RequireAuth><OrderDetail /></RequireAuth> },
      { path: '/login', element: <Login /> },
      { path: '/cadastro', element: <Register /> },
      { path: '/admin/produtos', element: <RequireAuth role="admin"><AdminProducts /></RequireAuth> },
      { path: '/admin/produtos/novo', element: <RequireAuth role="admin"><AdminProductForm /></RequireAuth> },
      { path: '/admin/produtos/:id', element: <RequireAuth role="admin"><AdminProductForm /></RequireAuth> },
      { path: '/playground', element: <Playground /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>
);
