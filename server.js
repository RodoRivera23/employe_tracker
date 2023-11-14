const express = require('express');
const inquirer = require("inquirer");
const mysql = require('mysql2');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const conn = mysql.createConnection(
    {
        host: 'localhost',
        // MySQL username,
        user: 'root',
        // TODO: Add MySQL password
        password: '',
        database: 'employees_db'
    }
);

conn.connect((err) => {
    if (err) throw err;
    console.log("Connected to DB")
    start();
});

function start() {
    inquirer
        .prompt({
            type: "list",
            name: "action",
            message: "What would you like to do?",
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role",
                "Add an employee",
                "Update an employee role",
                "Exit",
            ],
        })
        .then((answer) => {
            switch (answer.action) {
                case "View all departments":
                    viewADepartments();
                    break;
                case "View all roles":
                    viewRoles();
                    break;
                case "View all employees":
                    viewEmployees();
                    break;
                case "Add a department":
                    addDepartment();
                    break;
                case "Add a role":
                    addRole();
                    break;
                case "Add an employee":
                    addEmployee();
                    break;
                case "Update an employee role":
                    updateEmployeeRole();
                    break;
                case "Exit":
                    conn.end();
                    console.log("Goodbye!");
                    break;
            }
        });
}

async function viewADepartments() {
    try {
        const [departments] = await conn.promise().query("SELECT * FROM department");
        console.table(departments);
    } catch (error) {
        console.error("An error occurred:", error);
    }
    start();
}

async function viewRoles() {
    try {
        const query = `
            SELECT role.title, role.id, department.department_name, role.salary
            FROM role
            JOIN department ON role.department_id = department.id
        `;

        const [rows] = await conn.promise().query(query);
        console.table(rows);

        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function viewEmployees() {
    const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager_name
    FROM employee e
    LEFT JOIN role r ON e.role_id = r.id
    LEFT JOIN department d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id;
    `;

    try {
        const [rows] = await conn.promise().query(query);
        console.table(rows);
    } catch (error) {
        console.error("An error occurred:", error);
    }

    start();
}

async function addDepartment() {
    try {
        const answer = await inquirer.prompt({
            type: "input",
            name: "name",
            message: "Enter the name for the new department:",
        });

        const query = "INSERT INTO department (department_name) VALUES (?)";
        const [result] = await conn.promise().query(query, [answer.name]);

        console.log(`Department ${answer.name} added to the employees database`);
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function addRole() {
    try {
        const [departments] = await conn.promise().query("SELECT * FROM department");

        const departmentOptions = departments.map(department => ({
            name: department.dep_name,
            value: department.id,
        }));

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter name for the new role:",
            },
            {
                type: "input",
                name: "salary",
                message: "Enter the salary for the new role:",
            },
            {
                type: "list",
                name: "departmentId",
                message: "Select a department to asign this new role:",
                choices: departmentOptions,
            },
        ]);

        const department = departments.find(dep => dep.id === answers.departmentId);

        const query = "INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)";
        const roleData = [answers.title, answers.salary, department.id];

        await conn.promise().query(query, roleData);

        console.log(`The role ${answers.title} was added to the ${department.dep_name} department`);
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function addEmployee() {
    try {
        const [roles] = await conn.promise().query("SELECT id, title FROM role");
        const [managers] = await conn.promise().query(
            'SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee'
        );

        const roleOptions = roles.map(({ id, title }) => ({ name: title, value: id }));
        const managerOptions = [{ name: "None", value: null }, ...managers.map(({ id, name }) => ({ name, value: id }))];

        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "firstName",
                message: "Enter the employee's first name:",
            },
            {
                type: "input",
                name: "lastName",
                message: "Enter the employee's last name:",
            },
            {
                type: "list",
                name: "roleId",
                message: "Select the employee role:",
                choices: roleOptions,
            },
            {
                type: "list",
                name: "managerId",
                message: "Select the employee manager:",
                choices: managerOptions,
            },
        ]);

        const query =
            "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)";
        const values = [
            answers.firstName,
            answers.lastName,
            answers.roleId,
            answers.managerId,
        ];

        await conn.promise().query(query, values);
        console.log("Employee added");
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function updateEmployeeRole() {
    try {
        const [employees] = await conn.promise().query(
            "SELECT employee.id, employee.first_name, employee.last_name, role.title FROM employee LEFT JOIN role ON employee.role_id = role.id"
        );

        const [roles] = await conn.promise().query("SELECT id, title FROM role");

        const employeeOptions = employees.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id,
        }));

        const roleOptions = roles.map(({ id, title }) => ({ name: title, value: id }));

        const answers = await inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Select the employee to update:",
                choices: employeeOptions,
            },
            {
                type: "list",
                name: "roleId",
                message: "Select the new role for the employee:",
                choices: roleOptions,
            },
        ]);

        const query = "UPDATE employee SET role_id = ? WHERE id = ?";
        const values = [answers.roleId, answers.employeeId];

        await conn.promise().query(query, values);
        console.log("Employee role updated successfully");
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function deleteDepartmentsRolesEmployees() {
    try {
        const answer = await inquirer.prompt({
            type: "list",
            name: "data",
            message: "What would you like to do?",
            choices: ["Delete Employee", "Delete Role", "Delete Department", "Back"],
        });

        switch (answer.data) {
            case "Delete Employee":
                await deleteEmployee();
                break;
            case "Delete Role":
                await deleteRole();
                break;
            case "Delete Department":
                await deleteDepartment();
                break;
            case "Back":
                start();
                break;
            default:
                console.log(`Invalid choice: ${answer.data}`);
                start();
                break;
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function deleteEmployee() {
    try {
        const [employees] = await conn.promise().query("SELECT id, first_name, last_name FROM employee");
        const employeeOptions = employees.map(employee => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
        }));
        employeeOptions.push({ name: "Go Back", value: "back" });

        const answer = await inquirer.prompt({
            type: "list",
            name: "employeeId",
            message: "Select the employee to delete:",
            choices: employeeOptions,
        });

        if (answer.employeeId === "back") {
            deleteDepartmentsRolesEmployees();
            return;
        }

        await conn.promise().query("DELETE FROM employee WHERE id = ?", [answer.employeeId]);
        console.log(`Employee ${answer.employeeId} has been deleted.`);
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function deleteRole() {
    try {
        const [roles] = await conn.promise().query("SELECT id, title FROM role");
        const rolesOptions = roles.map(role => ({
            name: role.title,
            value: role.id,
        }));
        rolesOptions.push({ name: "Go Back", value: "back" });

        const answer = await inquirer.prompt({
            type: "list",
            name: "roleId",
            message: "Select the role you want to delete:",
            choices: rolesOptions,
        });

        if (answer.roleId === "back") {
            deleteDepartmentsRolesEmployees();
            return;
        }

        await conn.promise().query("DELETE FROM role WHERE id = ?", [answer.roleId]);
        console.log(`Role ${answer.roleId} has been deleted.`);
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function deleteDepartment() {
    try {
        const [departments] = await conn.promise().query("SELECT id, department_name AS name FROM department");
        const departmentOptions = departments.map(department => ({
            name: department.name,
            value: department.id,
        }));
        departmentOptions.push({ name: "Go Back", value: "back" });

        const answer = await inquirer.prompt({
            type: "list",
            name: "departmentId",
            message: "Select the department you want to delete:",
            choices: departmentOptions,
        });

        if (answer.departmentId === "back") {
            deleteDepartmentsRolesEmployees();
            return;
        }

        await conn.promise().query("DELETE FROM department WHERE id = ?", [answer.departmentId]);
        console.log(`Department ${answer.departmentId} has been deleted.`);
        start();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

process.on("exit", () => {
    conn.end();
});