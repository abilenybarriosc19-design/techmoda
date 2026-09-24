import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductModal } from './ProductModal';
import { mockProduct, mockProductInput } from '../test/mockData';

describe('ProductModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<ProductModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /nuevo producto/i })).toBeInTheDocument();
    });

    it('should show "Nuevo Producto" title when creating', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByText('Nuevo Producto')).toBeInTheDocument();
    });

    it('should show "Editar Producto" title when editing', () => {
      render(<ProductModal {...defaultProps} product={mockProduct} />);

      expect(screen.getByText('Editar Producto')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stock/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url de imagen/i)).toBeInTheDocument();
    });

    it('should render cancel and submit buttons', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
    });

    it('should show "Actualizar" button when editing', () => {
      render(<ProductModal {...defaultProps} product={mockProduct} />);

      expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
    });
  });

  describe('Form Initialization', () => {
    it('should initialize with empty form for new product', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue('');
      expect(screen.getByLabelText(/descripción/i)).toHaveValue('');
      expect(screen.getByLabelText(/precio/i)).toHaveValue(null);
      expect(screen.getByLabelText(/stock/i)).toHaveValue(null);
      expect(screen.getByLabelText(/categoría/i)).toHaveValue('Ropa');
      expect(screen.getByLabelText(/url de imagen/i)).toHaveValue('');
    });

    it('should initialize with product data when editing', () => {
      render(<ProductModal {...defaultProps} product={mockProduct} />);

      expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue(mockProduct.name);
      expect(screen.getByLabelText(/descripción/i)).toHaveValue(mockProduct.description);
      expect(screen.getByLabelText(/precio/i)).toHaveValue(mockProduct.price);
      expect(screen.getByLabelText(/stock/i)).toHaveValue(mockProduct.stock);
      expect(screen.getByLabelText(/categoría/i)).toHaveValue(mockProduct.category);
      expect(screen.getByLabelText(/url de imagen/i)).toHaveValue(mockProduct.imageUrl);
    });

    it('should reset form when modal is reopened', async () => {
      const { rerender } = render(<ProductModal {...defaultProps} isOpen={false} />);

      // Open with product
      rerender(<ProductModal {...defaultProps} isOpen={true} product={mockProduct} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue(mockProduct.name);
      });

      // Close and reopen without product
      rerender(<ProductModal {...defaultProps} isOpen={false} />);
      rerender(<ProductModal {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre del producto/i)).toHaveValue('');
      });
    });
  });

  describe('Form Interaction', () => {
    it('should update name field when typing', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/nombre del producto/i);
      await user.type(nameInput, 'Nueva Camisa');

      expect(nameInput).toHaveValue('Nueva Camisa');
    });

    it('should update description field when typing', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const descInput = screen.getByLabelText(/descripción/i);
      await user.type(descInput, 'Descripción de prueba');

      expect(descInput).toHaveValue('Descripción de prueba');
    });

    it('should update price field when typing', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const priceInput = screen.getByLabelText(/precio/i);
      await user.type(priceInput, '49.99');

      expect(priceInput).toHaveValue(49.99);
    });

    it('should update stock field when typing', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const stockInput = screen.getByLabelText(/stock/i);
      await user.type(stockInput, '25');

      expect(stockInput).toHaveValue(25);
    });

    it('should change category when selecting different option', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/categoría/i);
      await user.selectOptions(categorySelect, 'Zapatos');

      expect(categorySelect).toHaveValue('Zapatos');
    });

    it('should update image URL field when typing', async () => {
      const user = userEvent.setup();
      render(<ProductModal {...defaultProps} />);

      const imageInput = screen.getByLabelText(/url de imagen/i);
      await user.type(imageInput, 'https://example.com/image.jpg');

      expect(imageInput).toHaveValue('https://example.com/image.jpg');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave and onClose when submitting valid form', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      const onClose = vi.fn();

      render(<ProductModal {...defaultProps} onSave={onSave} onClose={onClose} />);

      // Fill in all required fields
      await user.type(screen.getByLabelText(/nombre del producto/i), mockProductInput.name);
      await user.type(screen.getByLabelText(/descripción/i), mockProductInput.description);
      await user.type(screen.getByLabelText(/precio/i), mockProductInput.price.toString());
      await user.type(screen.getByLabelText(/stock/i), mockProductInput.stock.toString());
      await user.type(screen.getByLabelText(/url de imagen/i), mockProductInput.imageUrl);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /crear/i });
      await user.click(submitButton);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith(mockProductInput);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should convert string values to numbers when submitting', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<ProductModal {...defaultProps} onSave={onSave} />);

      await user.type(screen.getByLabelText(/nombre del producto/i), 'Test Product');
      await user.type(screen.getByLabelText(/descripción/i), 'Test Description');
      await user.type(screen.getByLabelText(/precio/i), '99.99');
      await user.type(screen.getByLabelText(/stock/i), '50');
      await user.type(screen.getByLabelText(/url de imagen/i), 'https://example.com/test.jpg');

      const submitButton = screen.getByRole('button', { name: /crear/i });
      await user.click(submitButton);

      expect(onSave).toHaveBeenCalledWith({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        stock: 50,
        category: 'Ropa',
        imageUrl: 'https://example.com/test.jpg',
      });
    });

    it('should submit updated product data when editing', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<ProductModal {...defaultProps} product={mockProduct} onSave={onSave} />);

      // Update price
      const priceInput = screen.getByLabelText(/precio/i);
      await user.clear(priceInput);
      await user.type(priceInput, '59.99');

      const submitButton = screen.getByRole('button', { name: /actualizar/i });
      await user.click(submitButton);

      expect(onSave).toHaveBeenCalledWith({
        name: mockProduct.name,
        description: mockProduct.description,
        price: 59.99,
        stock: mockProduct.stock,
        category: mockProduct.category,
        imageUrl: mockProduct.imageUrl,
      });
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      userEvent.setup();
      const onSave = vi.fn();

      render(<ProductModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByLabelText(/nombre del producto/i);
      expect(nameInput).toBeRequired();
    });

    it('should require description field', () => {
      render(<ProductModal {...defaultProps} />);

      const descInput = screen.getByLabelText(/descripción/i);
      expect(descInput).toBeRequired();
    });

    it('should require price field', () => {
      render(<ProductModal {...defaultProps} />);

      const priceInput = screen.getByLabelText(/precio/i);
      expect(priceInput).toBeRequired();
    });

    it('should require stock field', () => {
      render(<ProductModal {...defaultProps} />);

      const stockInput = screen.getByLabelText(/stock/i);
      expect(stockInput).toBeRequired();
    });

    it('should require image URL field', () => {
      render(<ProductModal {...defaultProps} />);

      const imageInput = screen.getByLabelText(/url de imagen/i);
      expect(imageInput).toBeRequired();
    });

    it('should accept valid URL format', () => {
      render(<ProductModal {...defaultProps} />);

      const imageInput = screen.getByLabelText(/url de imagen/i);
      expect(imageInput).toHaveAttribute('type', 'url');
    });

    it('should enforce minimum price of 0', () => {
      render(<ProductModal {...defaultProps} />);

      const priceInput = screen.getByLabelText(/precio/i);
      expect(priceInput).toHaveAttribute('min', '0');
    });

    it('should enforce minimum stock of 0', () => {
      render(<ProductModal {...defaultProps} />);

      const stockInput = screen.getByLabelText(/stock/i);
      expect(stockInput).toHaveAttribute('min', '0');
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ProductModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ProductModal {...defaultProps} onClose={onClose} />);

      // The X button (close icon)
      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (xButton) {
        await user.click(xButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onSave when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();

      render(<ProductModal {...defaultProps} onSave={onSave} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Category Options', () => {
    it('should have Ropa category option', () => {
      render(<ProductModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/categoría/i);
      expect(categorySelect).toContainHTML('<option value="Ropa">Ropa</option>');
    });

    it('should have Zapatos category option', () => {
      render(<ProductModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/categoría/i);
      expect(categorySelect).toContainHTML('<option value="Zapatos">Zapatos</option>');
    });

    it('should have Accesorios category option', () => {
      render(<ProductModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText(/categoría/i);
      expect(categorySelect).toContainHTML('<option value="Accesorios">Accesorios</option>');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByLabelText(/nombre del producto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/stock/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url de imagen/i)).toBeInTheDocument();
    });

    it('should have proper heading structure', () => {
      render(<ProductModal {...defaultProps} />);

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });
});
