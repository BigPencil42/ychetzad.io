// Получаем элементы DOM
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('tasks');
const filterStatusSelect = document.getElementById('filter-status');
const filterCategorySelect = document.getElementById('filter-category');
const filterDateSelect = document.getElementById('filter-date');

// Функция для получения данных из LocalStorage
function getTasksFromLocalStorage() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  return tasks;
}

// Функция для сохранения данных в LocalStorage
function saveTasksToLocalStorage(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Загружаем задачи из LocalStorage при загрузке страницы
let tasks = getTasksFromLocalStorage();
renderTasks();

// Функция для добавления задания
function addTask(event) {
  event.preventDefault();

  const taskName = document.getElementById('task-name').value;
  const taskDescription = document.getElementById('task-description').value;
  const taskDeadline = document.getElementById('task-deadline').value;
  const taskPriority = document.getElementById('task-priority').value;

  const newTask = {
    id: Date.now(), // Используем уникальный идентификатор
    name: taskName,
    description: taskDescription,
    deadline: taskDeadline,
    priority: taskPriority,
    completed: false,
    category: 'Без категории', // По умолчанию "Без категории"
  };

  tasks.push(newTask);
  saveTasksToLocalStorage(tasks);
  renderTasks();

  // Очищаем форму
  taskForm.reset();
}

// Функция для рендеринга заданий в список
function renderTasks() {
  taskList.innerHTML = ''; // Очищаем список
  tasks = getTasksFromLocalStorage(); // Обновляем задачи из LocalStorage

  // Фильтруем задачи перед отображением
  const filteredTasks = filterTasksByStatus(filterStatusSelect.value,
                                             filterTasksByCategory(filterCategorySelect.value,
                                                                filterTasksByDate(filterDateSelect.value, tasks)));

  filteredTasks.forEach(task => {
    const newTaskElement = document.createElement('li');
    newTaskElement.setAttribute('data-task-id', task.id); // Добавляем ID для идентификации

    // Определяем стиль приоритета
    let priorityClass = '';
    if (task.priority === 'высокий') {
      priorityClass = 'high-priority';
    } else if (task.priority === 'средний') {
      priorityClass = 'medium-priority';
    }

    // Добавляем кнопку "Завершить"
    newTaskElement.innerHTML = `
      <div>
        <h3 class="${priorityClass}">${task.name}</h3>
        <p>${task.description}</p>
        <p>Срок сдачи: ${task.deadline}</p>
      </div>
      <div class="task-timer">
        <span class="timer-value"></span>
        <span class="timer-label">до</span>
      </div>
      <div>
        <button class="complete ${task.completed ? 'completed' : ''}">Завершить</button>
        <button class="delete">Удалить</button>
      </div>
    `;

    // Обработчик для "Завершить"
    newTaskElement.querySelector('.complete').addEventListener('click', () => {
      toggleTaskCompletion(task.id);
      renderTasks();
    });

    // Обработчик для "Удалить"
    newTaskElement.querySelector('.delete').addEventListener('click', () => {
      deleteTask(task.id);
      renderTasks();
    });

    // Добавляем элемент в список
    taskList.appendChild(newTaskElement);

    // Запускаем таймер
    startTimer(newTaskElement, task.deadline);
  });

  // Обновляем список категорий для фильтрации
  updateCategoryFilterOptions();
}

// Функция для переключения статуса завершения задания
function toggleTaskCompletion(taskId) {
  tasks.forEach(task => {
    if (task.id === taskId) {
      task.completed = !task.completed;
    }
  });
  saveTasksToLocalStorage(tasks);
}

// Функция для удаления задания
function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasksToLocalStorage(tasks);
}

// Функция для фильтрации заданий по статусу
function filterTasksByStatus(status) {
  return tasks.filter(task => {
    if (status === 'all') {
      return true;
    } else if (status === 'completed' && task.completed) {
      return true;
    } else if (status === 'pending' && !task.completed) {
      return true;
    }
    return false;
  });
}

// Функция для фильтрации заданий по категории
function filterTasksByCategory(category) {
  return tasks.filter(task => {
    if (category === 'all') {
      return true;
    } else if (task.category === category) {
      return true;
    }
    return false;
  });
}

// Функция для фильтрации заданий по дате
function filterTasksByDate(dateFilter) {
  return tasks.filter(task => {
    if (dateFilter === 'all') {
      return true;
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() - today.getDay() + 7);

    const taskDeadline = new Date(task.deadline);

    if (dateFilter === 'today' && taskDeadline.getDate() === today.getDate()) {
      return true;
    } else if (dateFilter === 'tomorrow' && taskDeadline.getDate() === tomorrow.getDate()) {
      return true;
    } else if (dateFilter === 'this-week' && taskDeadline >= thisWeekStart && taskDeadline < nextWeekStart) {
      return true;
    } else if (dateFilter === 'next-week' && taskDeadline >= nextWeekStart) {
      return true;
    }

    return false;
  });
}

// Функция для обновления списка категорий в фильтре
function updateCategoryFilterOptions() {
  const uniqueCategories = new Set(tasks.map(task => task.category));
  filterCategorySelect.innerHTML = '<option value="all" selected>Все</option>';
  uniqueCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.text = category;
    filterCategorySelect.appendChild(option);
  });
}

// Функция для запуска таймера
function startTimer(taskElement, deadline) {
  const timerElement = taskElement.querySelector('.timer-value');
  const deadlineDate = new Date(deadline);

  let timerInterval = setInterval(() => {
    // Проверяем, завершена ли задача
    if (taskElement.classList.contains('completed')) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Задание выполнено!';
      return;
    }

    const now = new Date();
    const timeLeft = deadlineDate - now;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      timerElement.textContent = 'Просрочено!';
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    timerElement.textContent = `${days}д ${hours}ч ${minutes}м ${seconds}с`;
  }, 1000);
}

// Привязываем функции к событиям
taskForm.addEventListener('submit', addTask);
filterStatusSelect.addEventListener('change', renderTasks);
filterCategorySelect.addEventListener('change', renderTasks);
filterDateSelect.addEventListener('change', renderTasks);