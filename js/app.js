const $ = document;
const todoList = $.querySelector(".todo-list");
const themeBtns = $.querySelectorAll(".theme-btn");
const addTodoBtn = $.querySelector(".add-btn");
const colorBtnOption = $.querySelectorAll(".color-btn-option");
const todoFilter = $.querySelector(".todo-filter");
const sortSelect = $.querySelector(".sort-group select");
const exportBtn = $.querySelector(".export[data-bs-target='#exportModal']");
const exportModal = $.querySelector("#exportModal");
const exportButtons = $.querySelectorAll(".export-btn");
const backUpBtn = $.querySelector(".back-up");

const colorMap = {
  green: "#27ae60",
  yellow: "#f1c40f",
  blue: "#4a90e2",
  red: "#e74c3c",
};

// Object for save todo time
const timers = {};

$.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  $.documentElement.setAttribute("data-theme", savedTheme);

  setTimeout(() => {
    hideLoader();
  }, 2000);

  const savedBorderColor = localStorage.getItem("border-color");
  const savedTextColor = localStorage.getItem("text-color");
  const savedPlaceholderColor = localStorage.getItem("placeholder-color");

  if (savedBorderColor) {
    $.documentElement.style.setProperty("--border-color", savedBorderColor);
  }
  if (savedTextColor) {
    $.documentElement.style.setProperty("--text-color", savedTextColor);
  }
  if (savedPlaceholderColor) {
    $.documentElement.style.setProperty(
      "--placeholder-color",
      savedPlaceholderColor
    );
  }

  function hideLoader() {
    const loaderElem = $.querySelector(".loader");
    loaderElem.classList.add("hide");
  }

  function updateFilterDropDown() {
    const categories = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const localKey = localStorage.key(i);
      if (
        !(
          localKey === "theme" ||
          localKey === "border-color" ||
          localKey === "text-color" ||
          localKey === "placeholder-color" ||
          localKey === "todosText"
        )
      ) {
        const todoData = JSON.parse(localStorage.getItem(localKey))[0];
        categories.add(todoData.category);
      }
    }

    todoFilter.innerHTML = `
      <option value="all">All Tasks</option>
      <option value="incomplete">Incomplete</option>
      <option value="complete">Complete</option>
      <option value="low">Low Difficulty</option>
      <option value="medium">Medium Difficulty</option>
      <option value="high">High Difficulty</option>
      ${[...categories]
        .map(
          (category) =>
            `<option value="category-${category}">${category}</option>`
        )
        .join("")}
    `;
  }

  function applyFilter() {
    const filterValue = todoFilter.value;
    const todoItems = todoList.querySelectorAll(".todo-item");

    todoItems.forEach((item) => {
      const status = item.classList.contains("complete")
        ? "complete"
        : "incomplete";
      const difficulty = item
        .querySelector(".todo-difficulty")
        .textContent.toLowerCase();
      const category = item.querySelector(".todo-category").textContent;

      if (filterValue === "all") {
        item.style.display = "block";
      } else if (filterValue === "incomplete" && status === "incomplete") {
        item.style.display = "block";
      } else if (filterValue === "complete" && status === "complete") {
        item.style.display = "block";
      } else if (filterValue === difficulty) {
        item.style.display = "block";
      } else if (
        filterValue.startsWith("category-") &&
        category === filterValue.replace("category-", "")
      ) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  }

  function sortTodo() {
    const sortValue = sortSelect.value;
    const todoItems = Array.from(todoList.querySelectorAll(".todo-item"));
    const todos = [];

    todoItems.forEach((item) => {
      const todoTitle = item.querySelector(".todo-title").textContent;
      const todoData = JSON.parse(localStorage.getItem(todoTitle))[0];
      todos.push({ element: item, data: todoData });
    });

    const difficultyTodo = { low: 1, medium: 2, high: 3 };

    todos.sort((a, b) => {
      if (sortValue === "time-asc") {
        return (a.data.createdAt || 0) - (b.data.createdAt || 0);
      } else if (sortValue === "time-desc") {
        return (b.data.createdAt || 0) - (a.data.createdAt || 0);
      } else if (sortValue === "difficulty-asc") {
        return (
          difficultyTodo[a.data.difficulty] - difficultyTodo[b.data.difficulty]
        );
      } else if (sortValue === "difficulty-desc") {
        return (
          difficultyTodo[b.data.difficulty] - difficultyTodo[a.data.difficulty]
        );
      }
      return 0;
    });

    todoList.innerHTML = "";
    todos.forEach((todo) => {
      todoList.appendChild(todo.element);
    });

    applyFilter();
  }

  function updateTodosText() {
    let todosText = "";
    for (let i = 0; i < localStorage.length; i++) {
      const localKey = localStorage.key(i);
      if (
        !(
          localKey === "theme" ||
          localKey === "border-color" ||
          localKey === "text-color" ||
          localKey === "placeholder-color" ||
          localKey === "todosText"
        )
      ) {
        const todoData = JSON.parse(localStorage.getItem(localKey))[0];
        todosText += `Title: ${todoData.title}\nDescription: ${
          todoData.description
        }\nCategory: ${todoData.category}\nDifficulty: ${
          todoData.difficulty
        }\nStatus: ${todoData.status}\nCreated At: ${new Date(
          todoData.createdAt || Date.now()
        ).toISOString()}\nElapsed Time: ${formatTime(
          todoData.elapsedTime || 0
        )}\n---\n`;
      }
    }
    localStorage.setItem("todosText", todosText);
  }

  function exportToPDF() {
    const modalInstance = bootstrap.Modal.getInstance(exportModal);
    modalInstance.hide();
    window.print();
  }

  function exportToJSON() {
    const todos = [];
    for (let i = 0; i < localStorage.length; i++) {
      const localKey = localStorage.key(i);
      if (
        !(
          localKey === "theme" ||
          localKey === "border-color" ||
          localKey === "text-color" ||
          localKey === "placeholder-color" ||
          localKey === "todosText"
        )
      ) {
        todos.push(JSON.parse(localStorage.getItem(localKey))[0]);
      }
    }

    const jsonContent = JSON.stringify(todos, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = $.createElement("a");
    link.href = url;
    link.download = "todos.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportToCSV() {
    const todos = [];
    for (let i = 0; i < localStorage.length; i++) {
      const localKey = localStorage.key(i);
      if (
        !(
          localKey === "theme" ||
          localKey === "border-color" ||
          localKey === "text-color" ||
          localKey === "placeholder-color" ||
          localKey === "todosText"
        )
      ) {
        todos.push(JSON.parse(localStorage.getItem(localKey))[0]);
      }
    }

    const headers = [
      "Title",
      "Description",
      "Category",
      "Difficulty",
      "Status",
      "Created At",
      "Elapsed Time",
    ];
    let csvContent = headers.join(",") + "\n";
    todos.forEach((todo) => {
      const row = [
        `"${todo.title.replace(/"/g, '""')}"`,
        `"${todo.description.replace(/"/g, '""')}"`,
        `"${todo.category.replace(/"/g, '""')}"`,
        todo.difficulty,
        todo.status,
        new Date(todo.createdAt || Date.now()).toISOString(),
        formatTime(todo.elapsedTime || 0),
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = $.createElement("a");
    link.href = url;
    link.download = "todos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function backUpTodos() {
    const todosText = localStorage.getItem("todosText") || "";
    const blob = new Blob([todosText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = $.createElement("a");
    link.href = url;
    link.download = "todos.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function initializeTodosText() {
    if (!localStorage.getItem("todosText")) {
      updateTodosText();
    }
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.getAttribute("data-theme");
      $.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    });
  });

  addTodoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    let todoTitleInput = $.querySelector(".todo-title").value;
    let todoDescriptionInput = $.querySelector(".todo-description").value;
    let todoCategoryInput = $.querySelector(".todo-category").value;
    let todoDifficultyInput = $.querySelector(".todo-difficulty").value;

    if (
      !(
        todoTitleInput === "" ||
        todoDescriptionInput === "" ||
        todoCategoryInput === "" ||
        todoDifficultyInput === ""
      )
    ) {
      if (
        !(
          todoTitleInput.length > 20 ||
          todoDescriptionInput.length > 300 ||
          todoCategoryInput.length > 20
        )
      ) {
        const createdAt = Date.now();
        localStorage.setItem(
          todoTitleInput,
          JSON.stringify([
            {
              title: todoTitleInput,
              description: todoDescriptionInput,
              category: todoCategoryInput,
              difficulty: todoDifficultyInput,
              status: "incomplete",
              elapsedTime: 0,
              createdAt: createdAt,
            },
          ])
        );

        todoList.insertAdjacentHTML(
          "beforeend",
          `        <div class="todo-item incomplete">
            <div class="todo-header">
              <div class="todo-title">${todoTitleInput}</div>
              <div class="todo-difficulty difficulty-${todoDifficultyInput}">${todoDifficultyInput}</div>
            </div>
            <div class="todo-category">${todoCategoryInput}</div>
            <div class="todo-description">${todoDescriptionInput}.</div>
            <div class="todo-time">
              <span>Time: 00:00:00</span>
              <div class="time-controls">
                <button class="time-btn start">▶️ Start</button>
                <button class="time-btn stop">⏸️ Stop</button>
                <button class="time-btn reset">🔄 Reset</button>
              </div>
            </div>
            <div class="todo-actions">
              <button class="action-btn complete">✅ incomplete</button>
              <button class="action-btn edit">✏️ Edit</button>
              <button class="action-btn delete">🗑️ Delete</button>
            </div>
          </div>`
        );

        updateTodosText();
        $.querySelector(".todo-title").value = "";
        $.querySelector(".todo-description").value = "";
        $.querySelector(".todo-category").value = "";
        $.querySelector(".todo-difficulty").value = "";
        updateFilterDropDown();
        sortTodo();
      } else {
        const addNewTaskTitle = $.querySelector(".add-new-task__title");
        addNewTaskTitle.style.color = "red";
        addNewTaskTitle.innerHTML = "The text size is too large.";

        setTimeout(() => {
          addNewTaskTitle.style.color = "var(--text-color)";
          addNewTaskTitle.innerHTML = "Add New Todo";
        }, 4000);
      }
    } else {
      const addNewTaskTitle = $.querySelector(".add-new-task__title");
      addNewTaskTitle.style.color = "red";
      addNewTaskTitle.innerHTML = "All fields must be filled.";

      setTimeout(() => {
        addNewTaskTitle.style.color = "var(--text-color)";
        addNewTaskTitle.innerHTML = "Add New Todo";
      }, 4000);
    }
  });

  colorBtnOption.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      const colorValue = colorMap[color];
      const option = btn
        .closest(".color-option")
        .querySelector("label")
        .textContent.toLowerCase();

      if (option.includes("border colors")) {
        $.documentElement.style.setProperty("--border-color", colorValue);
        localStorage.setItem("border-color", colorValue);
      } else if (option.includes("text colors")) {
        $.documentElement.style.setProperty("--text-color", colorValue);
        localStorage.setItem("text-color", colorValue);
      } else if (option.includes("placeholder colors")) {
        $.documentElement.style.setProperty("--placeholder-color", colorValue);
        localStorage.setItem("placeholder-color", colorValue);
      }
    });
  });

  exportButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const format = btn.getAttribute("data-format");
      if (format === "pdf") {
        exportToPDF();
      } else if (format === "json") {
        exportToJSON();
      } else if (format === "csv") {
        exportToCSV();
      }
      const modalInstance = bootstrap.Modal.getInstance(exportModal);
      modalInstance.hide();
    });
  });

  backUpBtn.addEventListener("click", backUpTodos);

  // Load todos from localStorage
  for (let i = 0; i < localStorage.length; i++) {
    let localTodoname = localStorage.key(i);
    if (
      !(
        localTodoname === "theme" ||
        localTodoname === "border-color" ||
        localTodoname === "text-color" ||
        localTodoname === "placeholder-color" ||
        localTodoname === "todosText"
      )
    ) {
      const todoData = JSON.parse(localStorage.getItem(localTodoname))[0];
      todoList.insertAdjacentHTML(
        "beforeend",
        `        <div class="todo-item ${todoData.status}">
          <div class="todo-header">
            <div class="todo-title">${todoData.title}</div>
            <div class="todo-difficulty difficulty-${todoData.difficulty}">${
          todoData.difficulty
        }</div>
          </div>
          <div class="todo-category">${todoData.category}</div>
          <div class="todo-description">${todoData.description}.</div>
          <div class="todo-time">
            <span>Time: ${formatTime(todoData.elapsedTime || 0)}</span>
            <div class="time-controls">
              <button class="time-btn start">▶️ Start</button>
              <button class="time-btn stop">⏸️ Stop</button>
              <button class="time-btn reset">🔄 Reset</button>
            </div>
          </div>
          <div class="todo-actions">
            <button class="action-btn complete">✅ ${todoData.status}</button>
            <button class="action-btn edit">✏️ Edit</button>
            <button class="action-btn delete">🗑️ Delete</button>
          </div>
        </div>`
      );
    }
  }

  initializeTodosText();
  updateFilterDropDown();
  sortTodo();

  // Filter and Sort
  todoFilter.addEventListener("change", applyFilter);
  sortSelect.addEventListener("change", sortTodo);

  // Format time
  function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Update timer for a specific todo
  function updateTimer(todoItem, todoTitle) {
    const todoData = JSON.parse(localStorage.getItem(todoTitle))[0];
    todoData.elapsedTime = (todoData.elapsedTime || 0) + 1;
    localStorage.setItem(
      todoTitle,
      JSON.stringify([
        {
          title: todoData.title,
          description: todoData.description,
          category: todoData.category,
          difficulty: todoData.difficulty,
          status: todoData.status,
          elapsedTime: todoData.elapsedTime,
          createdAt: todoData.createdAt || Date.now(),
        },
      ])
    );
    todoItem.querySelector(".todo-time span").textContent = `Time: ${formatTime(
      todoData.elapsedTime
    )}`;
    updateTodosText();
  }

  // Event for edit, delete, complete, and timer
  todoList.addEventListener("click", (e) => {
    const todoItem = e.target.closest(".todo-item");
    if (!todoItem) return;

    const todoTitle = todoItem.querySelector(".todo-title").textContent;

    if (e.target.classList.contains("edit")) {
      const titleDiv = todoItem.querySelector(".todo-title");
      const categoryDiv = todoItem.querySelector(".todo-category");
      const descriptionDiv = todoItem.querySelector(".todo-description");
      const difficultyDiv = todoItem.querySelector(".todo-difficulty");

      const originalTitle = titleDiv.textContent;
      const originalCategory = categoryDiv.textContent;
      const originalDescription = descriptionDiv.textContent.replace(/\.$/, "");
      const originalDifficulty = difficultyDiv.textContent.toLowerCase();

      titleDiv.innerHTML = `<input type="text" class="edit-title" value="${originalTitle}" maxlength="20" required>`;
      categoryDiv.innerHTML = `<input type="text" class="edit-category" value="${originalCategory}" maxlength="20" required>`;
      descriptionDiv.innerHTML = `<textarea class="edit-description" maxlength="300" required>${originalDescription}</textarea>`;
      difficultyDiv.innerHTML = `
        <select class="edit-difficulty" required>
          <option value="low" ${
            originalDifficulty === "low" ? "selected" : ""
          }>Low</option>
          <option value="medium" ${
            originalDifficulty === "medium" ? "selected" : ""
          }>Medium</option>
          <option value="high" ${
            originalDifficulty === "high" ? "selected" : ""
          }>High</option>
        </select>
      `;

      e.target.outerHTML = `<button class="action-btn save">💾 Save</button>`;
    } else if (e.target.classList.contains("save")) {
      const titleInput = todoItem.querySelector(".edit-title");
      const categoryInput = todoItem.querySelector(".edit-category");
      const descriptionInput = todoItem.querySelector(".edit-description");
      const difficultyInput = todoItem.querySelector(".edit-difficulty");

      const newTitle = titleInput.value.trim();
      const newCategory = categoryInput.value.trim();
      const newDescription = descriptionInput.value.trim();
      const newDifficulty = difficultyInput.value;

      if (
        newTitle === "" ||
        newTitle.length > 20 ||
        newCategory === "" ||
        newCategory.length > 20 ||
        newDescription === "" ||
        newDescription.length > 300 ||
        newDifficulty === ""
      ) {
        alert("All fields must be filled and within length limits.");
        return;
      }

      const originalTitle = todoItem
        .querySelector(".todo-title input")
        .getAttribute("value");
      const todoData = JSON.parse(localStorage.getItem(originalTitle))[0];
      localStorage.removeItem(originalTitle);
      localStorage.setItem(
        newTitle,
        JSON.stringify([
          {
            title: newTitle,
            description: newDescription,
            category: newCategory,
            difficulty: newDifficulty,
            status: todoData.status,
            elapsedTime: todoData.elapsedTime || 0,
            createdAt: todoData.createdAt || Date.now(),
          },
        ])
      );

      if (timers[newTitle]) {
        clearInterval(timers[newTitle].interval);
        delete timers[newTitle];
        timers[newTitle] = { interval: null, isRunning: false };
      }

      todoItem.querySelector(".todo-title").innerHTML = newTitle;
      todoItem.querySelector(".todo-category").innerHTML = newCategory;
      todoItem.querySelector(
        ".todo-description"
      ).innerHTML = `${newDescription}.`;
      todoItem.querySelector(".todo-difficulty").innerHTML = newDifficulty;
      todoItem.querySelector(
        ".todo-difficulty"
      ).className = `todo-difficulty difficulty-${newDifficulty}`;

      e.target.outerHTML = `<button class="action-btn edit">✏️ Edit</button>`;
      updateTodosText();
      updateFilterDropDown();
      sortTodo();
    } else if (e.target.classList.contains("delete")) {
      if (timers[todoTitle]) {
        clearInterval(timers[todoTitle].interval);
        delete timers[todoTitle];
      }
      localStorage.removeItem(todoTitle);
      todoItem.remove();
      updateTodosText();
      updateFilterDropDown();
      sortTodo();
    } else if (e.target.classList.contains("complete")) {
      const btnComplete = todoItem.querySelector(".action-btn.complete");
      const todoData = JSON.parse(localStorage.getItem(todoTitle))[0];
      const newStatus = todoItem.classList.contains("complete")
        ? "incomplete"
        : "complete";

      todoItem.classList.toggle("complete");
      btnComplete.textContent = `✅ ${newStatus}`;

      localStorage.setItem(
        todoTitle,
        JSON.stringify([
          {
            title: todoData.title,
            description: todoData.description,
            category: todoData.category,
            difficulty: todoData.difficulty,
            status: newStatus,
            elapsedTime: todoData.elapsedTime || 0,
            createdAt: todoData.createdAt || Date.now(),
          },
        ])
      );
      updateTodosText();
      sortTodo();
    } else if (e.target.classList.contains("start")) {
      if (!timers[todoTitle] || !timers[todoTitle].isRunning) {
        timers[todoTitle] = {
          interval: setInterval(() => updateTimer(todoItem, todoTitle), 1000),
          isRunning: true,
        };
      }
    } else if (e.target.classList.contains("stop")) {
      if (timers[todoTitle] && timers[todoTitle].isRunning) {
        clearInterval(timers[todoTitle].interval);
        timers[todoTitle].isRunning = false;
      }
    } else if (e.target.classList.contains("reset")) {
      if (timers[todoTitle]) {
        clearInterval(timers[todoTitle].interval);
        timers[todoTitle].isRunning = false;
      }
      const todoData = JSON.parse(localStorage.getItem(todoTitle))[0];
      todoData.elapsedTime = 0;
      localStorage.setItem(
        todoTitle,
        JSON.stringify([
          {
            title: todoData.title,
            description: todoData.description,
            category: todoData.category,
            difficulty: todoData.difficulty,
            status: todoData.status,
            elapsedTime: 0,
            createdAt: todoData.createdAt || Date.now(),
          },
        ])
      );
      todoItem.querySelector(".todo-time span").textContent = `Time: 00:00:00`;
      updateTodosText();
    }
  });
});
