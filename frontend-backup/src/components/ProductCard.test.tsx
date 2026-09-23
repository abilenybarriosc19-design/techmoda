import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import { mockProduct } from '../test/mockData';

describe('ProductCard Component', () => {
  describe('Rendering', () => {
    it('should render product information correctly', () => {
      render(<ProductCard product={mockProduct} />);

      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
      expect(screen.getByText(`$${mockProduct.price.toFixed(2)}`)).toBeInTheDocument();
      expect(screen.getByText(mockProduct.category)).toBeInTheDocument();
      expect(screen.getByText(`${mockProduct.stock} disponibles`)).toBeInTheDocument();
    });

    it('should render product image with correct src and alt', () => {
      render(<ProductCard product={mockProduct} />);

      const img = screen.getByRole('img', { name: mockProduct.name });
      expect(img).toHaveAttribute('src', mockProduct.imageUrl);
      expect(img).toHaveAttribute('alt', mockProduct.name);
    });

    it('should format price with two decimal places', () => {
      const productWithPrice = { ...mockProduct, price: 49.9 };
      render(<ProductCard product={productWithPrice} />);

      expect(screen.getByText('$49.90')).toBeInTheDocument();
    });
  });

  describe('Customer Mode (isAdmin=false)', () => {
    it('should show "Agregar al Carrito" button when stock is available', () => {
      render(<ProductCard product={mockProduct} isAdmin={false} />);

      const button = screen.getByRole('button', { name: /agregar al carrito/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    it('should show "Agotado" button when stock is zero', () => {
      const outOfStockProduct = { ...mockProduct, stock: 0 };
      render(<ProductCard product={outOfStockProduct} isAdmin={false} />);

      const button = screen.getByRole('button', { name: /agotado/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should not show edit and delete buttons in customer mode', () => {
      render(<ProductCard product={mockProduct} isAdmin={false} />);

      expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
    });
  });

  describe('Admin Mode (isAdmin=true)', () => {
    it('should show edit and delete buttons', () => {
      render(<ProductCard product={mockProduct} isAdmin={true} />);

      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });

    it('should not show "Agregar al Carrito" button in admin mode', () => {
      render(<ProductCard product={mockProduct} isAdmin={true} />);

      expect(screen.queryByRole('button', { name: /agregar al carrito/i })).not.toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(
        <ProductCard
          product={mockProduct}
          isAdmin={true}
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(mockProduct);
    });

    it('should call onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <ProductCard
          product={mockProduct}
          isAdmin={true}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(mockProduct.productId);
    });

    it('should not call onEdit if callback is not provided', async () => {
      const user = userEvent.setup();

      render(<ProductCard product={mockProduct} isAdmin={true} />);

      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Should not throw error
      expect(editButton).toBeInTheDocument();
    });

    it('should not call onDelete if callback is not provided', async () => {
      const user = userEvent.setup();

      render(<ProductCard product={mockProduct} isAdmin={true} />);

      const deleteButton = screen.getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      // Should not throw error
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Stock Display', () => {
    it('should display correct stock count', () => {
      render(<ProductCard product={mockProduct} />);

      expect(screen.getByText('25 disponibles')).toBeInTheDocument();
    });

    it('should display zero stock correctly', () => {
      const zeroStockProduct = { ...mockProduct, stock: 0 };
      render(<ProductCard product={zeroStockProduct} />);

      expect(screen.getByText('0 disponibles')).toBeInTheDocument();
    });

    it('should display single item stock correctly', () => {
      const singleStockProduct = { ...mockProduct, stock: 1 };
      render(<ProductCard product={singleStockProduct} />);

      expect(screen.getByText('1 disponibles')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for image', () => {
      render(<ProductCard product={mockProduct} />);

      const img = screen.getByAltText(mockProduct.name);
      expect(img).toBeInTheDocument();
    });

    it('should have accessible buttons with proper labels', () => {
      render(<ProductCard product={mockProduct} isAdmin={true} />);

      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
    });
  });

  describe('Category Badge', () => {
    it('should display category for Ropa', () => {
      const ropaProduct = { ...mockProduct, category: 'Ropa' };
      render(<ProductCard product={ropaProduct} />);

      expect(screen.getByText('Ropa')).toBeInTheDocument();
    });

    it('should display category for Zapatos', () => {
      const zapatosProduct = { ...mockProduct, category: 'Zapatos' };
      render(<ProductCard product={zapatosProduct} />);

      expect(screen.getByText('Zapatos')).toBeInTheDocument();
    });

    it('should display category for Accesorios', () => {
      const accesoriosProduct = { ...mockProduct, category: 'Accesorios' };
      render(<ProductCard product={accesoriosProduct} />);

      expect(screen.getByText('Accesorios')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long product names', () => {
      const longNameProduct = {
        ...mockProduct,
        name: 'Producto con un nombre extremadamente largo que debería ser truncado correctamente',
      };
      render(<ProductCard product={longNameProduct} />);

      expect(screen.getByText(longNameProduct.name)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescProduct = {
        ...mockProduct,
        description:
          'Esta es una descripción muy larga del producto que contiene mucha información detallada que podría no caber en el espacio asignado y debería ser manejada correctamente por el componente',
      };
      render(<ProductCard product={longDescProduct} />);

      expect(screen.getByText(longDescProduct.description)).toBeInTheDocument();
    });

    it('should handle large prices correctly', () => {
      const expensiveProduct = { ...mockProduct, price: 9999.99 };
      render(<ProductCard product={expensiveProduct} />);

      expect(screen.getByText('$9999.99')).toBeInTheDocument();
    });

    it('should handle prices with many decimals', () => {
      const preciseProduct = { ...mockProduct, price: 49.999999 };
      render(<ProductCard product={preciseProduct} />);

      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });
  });
});
