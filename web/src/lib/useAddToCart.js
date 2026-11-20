import { useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { useAuth, useCart, useToast } from '../store.jsx';

export function useAddToCart() {
  const { user } = useAuth();
  const { setCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  return async (product, { quantity = 1, color } = {}) => {
    if (!user) {
      toast('Entre na sua conta para adicionar ao carrinho.', 'info');
      navigate(`/login?voltar=${encodeURIComponent(`/produto/${product.id}`)}`);
      return false;
    }
    try {
      const cart = await api('/cart/items', { method: 'POST', body: { productId: product.id, quantity, color } });
      setCart(cart);
      toast(`${product.name} adicionado ao carrinho.`);
      return true;
    } catch (err) {
      toast(err.message, 'error');
      return false;
    }
  };
}
