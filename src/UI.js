import './style.css';
import {eachDayOfInterval, format, addDays} from 'date-fns';

export default function generateUI() {
    let taskCounter = 0;
    let taskArray = []
    let projectsArray = ['Inbox'];

    const taskObject = (title, description, dueDate, priority, project) => {
        let completed = false;
        let id = taskCounter += 1;
        return {completed, title, dueDate, priority, description, project, id};
    }

    const pages = (title, icon, link) => {
        return {title, icon, link};
    }

    const formElements = (camelCase, stringLabel, element, misc) => {
        return {camelCase, stringLabel, element, misc}
    }

    function toggleNav() {
        document.body.classList.toggle('collapse');
    }

    function changeStatus() {
        taskArray.find((task) => task.id == this.parentNode.parentNode.id).completed = this.checked;
    }

    // Arrays
    const homePagesArray = ['Inbox', 'Today', 'Upcoming'];
    const CATEGORY = [{category: 'Home', subcategory: homePagesArray}, {category: 'Projects', subcategory: projectsArray}];

    const headerArray = [pages('Menu', 'menu', toggleNav), pages('Add New Task', 'add', generateForm)];
    const taskOptionArray = [pages('details-btn', 'read_more', toggleDetails), pages('edit-btn', 'edit', openEditTaskModal), pages('delete-btn', 'delete', deleteTask)];

    // Modal Form Arrays
    const priorityArray = ['Low', 'Medium', 'High'];
    const newTaskArray = [formElements('title', 'Title', 'input', 'text'), formElements('description', 'Description', 'textarea', ''), formElements('dueDate', 'Due Date', 'input', 'date'), formElements('priority', 'Priority', 'select', priorityArray), formElements('project', 'Project', 'select', projectsArray)];
    const newProject = [formElements('projectName', 'Name', 'input', 'text')];

    // Node References
    let tabsNodeList = [];
    let categoryNodeList = [];
    let widgetNodeList = [];
    let taskContainerNode;

    // Variables
    let currentActivePage;
    let noTaskMsg = "You do not have any task."
    const sevenDaysArray = (eachDayOfInterval({ start: addDays(new Date(), 1), end: addDays(new Date(), 7) })).map((date) => format(date, 'yyyy-MM-dd'));

    // Generate Main Layout Components
    const header = document.createElement('header');
    const h1 = document.createElement('h1');
    h1.textContent = document.title;
    header.append(h1);
    const main = document.createElement('main');
    const menu = document.createElement('nav');

    // Generate Header Icons
    for (let item of headerArray) {
        const headerIcon = document.createElement('span');
        headerIcon.classList.add('material-icons-round', 'md-36');
        headerIcon.textContent = item.icon;
        headerIcon.onclick = item.link.bind(item);
        (item.icon == 'menu') ? header.insertBefore(headerIcon, h1) : header.append(headerIcon);
    }

    // Generate Nav/Sidebar Content
    CATEGORY.forEach((cat) => {
        const catContainer = document.createElement('ul');
        catContainer.id = cat.category.toLowerCase();
        menu.appendChild(catContainer);
        const catName = document.createElement('h2');
        catName.textContent = cat.category;
        catContainer.appendChild(catName);
        categoryNodeList.push(catContainer);
        displayTabs(catContainer, cat.subcategory);
    })

    // Generate Add Project Button
    const addProjectObj = pages('Add Project', 'add', generateForm);
    const addProjectBtn = document.createElement('button');
    addProjectBtn.classList.add('add-project-btn');
    addProjectBtn.textContent = addProjectObj.title;
    addProjectBtn.onclick = addProjectObj.link.bind(addProjectObj);
    menu.append(addProjectBtn);

    // Generate Side Tabs
    function displayTabs(nodeContainer, array) {
        for (let tab of array) {
            if (nodeContainer == categoryNodeList[1] && tab == 'Inbox') continue; // Ignore Inbox from projectsArray

            const tabKey = document.createElement('li');
            tabKey.classList.add('tab');
            const tabName = document.createElement('p');
            tabName.textContent = tab;
            const tabIcon = document.createElement('span');
            tabIcon.classList.add('material-icons-round');
            tabIcon.textContent = (tab == 'Inbox') ? 'inbox' : (tab == 'Today') ? 'today' : (tab == 'Upcoming') ? 'date_range' : 'list';
            tabKey.onclick = generatePage.bind(tab);
            tabKey.append(tabIcon, tabName);
            tabsNodeList.push(tabKey);

            if (nodeContainer == categoryNodeList[1]) {createProjDeleteBtn(tabKey)};

            nodeContainer.appendChild(tabKey);
        }
    }

    // Generate Tab's Delete Button
    function createProjDeleteBtn(node) {
        const deleteContainer = document.createElement('span');
        deleteContainer.classList.add('delete');
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('material-icons-round');
        deleteBtn.textContent = 'close';
        deleteBtn.onclick = deleteProject;
        deleteContainer.appendChild(deleteBtn);
        node.appendChild(deleteContainer);
    }

    // Delete Function
    function deleteProject(e) {
        e.stopPropagation();
        // Remove logically
        const deletedTab = e.target.parentNode.previousSibling.textContent;
        projectsArray.splice(projectsArray.indexOf(deletedTab), 1);
        // Update storage
        localStorage.setItem("cachedProjectsArray", JSON.stringify(projectsArray));
        // Removes all projects task
        for (let i = 0; i < taskArray.length; i++) {if (taskArray[i].project == deletedTab) {taskArray.splice(i, 1)}};
        // Remove project display
        (tabsNodeList.find((tabNode) => tabNode == e.target.parentNode.parentNode)).remove();
        // Redirect to Today Tab
        generatePage.call(homePagesArray[1]);
    }

    // Generate Tab Page
    function generatePage() {
        currentActivePage = this;

        // Selected Tab Effect
        for (let tab of tabsNodeList) (this == tab.firstChild.nextSibling.textContent) ? tab.classList.add('selected') : tab.classList.remove('selected');
        // Refresh Main Content
        main.textContent = '';

        const tabTitle = document.createElement('h2');
        tabTitle.textContent = this;
        const taskContainer = document.createElement('div');
        taskContainer.classList.add('task-container');
        taskContainerNode = taskContainer;

        const pageTaskArray = (this == 'Today') ? taskArray.filter((task) => task.dueDate == format(new Date(), 'yyyy-MM-dd')) :
        (this == 'Upcoming') ? taskArray.filter((task) => sevenDaysArray.includes(task.dueDate)) : taskArray.filter((task) => task.project == this);

        displayTask(taskContainer, pageTaskArray);
    
        if (taskContainer.textContent == '') {taskContainer.textContent = noTaskMsg};
        main.append(tabTitle, taskContainer);
    }

    function displayTask(nodeContainer, array) {
        for (let task of array) {
            const div = document.createElement('div');
            div.classList.add('task-div');
            const mainDiv = document.createElement('div');
            mainDiv.classList.add('main-div');
            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('details-div');


            for (let [key, value] of Object.entries(task)) {
                switch (key) {
                    case 'id':
                        div.id = value;
                        break;
                    case 'completed':
                        const checkBox = document.createElement('input');
                        checkBox.setAttribute('type', 'checkbox');
                        checkBox.checked = value;
                        checkBox.classList.add(`${key}`);
                        checkBox.addEventListener('change', changeStatus);
                        mainDiv.appendChild(checkBox);
                        break;
                    case 'priority':
                        div.style.borderLeft = (value == 'High') ? 'thick solid var(--secondary-color)' : 
                        (value == 'Medium') ? 'thick solid var(--main-color)' :
                        'thick solid green';
                    case 'description':
                    case 'project':
                        const keyValue = document.createElement('span');
                        const title = document.createElement('h3');
                        title.textContent = key;
                        const detail = document.createElement('p');
                        detail.textContent = value;
                        detail.classList.add(`${key}`);
                        keyValue.append(title, detail);
                        detailsDiv.appendChild(keyValue);
                        detailsDiv.style.display = 'none';
                        break;
                    default:
                        const span = document.createElement('span');
                        span.textContent = value;
                        span.classList.add(`${key}`);
                        mainDiv.appendChild(span);
                }
            }

            taskOptionArray.forEach((key) => {
                let icon = document.createElement('span');
                icon.classList.add('material-icons-round', key.title);
                icon.textContent = key.icon;
                icon.onclick = (key.title == 'edit-btn') ? function() {(key.link.bind(icon))(div.id)}: key.link;
                mainDiv.appendChild(icon);
            })

            div.append(mainDiv, detailsDiv);
            nodeContainer.appendChild(div);
        }
    }

    // TASK BUTTON OPTIONS
    function openEditTaskModal(id) {
        if (this.previousSibling.classList.contains('details-selected')) toggleDetails.call(this.previousSibling);
        // Opens Edit Task Form
        generateForm.bind({title: 'Edit Task'})(taskArray.find((task) => task.id == id));
    }

    function deleteTask() {
        // Remove logically
        taskArray.splice(taskArray.findIndex((task) => task.id == this.parentNode.parentNode.id), 1);
        // Update storage
        localStorage.setItem("cachedTasks", JSON.stringify(taskArray));
        // Remove display
        (this.parentNode.parentNode).remove();
        // Display Message
        if (taskContainerNode.textContent == '') taskContainerNode.textContent = noTaskMsg;
    }

    function toggleDetails() {
        this.classList.toggle('details-selected');
        (this.parentNode.nextSibling.style.display === "none") ? this.parentNode.nextSibling.style.display  = "flex" : this.parentNode.nextSibling.style.display  = "none";
    }

    // Generate Modal
    const modalBg = document.createElement('div');
    modalBg.classList.add('modal');
    const modalContainer = document.createElement('div');
    modalContainer.classList.add('modal-content');
    const exitBtn = document.createElement('span');
    exitBtn.classList.add('close-button');
    exitBtn.textContent = '×';
    modalContainer.append(exitBtn);
    modalBg.append(modalContainer);

    // Exit Modal Function
    exitBtn.addEventListener("click", closeModal);
    window.addEventListener("click", function(e) {if (e.target == modalBg) closeModal()})
    function closeModal() {modalBg.classList.remove("show-modal")};

    // Generate Form
    function generateForm(task) {
        if (modalContainer.childElementCount == 2) {(modalContainer.firstChild.nextSibling).remove()};
        document.querySelector('.modal').classList.add('show-modal');

        // Initialize Form
        const modalForm = document.createElement('form');
        modalForm.action = '#';
        modalForm.method = 'post';
        modalForm.id = (this.title.replace(/\s/g, '')).toLowerCase() + 'Form';
        const formTitle = document.createElement('h2');
        formTitle.textContent = this.title;
        modalForm.appendChild(formTitle);

        const formArray = (this.title == 'Add Project') ? newProject : newTaskArray;

        // Generate Form Elements
        for (let widget of formArray) {
            const widgetContainer = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = widget.stringLabel;
            const element = document.createElement(`${widget.element}`);
            element.name = widget.camelCase;
            widgetNodeList.push(element);

            switch (widget.element) {
                case 'input':
                    element.type = widget.misc;
                    switch (widget.camelCase) {
                        case 'projectName':
                            element.oninput = validateProjName;
                            element.setAttribute('maxlength', '20');
                        case 'title':
                            element.setAttribute('required', '');
                            break;
                    }
                    break;
                case 'textarea':
                    element.setAttribute('maxlength', '140');
                    element.placeholder = "140 characters maximum";
                    break;
                case 'select':
                    for (let value of widget.misc) {
                        const option = document.createElement('option');
                        option.value = value;
                        option.textContent = value;
                        element.appendChild(option);
                    }
                    break;
            }
            label.appendChild(element);
            widgetContainer.appendChild(label);
            modalForm.appendChild(widgetContainer);
        }

        // For Edit Task Form Only
        if (this.title == 'Edit Task') {for (let node of widgetNodeList) {node.value = task[node.name]}}

        // Generate Buttons
        const buttons = document.createElement('div');
        buttons.classList.add('buttons');
        [{type: 'button', text: 'Cancel'}, {type: 'submit', text: this.title}].forEach((btn) => {
            const button = document.createElement('button');
            button.type = btn.type;
            button.textContent = btn.text;
            // Cancel Button Function
            if (btn.type == 'button') {button.onclick = closeModal};
            buttons.appendChild(button);
        });

        // Submit Button Function
        modalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            (e.target.id == 'addprojectForm') ? addProject() : (e.target.id == 'addnewtaskForm') ? addNewTask() : updateTask.call(task);
            closeModal();
        });

        modalForm.appendChild(buttons);
        modalContainer.appendChild(modalForm);
    };

    function updateTask() {
        // Sets new values
        for (let [key, value] of Object.entries(getFormValues())) {this[key] = value};
        // Refreshes current page
        generatePage.call(currentActivePage);
        // Update storage
        localStorage.setItem("cachedTasks", JSON.stringify(taskArray));
    }

    function validateProjName() {
        (projectsArray.includes(this.value)) ? this.setCustomValidity("Project name already exist.") : this.setCustomValidity("");
    }

    // Add Project Button Function
    function addProject(proj) {
        let projectName = (proj) ? proj : document.getElementsByName("projectName")[0].value;
        // Append project logically
        projectsArray.push(projectName);
        // Update storage
        localStorage.setItem("cachedProjectsArray", JSON.stringify(projectsArray));
        // Display project UI
        displayTabs(categoryNodeList[1], [projectsArray[projectsArray.length - 1]]);
    }

    function getFormValues() {
        const title = document.getElementsByName("title")[0].value;
        const description = (document.getElementsByName("description")[0].value) ? (document.getElementsByName("description")[0].value) : 'N/A';
        const dueDate = (document.getElementsByName("dueDate")[0].value) ? document.getElementsByName("dueDate")[0].value : 'No Due Date';
        const priority = document.getElementsByName("priority")[0].value;
        const project = document.getElementsByName("project")[0].value;

        return {title, description, dueDate, priority, project};
    }

    // Add New Task Button Function
    function addNewTask(task) {
        let newTask = (task) ? task : getFormValues();
        // Append task logically
        taskArray.push(taskObject(newTask.title, newTask.description, newTask.dueDate, newTask.priority, newTask.project));
        // Update storage
        localStorage.setItem("cachedTasks", JSON.stringify(taskArray));

        // Execute if new task's project is currently on display
        if (newTask.project == currentActivePage) {
            // Remove Message
            if (taskContainerNode.textContent == noTaskMsg) taskContainerNode.textContent = '';
            // Display task UI
            displayTask(taskContainerNode, [taskArray[taskArray.length - 1]])
        };
    }

    // Make Inbox tab the main page
    generatePage.call(homePagesArray[0]);

    if (localStorage.cachedTasks) {
        const savedTasks = JSON.parse(localStorage.getItem("cachedTasks"));
        if (savedTasks) {savedTasks.forEach((task) => {addNewTask(task)})}
    }

    if (localStorage.cachedProjectsArray) {
        const savedProjectsArray = JSON.parse(localStorage.getItem("cachedProjectsArray"));
        for (let i = 1; i < savedProjectsArray.length; i++) {addProject(savedProjectsArray[i])}
    }
    
    document.body.append(header, menu, main, modalBg);
};