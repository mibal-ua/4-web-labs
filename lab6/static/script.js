const API_URL = '';

// Елементи DOM
const elements = {
    form: document.getElementById('technicalCardForm'),
    cardId: document.getElementById('cardId'),
    detailName: document.getElementById('detailName'),
    processingType: document.getElementById('processingType'),
    processingDuration: document.getElementById('processingDuration'),
    submitBtn: document.getElementById('submitBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    formTitle: document.getElementById('formTitle'),
    cardsTableBody: document.getElementById('cardsTableBody'),
    filterType: document.getElementById('filterType'),
    filterMinDuration: document.getElementById('filterMinDuration'),
    filterMaxDuration: document.getElementById('filterMaxDuration'),
    filterDetailName: document.getElementById('filterDetailName'),
    applyFilters: document.getElementById('applyFilters'),
    clearFilters: document.getElementById('clearFilters'),
    totalCards: document.getElementById('totalCards'),
    totalTime: document.getElementById('totalTime'),
    avgTime: document.getElementById('avgTime'),
    processingStats: document.getElementById('processingStats')
};

// Завантаження типів обробки
async function loadProcessingTypes() {
    try {
        const response = await fetch(`${API_URL}/processing-types`);
        const types = await response.json();
        
        // Заповнення випадаючих списків
        elements.processingType.innerHTML = '<option value="">-- Виберіть --</option>';
        elements.filterType.innerHTML = '<option value="">Всі</option>';
        
        types.forEach(type => {
            const option = new Option(type.label, type.value);
            elements.processingType.appendChild(option.cloneNode(true));
            elements.filterType.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading processing types:', error);
    }
}

// Завантаження технічних карт
async function loadTechnicalCards(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.processing_type) params.append('processing_type', filters.processing_type);
        if (filters.min_duration) params.append('min_duration', filters.min_duration);
        if (filters.max_duration) params.append('max_duration', filters.max_duration);
        if (filters.detail_name_contains) params.append('detail_name_contains', filters.detail_name_contains);
        
        const response = await fetch(`${API_URL}/technical-cards?${params}`);
        const cards = await response.json();
        
        displayTechnicalCards(cards);
    } catch (error) {
        console.error('Error loading technical cards:', error);
        elements.cardsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Помилка завантаження</td></tr>';
    }
}

// Відображення технічних карт
function displayTechnicalCards(cards) {
    if (cards.length === 0) {
        elements.cardsTableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Технічні карти не знайдені</td></tr>';
        return;
    }
    
    const typeLabels = {
        "TURNING": "Токарна",
        "MILLING": "Фрезерна",
        "DRILLING": "Свердлільна", 
        "GRINDING": "Шліфувальна",
        "WELDING": "Зварювальна",
        "ASSEMBLY": "Складальна",
        "PAINTING": "Фарбування",
        "THERMAL": "Термічна"
    };
    
    elements.cardsTableBody.innerHTML = cards.map(card => `
        <tr>
            <td>${card.id}</td>
            <td>${escapeHtml(card.detail_name)}</td>
            <td>${typeLabels[card.processing_type] || card.processing_type}</td>
            <td>${card.processing_duration}</td>
            <td>${new Date(card.created_at).toLocaleString('uk-UA')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editCard(${card.id})">Редагувати</button>
                    <button class="btn-delete" onclick="deleteCard(${card.id})">Видалити</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Завантаження статистики
async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        elements.totalCards.textContent = stats.total_cards;
        elements.totalTime.textContent = stats.total_processing_time;
        elements.avgTime.textContent = stats.average_processing_time;
        
        // Статистика по видах обробки
        if (stats.processing_stats.length > 0) {
            const typeLabels = {
                "TURNING": "Токарна",
                "MILLING": "Фрезерна",
                "DRILLING": "Свердлільна", 
                "GRINDING": "Шліфувальна",
                "WELDING": "Зварювальна",
                "ASSEMBLY": "Складальна",
                "PAINTING": "Фарбування",
                "THERMAL": "Термічна"
            };
            
            elements.processingStats.innerHTML = stats.processing_stats.map(stat => `
                <div class="process-stat">
                    <h4>${typeLabels[stat.processing_type] || stat.processing_type}</h4>
                    <p>Кількість: ${stat.count}</p>
                    <p>Загальний час: ${stat.total_duration} хв</p>
                    <p>Середній час: ${stat.average_duration} хв</p>
                </div>
            `).join('');
        } else {
            elements.processingStats.innerHTML = '<p class="empty-state">Немає даних для статистики</p>';
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Обробка форми
elements.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cardData = {
        detail_name: elements.detailName.value,
        processing_type: elements.processingType.value,
        processing_duration: parseInt(elements.processingDuration.value)
    };
    
    try {
        const cardId = elements.cardId.value;
        let response;
        
        if (cardId) {
            // Оновлення
            response = await fetch(`${API_URL}/technical-cards/${cardId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardData)
            });
        } else {
            // Створення
            response = await fetch(`${API_URL}/technical-cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cardData)
            });
        }
        
        if (response.ok) {
            alert(cardId ? 'Технічна карта оновлена!' : 'Технічна карта створена!');
            resetForm();
            loadTechnicalCards();
            loadStatistics();
        } else {
            const error = await response.json();
            alert('Помилка: ' + (error.detail || 'Невідома помилка'));
        }
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
});

// Редагування карти
async function editCard(id) {
    try {
        const response = await fetch(`${API_URL}/technical-cards/${id}`);
        const card = await response.json();
        
        elements.cardId.value = card.id;
        elements.detailName.value = card.detail_name;
        elements.processingType.value = card.processing_type;
        elements.processingDuration.value = card.processing_duration;
        
        elements.formTitle.textContent = '✏️ Редагувати технічну карту';
        elements.submitBtn.textContent = 'Оновити';
        elements.cancelBtn.style.display = 'inline-block';
        
        elements.form.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Помилка завантаження карти');
    }
}

// Видалення карти
async function deleteCard(id) {
    if (!confirm('Ви впевнені, що хочете видалити цю технічну карту?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/technical-cards/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Технічна карта видалена!');
            loadTechnicalCards();
            loadStatistics();
        } else {
            alert('Помилка видалення');
        }
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}

// Скасування редагування
elements.cancelBtn.addEventListener('click', resetForm);

function resetForm() {
    elements.form.reset();
    elements.cardId.value = '';
    elements.formTitle.textContent = '➕ Додати технічну карту';
    elements.submitBtn.textContent = 'Додати';
    elements.cancelBtn.style.display = 'none';
}

// Фільтрація
elements.applyFilters.addEventListener('click', () => {
    const filters = {
        processing_type: elements.filterType.value,
        min_duration: elements.filterMinDuration.value,
        max_duration: elements.filterMaxDuration.value,
        detail_name_contains: elements.filterDetailName.value
    };
    
    loadTechnicalCards(filters);
});

elements.clearFilters.addEventListener('click', () => {
    elements.filterType.value = '';
    elements.filterMinDuration.value = '';
    elements.filterMaxDuration.value = '';
    elements.filterDetailName.value = '';
    loadTechnicalCards();
});

// Утиліта для екранування HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    loadProcessingTypes();
    loadTechnicalCards();
    loadStatistics();
});