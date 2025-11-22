document.addEventListener('DOMContentLoaded', () => {
    // Pantry Elements
    const itemNameInput = document.getElementById('item-name');
    const itemQuantityInput = document.getElementById('item-quantity');
    const itemUnitInput = document.getElementById('item-unit');
    const itemCategoryInput = document.getElementById('item-category');
    const addBtn = document.getElementById('add-btn');
    const pantryList = document.getElementById('pantry-list');

    // Shopping List Elements
    const shoppingListItemsContainer = document.getElementById('shopping-list-items');
    const clearListBtn = document.getElementById('clear-list-btn');

    // Recipe Elements
    const recipeSelect = document.getElementById('recipe-select');
    const checkRecipeBtn = document.getElementById('check-recipe-btn');
    const cookRecipeBtn = document.getElementById('cook-recipe-btn');
    const editRecipeBtn = document.getElementById('edit-recipe-btn');
    const newRecipeBtn = document.getElementById('new-recipe-btn');
    const recipeModal = document.getElementById('recipe-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const saveRecipeBtn = document.getElementById('save-recipe-btn');
    const addIngredientRowBtn = document.getElementById('add-ingredient-row-btn');
    const recipeIngredientsList = document.getElementById('recipe-ingredients-list');
    const newRecipeNameInput = document.getElementById('new-recipe-name');
    const recipeCategorySelect = document.getElementById('recipe-category');
    const generateInspirationBtn = document.getElementById('generate-inspiration-btn');
    const inspirationResult = document.getElementById('inspiration-result');
    const inspirationDish = document.getElementById('inspiration-dish');
    const inspirationDescription = document.getElementById('inspiration-description');
    let editingRecipeId = null;

    // State
    let pantryItems = JSON.parse(localStorage.getItem('pantryItems')) || [];
    let shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
    let recipes = JSON.parse(localStorage.getItem('recipes')) || [
        {
            id: 1,
            name: 'Bolognai spagetti',
            category: 'Tésztás ételek',
            ingredients: [
                { name: 'Spagetti tészta', quantity: 0.5, unit: 'kg' },
                { name: 'Sertés darálthús', quantity: 0.5, unit: 'kg' },
                { name: 'Hagyma', quantity: 1, unit: 'fej' },
                { name: 'Bolognai por', quantity: 2, unit: 'db' },
                { name: 'Olaj', quantity: 0.1, unit: 'l' },
                { name: 'Olasz fűszerek', quantity: 1, unit: 'csomag' }
            ]
        }
    ];

    // Initialize
    renderItems();
    renderShoppingList();
    renderRecipeSelect();
    updateCategoryDatalist(); // Initialize datalist

    // Event Listeners
    addBtn.addEventListener('click', addItem);
    itemNameInput.addEventListener('input', suggestCategory); // Add suggestion listener
    clearListBtn.addEventListener('click', clearShoppingList);

    // Recipe Event Listeners
    checkRecipeBtn.addEventListener('click', checkRecipe);
    cookRecipeBtn.addEventListener('click', cookRecipe);
    editRecipeBtn.addEventListener('click', editRecipe);
    newRecipeBtn.addEventListener('click', openRecipeModal);
    closeModalBtn.addEventListener('click', closeRecipeModal);
    addIngredientRowBtn.addEventListener('click', addIngredientRow);
    saveRecipeBtn.addEventListener('click', saveNewRecipe);

    // Inspiration Event Listener
    generateInspirationBtn.addEventListener('click', generateInspiration);

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) closeRecipeModal();
    });

    // Allow adding with Enter key on inputs
    [itemNameInput, itemQuantityInput, itemUnitInput, itemCategoryInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addItem();
        });
    });

    // --- Pantry Functions ---

    function addItem() {
        const nameInput = itemNameInput.value.trim();
        const quantityInput = itemQuantityInput.value.trim();
        const unitInput = itemUnitInput.value.trim();
        let categoryInput = itemCategoryInput.value.trim();

        if (!nameInput) {
            alert('Kérlek add meg a termék nevét!');
            return;
        }

        if (!categoryInput) {
            categoryInput = 'Egyéb';
        }

        const capitalizedName = capitalizeFirstLetter(nameInput);
        const quantity = quantityInput ? parseFloat(quantityInput) : 0;
        const unit = unitInput || 'db';

        // Check if item already exists
        const existingItem = pantryItems.find(item =>
            item.name.toLowerCase() === capitalizedName.toLowerCase() &&
            item.unit === unit
        );

        if (existingItem) {
            // Update existing item
            existingItem.quantity = parseFloat(existingItem.quantity) + quantity;

            // Update category if the new one is not 'Egyéb' and the old one was
            if (existingItem.category === 'Egyéb' && categoryInput !== 'Egyéb') {
                existingItem.category = categoryInput;
            }
        } else {
            // Create new item
            const newItem = {
                id: Date.now(),
                name: capitalizedName,
                quantity: quantity,
                unit: unit,
                category: categoryInput
            };
            pantryItems.push(newItem);
        }

        saveData();
        renderItems();
        updateCategoryDatalist(); // Update datalist with potential new category
        clearInputs();
    }

    function deleteItem(id) {
        pantryItems = pantryItems.filter(item => item.id !== id);
        saveData();
        renderItems();
    }

    function clearInputs() {
        itemNameInput.value = '';
        itemQuantityInput.value = '';
        itemUnitInput.value = '';
        itemCategoryInput.value = '';
        itemNameInput.focus();
    }

    function renderItems() {
        pantryList.innerHTML = '';

        if (pantryItems.length === 0) {
            pantryList.innerHTML = `
                <div class="empty-state">
                    <p>Még nincsenek termékek a kamrában.</p>
                </div>
            `;
            return;
        }

        // Group items by category
        const groupedItems = {};
        pantryItems.forEach(item => {
            if (!groupedItems[item.category]) {
                groupedItems[item.category] = [];
            }
            groupedItems[item.category].push(item);
        });

        // Sort categories alphabetically
        const sortedCategories = Object.keys(groupedItems).sort();

        sortedCategories.forEach(category => {
            const items = groupedItems[category];

            // Create category section
            const categorySection = document.createElement('div');
            categorySection.className = 'category-group';

            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-title';
            categoryHeader.innerHTML = `
                ${category}
                <span class="category-count">${items.length}</span>
            `;

            const itemsGrid = document.createElement('div');
            itemsGrid.className = 'items-grid';

            // Sort items alphabetically within category
            items.sort((a, b) => a.name.localeCompare(b.name));

            items.forEach(item => {
                const itemCard = document.createElement('div');
                itemCard.className = 'item-card';
                itemCard.innerHTML = `
                    <div class="item-info">
                        <h3>${item.name}</h3>
                        <p class="item-quantity">${item.quantity} ${item.unit}</p>
                    </div>
                    <div class="item-actions">
                        <button class="add-to-list-btn" title="Hozzáadás a bevásárlólistához">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        </button>
                        <button class="delete-btn" title="Törlés">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;

                // Add event listeners
                const deleteBtn = itemCard.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => deleteItem(item.id));

                const addToListBtn = itemCard.querySelector('.add-to-list-btn');
                addToListBtn.addEventListener('click', () => addToShoppingList(item));

                itemsGrid.appendChild(itemCard);
            });

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(itemsGrid);
            pantryList.appendChild(categorySection);
        });
    }

    // --- Shopping List Functions ---

    function addToShoppingList(item) {
        // Check if already exists
        const exists = shoppingList.some(listItem => listItem.name === item.name);
        if (exists) {
            return;
        }

        const newItem = {
            id: Date.now() + Math.random(), // Ensure unique ID
            name: capitalizeFirstLetter(item.name),
            quantity: item.quantity || 1,
            unit: item.unit || 'db',
            category: item.category || 'Egyéb',
            bought: false
        };

        shoppingList.push(newItem);
        saveData();
        renderShoppingList();
    }

    function toggleBought(id) {
        shoppingList = shoppingList.map(item => {
            if (item.id === id) {
                return { ...item, bought: !item.bought };
            }
            return item;
        });
        saveData();
        renderShoppingList();
    }

    function removeFromShoppingList(id) {
        const itemToRemove = shoppingList.find(item => item.id === id);
        if (itemToRemove) {
            // Add back to pantry
            const pantryItem = {
                id: Date.now(),
                name: itemToRemove.name,
                quantity: itemToRemove.quantity || 1,
                unit: itemToRemove.unit || 'db',
                category: itemToRemove.category || 'Egyéb'
            };

            // Check if item already exists in pantry to merge
            const existingPantryItem = pantryItems.find(p =>
                p.name.toLowerCase() === pantryItem.name.toLowerCase() &&
                p.unit === pantryItem.unit
            );

            if (existingPantryItem) {
                existingPantryItem.quantity = parseFloat(existingPantryItem.quantity) + parseFloat(pantryItem.quantity);
            } else {
                pantryItems.push(pantryItem);
            }
        }

        shoppingList = shoppingList.filter(item => item.id !== id);
        saveData();
        renderShoppingList();
        renderItems(); // Update pantry view
    }

    function clearShoppingList() {
        if (confirm('Biztosan törölni szeretnéd a teljes bevásárlólistát?')) {
            shoppingList = [];
            saveData();
            renderShoppingList();
        }
    }

    function renderShoppingList() {
        shoppingListItemsContainer.innerHTML = '';

        if (shoppingList.length === 0) {
            shoppingListItemsContainer.innerHTML = `
                <div class="empty-state-small">
                    <p>A lista üres.</p>
                </div>
            `;
            return;
        }

        // Sort: Bought items last
        shoppingList.sort((a, b) => {
            if (a.bought === b.bought) return 0;
            return a.bought ? 1 : -1;
        });

        shoppingList.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = `shopping-item ${item.bought ? 'bought' : ''}`;

            // Default values if missing
            const qty = item.quantity || 1;
            const unit = item.unit || 'db';

            itemEl.innerHTML = `
                <div class="shopping-item-info">
                    <input type="checkbox" class="shopping-checkbox" ${item.bought ? 'checked' : ''}>
                    <span class="shopping-item-name">${item.name}</span>
                    <input type="number" class="shop-qty" value="${qty}" step="0.1" min="0">
                    <input type="text" class="shop-unit" value="${unit}" list="units">
                </div>
                <button class="btn-text delete-list-item" title="Eltávolítás">✕</button>
            `;

            const checkbox = itemEl.querySelector('.shopping-checkbox');
            checkbox.addEventListener('change', () => toggleBought(item.id));

            const qtyInput = itemEl.querySelector('.shop-qty');
            const unitInput = itemEl.querySelector('.shop-unit');

            qtyInput.addEventListener('change', (e) => updateShoppingItem(item.id, 'quantity', e.target.value));
            unitInput.addEventListener('change', (e) => updateShoppingItem(item.id, 'unit', e.target.value));

            // Prevent click propagation to checkbox when clicking inputs
            qtyInput.addEventListener('click', (e) => e.stopPropagation());
            unitInput.addEventListener('click', (e) => e.stopPropagation());

            const deleteBtn = itemEl.querySelector('.delete-list-item');
            deleteBtn.addEventListener('click', () => removeFromShoppingList(item.id));

            shoppingListItemsContainer.appendChild(itemEl);
        });
    }

    function updateShoppingItem(id, field, value) {
        const item = shoppingList.find(i => i.id === id);
        if (item) {
            item[field] = value;
            saveData();
        }
    }

    // --- Recipe Functions ---

    function renderRecipeSelect() {
        recipeSelect.innerHTML = '<option value="" disabled selected>Válassz receptet...</option>';

        // Group recipes by category
        const grouped = {};
        recipes.forEach(recipe => {
            const cat = recipe.category || 'Egyéb';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(recipe);
        });

        // Add optgroups
        const categories = ['Levesek', 'Tésztás ételek', 'Főzelékek', 'Húsos ételek', 'Köretek', 'Desszertek', 'Egyéb'];
        categories.forEach(cat => {
            if (!grouped[cat]) return;
            const optgroup = document.createElement('optgroup');
            optgroup.label = cat;
            grouped[cat].forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.id;
                option.textContent = recipe.name;
                optgroup.appendChild(option);
            });
            recipeSelect.appendChild(optgroup);
        });
    }

    async function checkRecipe() {
        const recipeId = parseInt(recipeSelect.value);
        if (!recipeId) {
            alert('Kérlek válassz egy receptet!');
            return;
        }

        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Show loading state
        const originalBtnText = checkRecipeBtn.innerHTML;
        checkRecipeBtn.innerHTML = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Ellenőrzés...';
        checkRecipeBtn.disabled = true;

        try {
            let missingItems = [];

            recipe.ingredients.forEach(reqItem => {
                // Find item in pantry (case-insensitive check)
                const pantryItem = pantryItems.find(pItem => pItem.name && pItem.name.toLowerCase() === reqItem.name.toLowerCase());

                if (!pantryItem) {
                    // Item completely missing
                    missingItems.push(reqItem);
                } else {
                    // Item exists, check quantity
                    if (parseFloat(pantryItem.quantity) < reqItem.quantity) {
                        missingItems.push(reqItem);
                    }
                }
            });

            if (missingItems.length > 0) {
                let message = `A következő hozzávalók hiányoznak vagy nincs belőlük elég a(z) ${recipe.name} recepthez:\n\n`;

                // Process missing items sequentially to allow async API calls
                for (const item of missingItems) {
                    message += `- ${item.name} (${item.quantity} ${item.unit})\n`;

                    // Try to find category
                    let category = 'Egyéb';

                    // 1. Check existing pantry items
                    const existingPantryItem = pantryItems.find(p => p.name && p.name.toLowerCase() === item.name.toLowerCase());
                    if (existingPantryItem && existingPantryItem.category !== 'Egyéb') {
                        category = existingPantryItem.category;
                    } else {
                        // 2. Check keywords
                        const keywordCategory = getCategoryFromKeywords(item.name.toLowerCase());
                        if (keywordCategory) {
                            category = keywordCategory;
                        } else {
                            // 3. API Lookup
                            const apiCategory = await fetchCategory(item.name);
                            if (apiCategory) {
                                category = apiCategory;
                            }
                        }
                    }

                    addToShoppingList({
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                        category: category
                    });
                }

                message += `\nEzeket hozzáadtam a bevásárlólistához.`;
                alert(message);
            } else {
                alert(`Minden hozzávaló megvan a(z) ${recipe.name} recepthez! Jó főzést! 👨‍🍳`);
            }
        } catch (error) {
            console.error('Error in checkRecipe:', error);
            alert('Hiba történt az ellenőrzés során: ' + error.message);
        } finally {
            // Restore button state
            checkRecipeBtn.innerHTML = originalBtnText;
            checkRecipeBtn.disabled = false;
        }
    }

    function openRecipeModal() {
        editingRecipeId = null; // Reset editing state
        recipeModal.classList.remove('hidden');
        recipeIngredientsList.innerHTML = '';
        newRecipeNameInput.value = '';
        addIngredientRow(); // Add one empty row by default
        document.querySelector('.modal-header h2').textContent = 'Új Recept';
    }

    function editRecipe() {
        const recipeId = parseInt(recipeSelect.value);
        if (!recipeId) {
            alert('Kérlek válassz egy receptet a szerkesztéshez!');
            return;
        }

        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        editingRecipeId = recipeId;
        recipeModal.classList.remove('hidden');
        recipeIngredientsList.innerHTML = '';
        newRecipeNameInput.value = recipe.name;
        recipeCategorySelect.value = recipe.category || 'Egyéb';
        document.querySelector('.modal-header h2').textContent = 'Recept Szerkesztése';

        recipe.ingredients.forEach(ing => {
            addIngredientRow(ing.name, ing.quantity, ing.unit);
        });
    }

    function cookRecipe() {
        const recipeId = parseInt(recipeSelect.value);
        if (!recipeId) {
            alert('Kérlek válassz egy receptet!');
            return;
        }

        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) return;

        // Check availability first
        let missingItems = [];
        recipe.ingredients.forEach(reqItem => {
            const pantryItem = pantryItems.find(pItem => pItem.name.toLowerCase() === reqItem.name.toLowerCase());
            if (!pantryItem || parseFloat(pantryItem.quantity) < reqItem.quantity) {
                missingItems.push(reqItem);
            }
        });

        if (missingItems.length > 0) {
            const proceed = confirm(`Figyelem! Néhány hozzávaló hiányzik vagy nincs elég belőle:\n${missingItems.map(i => `- ${i.name}`).join('\n')}\n\nEnnek ellenére elkészíted (levonod a készletből)?`);
            if (!proceed) return;
        }

        // Deduct ingredients
        recipe.ingredients.forEach(reqItem => {
            const pantryItem = pantryItems.find(pItem => pItem.name.toLowerCase() === reqItem.name.toLowerCase());
            if (pantryItem) {
                let newQty = parseFloat(pantryItem.quantity) - reqItem.quantity;
                if (newQty < 0) newQty = 0; // Don't go negative
                pantryItem.quantity = newQty;
            }
        });

        // Remove items with 0 quantity
        pantryItems = pantryItems.filter(item => parseFloat(item.quantity) > 0);

        saveData();
        renderItems();
        alert(`A(z) ${recipe.name} elkészítve! A hozzávalókat levontuk a kamrából.`);
    }

    function closeRecipeModal() {
        recipeModal.classList.add('hidden');
    }

    function addIngredientRow(name = '', qty = '', unit = '') {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="text" placeholder="Név" class="ing-name" value="${name}">
            <input type="number" placeholder="Menny." class="ing-qty" step="0.1" value="${qty}">
            <input type="text" placeholder="Egység" class="ing-unit" value="${unit}">
            <button class="btn-text remove-row">✕</button>
        `;

        row.querySelector('.remove-row').addEventListener('click', () => row.remove());
        recipeIngredientsList.appendChild(row);
    }

    function saveNewRecipe() {
        const name = newRecipeNameInput.value.trim();
        const category = recipeCategorySelect.value || 'Egyéb';

        if (!name) {
            alert('Add meg a recept nevét!');
            return;
        }

        const ingredients = [];
        const rows = recipeIngredientsList.querySelectorAll('.ingredient-row');

        rows.forEach(row => {
            const ingName = row.querySelector('.ing-name').value.trim();
            const ingQty = parseFloat(row.querySelector('.ing-qty').value);
            const ingUnit = row.querySelector('.ing-unit').value.trim();

            if (ingName && ingQty && ingUnit) {
                ingredients.push({
                    name: capitalizeFirstLetter(ingName),
                    quantity: ingQty,
                    unit: ingUnit
                });
            }
        });

        if (ingredients.length === 0) {
            alert('Adj hozzá legalább egy hozzávalót!');
            return;
        }

        if (editingRecipeId) {
            // Update existing
            const index = recipes.findIndex(r => r.id === editingRecipeId);
            if (index !== -1) {
                recipes[index] = {
                    id: editingRecipeId,
                    name,
                    category,
                    ingredients
                };
            }
        } else {
            // Create new
            const newRecipe = {
                id: Date.now(),
                name,
                category,
                ingredients
            };
            recipes.push(newRecipe);
        }
        localStorage.setItem('recipes', JSON.stringify(recipes));
        renderRecipeSelect();
        closeRecipeModal();
        alert('Recept sikeresen mentve!');
    }

    // --- Common ---

    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function saveData() {
        localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    }

    function updateCategoryDatalist() {
        const datalist = document.getElementById('categories');
        const defaultCategories = [
            'Tészták', 'Gabonafélék', 'Fűszerek', 'Zöldségek', 'Gyümölcsök',
            'Konzervek', 'Tejtermékek', 'Pékáru', 'Húsok', 'Nasi', 'Italok', 'Egyéb'
        ];

        // Get all unique categories from pantry items
        const usedCategories = pantryItems.map(item => item.category);

        // Merge and deduplicate
        const allCategories = [...new Set([...defaultCategories, ...usedCategories])].sort();

        datalist.innerHTML = '';
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            datalist.appendChild(option);
        });
    }

    // Helper: Get category from Hungarian keywords
    function getCategoryFromKeywords(name) {
        const keywords = {
            'konzerv': 'Konzervek', 'püré': 'Konzervek', 'befőtt': 'Konzervek',
            'tej': 'Tejtermékek', 'vaj': 'Tejtermékek', 'sajt': 'Tejtermékek', 'joghurt': 'Tejtermékek', 'tejföl': 'Tejtermékek', 'túró': 'Tejtermékek',
            'kenyér': 'Pékáru', 'zsemle': 'Pékáru', 'kifli': 'Pékáru', 'kalács': 'Pékáru',
            'alma': 'Gyümölcsök', 'körte': 'Gyümölcsök', 'banán': 'Gyümölcsök', 'narancs': 'Gyümölcsök', 'citrom': 'Gyümölcsök',
            'répa': 'Zöldségek', 'krumpli': 'Zöldségek', 'burgonya': 'Zöldségek', 'hagyma': 'Zöldségek', 'paradicsom': 'Zöldségek', 'paprika': 'Zöldségek', 'uborka': 'Zöldségek', 'kukorica': 'Zöldségek',
            'csirke': 'Húsok', 'sertés': 'Húsok', 'marha': 'Húsok', 'sonka': 'Húsok', 'kolbász': 'Húsok', 'szalámi': 'Húsok', 'hús': 'Húsok', 'darálthús': 'Húsok', 'bacon': 'Húsok', 'virsli': 'Húsok',
            'tészta': 'Tészták', 'spagetti': 'Tészták', 'penne': 'Tészták', 'csiga': 'Tészták', 'metélt': 'Tészták',
            'rizs': 'Gabonafélék', 'tarhonya': 'Gabonafélék', 'kuszkusz': 'Gabonafélék', 'bulgur': 'Gabonafélék', 'köles': 'Gabonafélék', 'hajdina': 'Gabonafélék', 'zab': 'Gabonafélék', 'müzli': 'Gabonafélék', 'pehely': 'Gabonafélék', 'dara': 'Gabonafélék', 'lencse': 'Gabonafélék', 'bab': 'Gabonafélék',
            'liszt': 'Sütés', 'cukor': 'Sütés', 'só': 'Fűszerek', 'bors': 'Fűszerek', 'paprika': 'Fűszerek',
            'víz': 'Italok', 'üdítő': 'Italok', 'sör': 'Italok', 'bor': 'Italok',
            'chips': 'Nasi', 'ropi': 'Nasi', 'keksz': 'Nasi', 'csoki': 'Nasi', 'snack': 'Nasi', 'popcorn': 'Nasi', 'nápolyi': 'Nasi', 'cukorka': 'Nasi'
        };

        // Check for specific canned/preserved keywords first
        if (name.includes('konzerv') || name.includes('püré') || name.includes('befőtt')) {
            return 'Konzervek';
        }

        for (const [key, category] of Object.entries(keywords)) {
            if (name.includes(key)) {
                return category;
            }
        }
        return null;
    }

    // Helper: Get category from API tags
    function getCategoryFromApiTags(tags) {
        const categoryMap = {
            'en:dairies': 'Tejtermékek',
            'en:cheeses': 'Tejtermékek',
            'en:milks': 'Tejtermékek',
            'en:yogurts': 'Tejtermékek',
            'en:meats': 'Húsok',
            'en:poultries': 'Húsok',
            'en:fishes': 'Húsok',
            'en:seafood': 'Húsok',
            'en:fresh-vegetables': 'Zöldségek',
            'en:vegetables': 'Zöldségek',
            'en:fruits': 'Gyümölcsök',
            'en:fresh-fruits': 'Gyümölcsök',
            'en:beverages': 'Italok',
            'en:carbonated-drinks': 'Italok',
            'en:fruit-juices': 'Italok',
            'en:breads': 'Pékáru',
            'en:sandwiches': 'Pékáru',
            'en:biscuits': 'Nasi',
            'en:snacks': 'Nasi',
            'en:salty-snacks': 'Nasi',
            'en:sweet-snacks': 'Nasi',
            'en:canned-foods': 'Konzervek',
            'en:condiments': 'Fűszerek',
            'en:spices': 'Fűszerek',
            'en:sauces': 'Fűszerek',
            'en:pastas': 'Tészták',
            'en:cereals': 'Gabonafélék',
            'en:grains': 'Gabonafélék',
            'en:legumes': 'Gabonafélék',
            'en:rice': 'Gabonafélék'
        };

        for (const tag of tags) {
            if (categoryMap[tag]) return categoryMap[tag];

            // Priority Order
            if (tag.includes('dairy') || tag.includes('cheese') || tag.includes('yogurt') || tag.includes('milk')) return 'Tejtermékek';
            if (tag.includes('meat') || tag.includes('ham') || tag.includes('sausage') || tag.includes('poultry') || tag.includes('fish') || tag.includes('seafood')) return 'Húsok';
            if (tag.includes('bread') || tag.includes('biscuit') || tag.includes('sandwich')) return 'Pékáru';
            if (tag.includes('fruit') && !tag.includes('fruit-juices')) return 'Gyümölcsök';
            if (tag.includes('vegetables')) return 'Zöldségek';
            if (tag.includes('beverages') || tag.includes('drinks') || tag.includes('juices') || tag.includes('water')) return 'Italok';
            if (tag.includes('pasta')) return 'Tészták';
            if (tag.includes('cereal') || tag.includes('rice') || tag.includes('grain') || tag.includes('legume')) return 'Gabonafélék';
        }
        return null;
    }

    // Helper: Fetch category from API
    async function fetchCategory(name) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        try {
            const response = await fetch(`https://hu.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=1`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.products && data.products.length > 0) {
                const tags = data.products[0].categories_tags || [];
                return getCategoryFromApiTags(tags);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Fetch category timed out for:', name);
            } else {
                console.error('Error fetching category:', error);
            }
        } finally {
            clearTimeout(timeoutId);
        }
        return null;
    }

    function suggestCategory() {
        const name = itemNameInput.value.toLowerCase().trim();
        if (name.length < 2) return;

        // 1. Check existing items
        const existingItem = pantryItems.find(item => item.name.toLowerCase().includes(name));
        if (existingItem && existingItem.category !== 'Egyéb') {
            itemCategoryInput.value = existingItem.category;
            return;
        }

        // 2. Keyword mapping
        const keywordCategory = getCategoryFromKeywords(name);
        if (keywordCategory) {
            itemCategoryInput.value = keywordCategory;
            return;
        }

        // Fallback to existing "Egyéb" if no keyword match
        if (existingItem) {
            itemCategoryInput.value = existingItem.category;
            return;
        }

        // 3. Online Lookup (Debounced)
        debouncedFetchCategory(name);
    }

    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedFetchCategory = debounce(async (name) => {
        if (name.length < 3) return;
        const category = await fetchCategory(name);
        if (category) {
            itemCategoryInput.value = category;
        }
    }, 500);

    // --- Inspiration Functions ---

    // Hungarian meal name translations
    const mealTranslations = {
        'Beef and Mustard Pie': 'Marhahús-mustáros pite',
        'Chicken Alfredo Primavera': 'Alfredo csirke zöldségekkel',
        'Corba': 'Korba leves',
        'Dal fry': 'Dal curry',
        'Honey Teriyaki Salmon': 'Mézes teriyaki lazac',
        'Kedgeree': 'Kedgeree (Hal-rizs)',
        'Lamb Biryani': 'Bárány biryani',
        'Lasag ne': 'Lasagne',
        'Massaman Beef curry': 'Massaman marhacurry',
        'Piri-piri chicken and slaw': 'Piri-piri csirke káposztasalátával',
        'Recheado Masala Fish': 'Recheado fűszeres hal',
        'Spaghetti Bolognese': 'Bolognai spagetti',
        'Tandoori chicken': 'Tandoori csirke',
        'Thai Green Curry': 'Thai zöld curry',
        'Tuna Nicoise': 'Tonnhalas niçoise saláta',
        // Add more as needed
    };

    async function generateInspiration() {
        const originalBtnText = generateInspirationBtn.innerHTML;
        generateInspirationBtn.innerHTML = '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg> Generálás...';
        generateInspirationBtn.disabled = true;
        inspirationResult.classList.add('hidden');

        try {
            // Fetch random meal from TheMealDB API
            const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
            const data = await response.json();

            if (data.meals && data.meals.length > 0) {
                const meal = data.meals[0];
                const englishName = meal.strMeal;
                const hungarianName = mealTranslations[englishName] || englishName;
                const image = meal.strMealThumb;
                const category = meal.strCategory;

                // Display result
                inspirationDish.textContent = hungarianName;
                inspirationDescription.innerHTML = `<strong>Kategória:</strong> ${category}`;

                // Add image
                let img = inspirationResult.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    inspirationResult.insertBefore(img, inspirationResult.firstChild);
                }
                img.src = image;
                img.alt = hungarianName;

                inspirationResult.classList.remove('hidden');
            } else {
                alert('Nem sikerült ételt találni. Próbáld újra!');
            }
        } catch (error) {
            console.error('Error generating inspiration:', error);
            alert('Hiba történt az inspiráció generálása során.');
        } finally {
            generateInspirationBtn.innerHTML = originalBtnText;
            generateInspirationBtn.disabled = false;
        }
    }


    // Barcode Scanner Logic
    const scanBtn = document.getElementById('scan-btn');
    const scannerModal = document.getElementById('scanner-modal');
    const closeScannerBtn = document.getElementById('close-scanner-btn');
    let html5QrcodeScanner = null;

    if (scanBtn) {
        scanBtn.addEventListener('click', () => {
            scannerModal.classList.remove('hidden');
            startScanner();
        });
    }

    if (closeScannerBtn) {
        closeScannerBtn.addEventListener('click', () => {
            stopScanner();
            scannerModal.classList.add('hidden');
        });
    }

    function startScanner() {
        if (html5QrcodeScanner) {
            // Already running
            return;
        }

        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }

    function stopScanner() {
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear().then(() => {
                html5QrcodeScanner = null;
            }).catch((error) => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        }
    }

    async function onScanSuccess(decodedText, decodedResult) {
        // Handle the scanned code
        console.log(`Code matched = ${decodedText}`, decodedResult);

        // Stop scanning
        stopScanner();
        scannerModal.classList.add('hidden');

        // Query OpenFoodFacts
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${decodedText}.json`);
            const data = await response.json();

            if (data.status === 1) {
                const product = data.product;
                console.log('Product data:', product); // Debug log

                const productName = product.product_name_hu ||
                    product.product_name ||
                    product.generic_name_hu ||
                    product.generic_name ||
                    product.product_name_en;

                if (productName) {
                    document.getElementById('item-name').value = productName;
                    // Trigger category suggestion
                    suggestCategory(productName);

                } else {
                    alert('Termék neve nem található.');
                }
            } else {
                alert('Termék nem található az adatbázisban.');
            }
        } catch (error) {
            console.error('Error fetching product data:', error);
            alert('Hiba történt a termék keresése közben.');
        }
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
        // for example:
        // console.warn(`Code scan error = ${error}`);
    }
});
