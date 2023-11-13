INSERT INTO department (department_name) VALUES
    ('Sales'),
    ('Engineering'),
    ('Finance'),
    ('Legal');

INSERT INTO role (title, salary, department_id) VALUES
    ('Sales Manager', 80000.00, 1),
    ('Salesperson', 60000.00, 1),
    ('Lead Engineer', 92000.00, 2),
    ('Software Engineer', 86000.00, 2),
    ('Account Manager', 82000.00, 3),
    ('Accountant', 75000.00, 3),
    ('Legal Team Lead', 82000.00, 4),
    ('Lawyer', 74000.00, 4);
    

INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
    ('Jordan', 'Belfort', 1, NULL),
    ('Donnie', 'Azoff', 2, NULL),
    ('Alan', 'Turing', 3, NULL),
    ('Steve', 'Jobs', 4, NULL),
    ('Bill', 'Gates', 4, NULL),
    ('Christian', 'Wolff', 5, NULL),
    ('Ed', 'Chilton', 6, NULL),
    ('Mickey', 'Haller', 7, NULL),
    ('Robert', 'Shapiro', 7, NULL),
    ('Robert', 'Kardashian', 8, NULL);