// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// Add search input and button
const searchContainer = document.createElement('div');
searchContainer.className = 'search-container';
searchContainer.innerHTML = `
    <input type="text" id="searchInput" placeholder="Search tasks...">
    <button id="clearSearchBtn" title="Clear search"><i class="fas fa-times"></i></button>
    <button id="searchBtn" title="Search tasks">Search</button>
`;

// Insert search container after task form
document.querySelector('.task-form').after(searchContainer);

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const searchBtn = document.getElementById('searchBtn');

// App State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let currentCategory = null; // Add this line
let categories = JSON.parse(localStorage.getItem('categories')) || ['Work', 'Personal', 'Shopping', 'Health'];
let searchQuery = '';

// Initialize the app
function init() {
    renderTasks();
    updateTaskCount();
    renderCategories();
    
    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    clearCompletedBtn.addEventListener('click', clearCompleted);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        // Don't auto-search on input, wait for button click
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    searchBtn.addEventListener('click', performSearch);
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        renderTasks();
    });
}

// Perform search
function performSearch() {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderTasks();
}

// Add a new task
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        shakeElement(taskInput);
        return;
    }
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date(),
        dueDate: null,
        category: null
    };
    
    tasks.push(newTask);
    saveTasks();
    
    taskInput.value = '';
    renderTasks();
    updateTaskCount();
}

// Render categories
function renderCategories() {
    const categoryContainer = document.createElement('div');
    categoryContainer.className = 'category-container';
    
    // Group categories by parent
    const categoryGroups = {};
    const topLevelCategories = [];
    
    categories.forEach(category => {
        if (category.includes('/')) {
            const [parent, sub] = category.split('/');
            if (!categoryGroups[parent]) {
                categoryGroups[parent] = [];
            }
            categoryGroups[parent].push(category);
        } else {
            topLevelCategories.push(category);
        }
    });
    
    categoryContainer.innerHTML = `
        <h3>Categories</h3>
        <ul class="category-list">
            <li class="category-item ${currentCategory === null ? 'active' : ''}" data-filter="all">
                <span>All Categories</span>
            </li>
            ${topLevelCategories.map(category => `
                <li class="category-item ${currentCategory === category ? 'active' : ''}" data-category="${category}">
                    <span>${category}</span>
                    <button class="category-delete-btn" data-category="${category}">×</button>
                    ${categoryGroups[category] ? `
                        <ul class="subcategory-list">
                            ${categoryGroups[category].map(subCat => `
                                <li class="category-item ${currentCategory === subCat ? 'active' : ''}" data-category="${subCat}">
                                    <span>${subCat.split('/')[1]}</span>
                                    <button class="category-delete-btn" data-category="${subCat}">×</button>
                                </li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </li>
            `).join('')}
            <li class="category-item add-category">
                <input type="text" id="newCategoryInput" placeholder="Add category or Parent/Sub...">
                <button id="addCategoryBtn">+</button>
            </li>
        </ul>
    `;
    
    // Check if category container already exists
    const existingContainer = document.querySelector('.category-container');
    if (existingContainer) {
        existingContainer.replaceWith(categoryContainer);
    } else {
        // Insert after task filters
        const taskFilters = document.querySelector('.task-filters');
        taskFilters.after(categoryContainer);
    }
    
    // Add event listeners
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('newCategoryInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategory();
    });
    
    document.querySelectorAll('.category-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent category filtering when deleting
            const category = btn.getAttribute('data-category');
            deleteCategory(category);
        });
    });
    
    // Add category filtering
    document.querySelectorAll('.category-item:not(.add-category)').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all category items
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Set current category filter
            if (item.hasAttribute('data-filter') && item.getAttribute('data-filter') === 'all') {
                currentCategory = null;
            } else {
                currentCategory = item.getAttribute('data-category');
            }
            
            renderTasks();
        });
    });
}

// Add a new category
function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const categoryName = input.value.trim();
    
    if (categoryName === '') return;
    
    // Check if this is a subcategory (contains '/')
    if (categoryName.includes('/')) {
        const [parentCategory, subCategory] = categoryName.split('/').map(c => c.trim());
        
        // Verify parent category exists
        if (!categories.includes(parentCategory)) {
            alert(`Parent category "${parentCategory}" doesn't exist. Please create it first.`);
            return;
        }
        
        // Create full category path
        const fullCategory = `${parentCategory}/${subCategory}`;
        
        if (!categories.includes(fullCategory)) {
            categories.push(fullCategory);
            saveCategories();
            
            // Set the new category as the current category
            currentCategory = fullCategory;
            
            renderCategories();
            renderTasks(); // Re-render tasks to show only the new category
        }
    } else {
        // Regular category (no subcategory)
        if (!categories.includes(categoryName)) {
            categories.push(categoryName);
            saveCategories();
            
            // Set the new category as the current category
            currentCategory = categoryName;
            
            renderCategories();
            renderTasks(); // Re-render tasks to show only the new category
        }
    }
    
    input.value = '';
}

// Delete a category
function deleteCategory(categoryName) {
    categories = categories.filter(cat => cat !== categoryName);
    
    // Remove this category from all tasks
    tasks = tasks.map(task => {
        if (task.category === categoryName) {
            return { ...task, category: null };
        }
        return task;
    });
    
    saveCategories();
    saveTasks();
    renderCategories();
    renderTasks();
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Set category for a task
function setTaskCategory(taskId, category) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            // Toggle category: if the task already has this category, remove it; otherwise, set it
            return { ...task, category: task.category === category ? null : category };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    
    // Close all category dropdowns after selection
    document.querySelectorAll('.category-dropdown-content.show').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
}

// Toggle task completion status
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateTaskCount();
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
    updateTaskCount();
}

// Clear all completed tasks
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
    updateTaskCount();
}

// Filter tasks based on current filter, category, and search query
function getFilteredTasks() {
    let filtered = tasks;
    
    // Apply filter (all, active, completed)
    switch(currentFilter) {
        case 'active':
            filtered = filtered.filter(task => !task.completed);
            break;
        case 'completed':
            filtered = filtered.filter(task => task.completed);
            break;
    }
    
    // Apply category filter
    if (currentCategory) {
        filtered = filtered.filter(task => task.category === currentCategory);
    }
    
    // Apply search query
    if (searchQuery) {
        filtered = filtered.filter(task => {
            return task.text.toLowerCase().includes(searchQuery) || 
                  (task.category && task.category.toLowerCase().includes(searchQuery));
        });
    }
    
    return filtered;
}

// Render tasks to the DOM
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Sort tasks by completion status and due date
    filteredTasks.sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // Then by due date if available
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (a.dueDate) {
            return -1;
        } else if (b.dueDate) {
            return 1;
        }
        
        // Finally by creation date
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    // Clear the task list
    taskList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <p>No ${currentFilter === 'all' ? '' : currentFilter} tasks found</p>
            </div>
        `;
        return;
    }
    
    // Add each task to the list
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-task-id', task.id);
        
        // Check if task is overdue
        let isOverdue = false;
        let dueDateDisplay = '';
        
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            isOverdue = !task.completed && dueDate < today;
            
            // Format date as MM/DD/YYYY
            const month = dueDate.getMonth() + 1;
            const day = dueDate.getDate();
            const year = dueDate.getFullYear();
            dueDateDisplay = `${month}/${day}/${year}`;
        }
        
        if (isOverdue) {
            taskItem.classList.add('overdue');
        }
        
        // Create category dropdown HTML
        const categoryDropdownHTML = `
            <div class="category-dropdown">
                <button class="category-btn" title="Set category">
                    ${task.category ? `<span class="task-category">${task.category}</span>` : '<i class="fas fa-tag"></i>'}
                </button>
                <div class="category-dropdown-content">
                    ${categories.map(cat => `
                        <div class="category-option ${task.category === cat ? 'selected' : ''}" data-category="${cat}">
                            ${cat}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // In the task item HTML
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            ${task.dueDate ? `<span class="due-date ${isOverdue ? 'overdue' : ''}">${dueDateDisplay}</span>` : ''}
            <div class="task-actions">
                ${categoryDropdownHTML}
                <button class="date-btn" title="Set due date"><i class="fas fa-calendar"></i></button>
                <button class="delete-btn" title="Delete task"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Add event listeners to the task item
        // Add event listeners to the task item
        const checkbox = taskItem.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id));
        
        const deleteBtn = taskItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        const dateBtn = taskItem.querySelector('.date-btn');
        dateBtn.addEventListener('click', () => setDueDate(task.id));
        
        // Remove this priority button event listener
        // const priorityBtn = taskItem.querySelector('.priority-btn');
        // priorityBtn.addEventListener('click', () => togglePriority(task.id));
        
        // Add event listeners for category dropdown
        const categoryBtn = taskItem.querySelector('.category-btn');
        categoryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close all other open dropdowns first
            document.querySelectorAll('.category-dropdown-content.show').forEach(dropdown => {
                if (dropdown !== taskItem.querySelector('.category-dropdown-content')) {
                    dropdown.classList.remove('show');
                }
            });
            // Toggle this dropdown
            const dropdown = taskItem.querySelector('.category-dropdown-content');
            dropdown.classList.toggle('show');
        });
        
        // Add event listeners for category options
        taskItem.querySelectorAll('.category-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = option.getAttribute('data-category');
                setTaskCategory(task.id, category);
            });
        });
        
        // Make task text editable
        const taskText = taskItem.querySelector('.task-text');
        taskText.addEventListener('dblclick', () => {
            if (!task.completed) {
                startEditing(taskText, task.id, task.text);
            }
        });
        
        taskList.appendChild(taskItem);
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.category-dropdown')) {
            document.querySelectorAll('.category-dropdown-content.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }, { capture: true });
}

// Start editing a task
function startEditing(taskTextElement, taskId, currentText) {
    // Create input element
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.className = 'edit-task-input';
    inputElement.value = currentText;
    
    // Create edit actions
    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';
    editActions.innerHTML = `
        <button class="save-edit-btn" title="Save"><i class="fas fa-check"></i></button>
        <button class="cancel-edit-btn" title="Cancel"><i class="fas fa-times"></i></button>
    `;
    
    // Replace task text with input
    const taskItem = taskTextElement.parentElement;
    taskItem.replaceChild(inputElement, taskTextElement);
    taskItem.insertBefore(editActions, inputElement.nextSibling);
    
    // Focus input
    inputElement.focus();
    inputElement.select();
    
    // Add event listeners
    const saveBtn = editActions.querySelector('.save-edit-btn');
    const cancelBtn = editActions.querySelector('.cancel-edit-btn');
    
    saveBtn.addEventListener('click', () => {
        saveEdit(taskId, inputElement.value.trim());
    });
    
    cancelBtn.addEventListener('click', () => {
        cancelEdit(taskTextElement, inputElement, editActions);
    });
    
    inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit(taskId, inputElement.value.trim());
        }
    });
    
    inputElement.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
            cancelEdit(taskTextElement, inputElement, editActions);
        }
    });
    
    // Handle click outside
    document.addEventListener('click', function clickOutside(e) {
        if (!inputElement.contains(e.target) && 
            !editActions.contains(e.target)) {
            saveEdit(taskId, inputElement.value.trim());
            document.removeEventListener('click', clickOutside);
        }
    });
}

// Save task edit
function saveEdit(taskId, newText) {
    if (newText === '') return;
    
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, text: newText };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
}

// Cancel task edit
function cancelEdit(taskTextElement, inputElement, editActions) {
    const taskItem = inputElement.parentElement;
    taskItem.replaceChild(taskTextElement, inputElement);
    taskItem.removeChild(editActions);
}

// Set due date for a task
function setDueDate(id) {
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.position = 'absolute';
    dateInput.style.zIndex = '100';
    
    // Find the task in the array
    const task = tasks.find(t => t.id === id);
    if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dateInput.valueAsDate = dueDate;
    }
    
    // Position the date picker near the calendar button
    const dateBtn = document.querySelector(`li[data-task-id="${id}"] .date-btn`);
    if (dateBtn) {
        const rect = dateBtn.getBoundingClientRect();
        dateInput.style.top = `${rect.bottom + window.scrollY}px`;
        dateInput.style.left = `${rect.left + window.scrollX}px`;
    } else {
        // Fallback positioning
        dateInput.style.top = '50%';
        dateInput.style.left = '50%';
        dateInput.style.transform = 'translate(-50%, -50%)';
    }
    
    document.body.appendChild(dateInput);
    
    // Focus and show the date picker
    dateInput.focus();
    
    // Handle date selection
    dateInput.addEventListener('change', () => {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, dueDate: dateInput.value ? new Date(dateInput.value).toISOString() : null };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        document.body.removeChild(dateInput);
    });
    
    // Handle click outside
    dateInput.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.body.contains(dateInput)) {
                document.body.removeChild(dateInput);
            }
        }, 200);
    });
}

// Update the task count
function updateTaskCount() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Visual feedback for empty input
function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => {
        element.classList.remove('shake');
    }, 500);
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    .shake {
        animation: shake 0.5s;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);