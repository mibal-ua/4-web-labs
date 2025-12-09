const API_URL = '/api';

let editingProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCategories();
    loadStatistics();
    
    document.getElementById('productForm').addEventListener('submit', handleSubmit);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('applyFilters').addEventListener('click', loadProducts);
});

async function loadProducts() {
    try {
        const category = document.getElementById('categoryFilter').value;
        const minPrice = document.getElementById('minPrice').value;
        const maxPrice = document.getElementById('maxPrice').value;
        const sort = document.getElementById('sortBy').value;
        
        let url = `${API_URL}/products?`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (minPrice) url += `minPrice=${minPrice}&`;
        if (maxPrice) url += `maxPrice=${maxPrice}&`;
        if (sort) url += `sort=${sort}`;
        
        const response = await fetch(url);
        const products = await response.json();
        
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Помилка завантаження продуктів');
    }
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state">Продукти не знайдені</div>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description || 'Без опису'}</p>
                <p><strong>Категорія:</strong> ${product.category}</p>
                <p><strong>Кількість:</strong> ${product.quantity}</p>
                <p class="price">₴${product.price.toFixed(2)}</p>
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct('${product._id}')">Редагувати</button>
                <button class="btn-delete" onclick="deleteProduct('${product._id}')">Видалити</button>
            </div>
        </div>
    `).join('');
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        const datalist = document.getElementById('categoryList');
        datalist.innerHTML = categories.map(cat => `<option value="${cat}">`).join('');
        
        const filter = document.getElementById('categoryFilter');
        filter.innerHTML = '<option value="">Всі категорії</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/statistics`);
        const stats = await response.json();
        
        document.getElementById('totalProducts').textContent = stats.total.totalProducts || 0;
        document.getElementById('totalQuantity').textContent = stats.total.totalQuantity || 0;
        document.getElementById('totalValue').textContent = `₴${(stats.total.totalValue || 0).toFixed(2)}`;
        
        const categoryStatsContainer = document.getElementById('categoryStats');
        if (stats.byCategory.length === 0) {
            categoryStatsContainer.innerHTML = '<div class="empty-state">Немає даних для відображення</div>';
            return;
        }
        
        categoryStatsContainer.innerHTML = `
            <div class="category-stat-item" style="font-weight: bold; border-bottom: 2px solid #ccc;">
                <h4>Категорія</h4>
                <p>Кількість</p>
                <p>Середня ціна</p>
                <p>Загальна вартість</p>
            </div>
        ` + stats.byCategory.map(cat => `
            <div class="category-stat-item">
                <h4>${cat.category}</h4>
                <p>${cat.count}</p>
                <p>₴${cat.avgPrice.toFixed(2)}</p>
                <p>₴${cat.totalValue.toFixed(2)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        quantity: parseInt(document.getElementById('quantity').value)
    };
    
    try {
        let response;
        if (editingProductId) {
            response = await fetch(`${API_URL}/products/${editingProductId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Помилка збереження');
        }
        
        alert(editingProductId ? 'Продукт оновлено!' : 'Продукт додано!');
        cancelEdit();
        loadProducts();
        loadCategories();
        loadStatistics();
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}

async function editProduct(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const product = await response.json();
        
        document.getElementById('productId').value = product._id;
        document.getElementById('name').value = product.name;
        document.getElementById('description').value = product.description || '';
        document.getElementById('category').value = product.category;
        document.getElementById('price').value = product.price;
        document.getElementById('quantity').value = product.quantity;
        
        editingProductId = id;
        document.getElementById('submitBtn').textContent = 'Оновити продукт';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Помилка завантаження продукту');
    }
}

function cancelEdit() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    editingProductId = null;
    document.getElementById('submitBtn').textContent = 'Додати продукт';
    document.getElementById('cancelBtn').style.display = 'none';
}

async function deleteProduct(id) {
    if (!confirm('Ви впевнені, що хочете видалити цей продукт?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Помилка видалення');
        }
        
        alert('Продукт видалено!');
        loadProducts();
        loadCategories();
        loadStatistics();
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}