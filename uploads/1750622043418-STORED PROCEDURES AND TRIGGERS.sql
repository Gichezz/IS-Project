SET SQL_SAFE_UPDATES = 0;
USE university1;  

-- 1:CREATE A PROCEDURE TO GIVE A RAISE OF 20000 TO ALL INSTRUCTORS WORKING FOR EACH DEPARTMENT
DELIMITER //
CREATE PROCEDURE giveRaiseToAll()
BEGIN
    UPDATE instructor
    SET salary = salary + 20000;
END //
DELIMITER ;

CALL giveRaiseToAll();

-- VERIFY-Check updated salaries
SELECT ID, name, salary FROM instructor;


--  2:CREATE A PROCEDURE TO KEEP TRACK OF THE TOTAL SALARIES OF INSTRUCTORS
-- Deletes old department salary totals and recalculates them based on current instructor data.

-- : Create the department salary summary table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS deptsal (
    dept_name VARCHAR(50) PRIMARY KEY,
    total_salary DECIMAL(10,2)
);
DELIMITER //
CREATE PROCEDURE updateDeptSalaries()
BEGIN
    -- Clear previous totals
    DELETE FROM deptsal;

    -- Insert updated totals per department
    INSERT INTO deptsal (dept_name, total_salary)
    SELECT dept_name, SUM(salary)
    FROM instructor
    GROUP BY dept_name;
END //
DELIMITER ;
CALL updateDeptSalaries();
-- VERIFY OUTPUT- View total salary per department
SELECT * FROM deptsal;

-- 3: WRITE A FUNCTION TO RETURN ALL INSTRUCTORS IN A GIVEN DEPARTMENT
-- Returns a list of instructor names in a department as a single comma-separated string
DELIMITER //
CREATE FUNCTION getInstructors(dept VARCHAR(50))
RETURNS TEXT
DETERMINISTIC
BEGIN
    DECLARE result TEXT DEFAULT '';
    
    SELECT GROUP_CONCAT(name SEPARATOR ', ')
    INTO result
    FROM instructor
    WHERE dept_name = dept;

    RETURN result;
END //
DELIMITER ;
-- Call the function (example for 'Physics' department)
SELECT getInstructors('Physics') AS instructors_in_physics;


-- 4:CREATE A TRIGGER TO UPDATE THE TOTAL SALARY OF A DEPARTMENT WHEN A NEW INSTRUCTOR IS HIRED
-- Automatically updates department salary when a new instructor is inserted
DELIMITER //

CREATE TRIGGER after_instructor_insert
AFTER INSERT ON instructor
FOR EACH ROW
BEGIN
    UPDATE deptsal
    SET total_salary = total_salary + NEW.salary
    WHERE dept_name = NEW.dept_name;
END //

DELIMITER ;

-- VERIFY: Insert a new instructor and check deptsal
INSERT INTO instructor (ID, name, dept_name, salary)
VALUES ('99993', 'Instructor2', 'Physics', 50000);

-- Verify: Check department salary table
SELECT * FROM deptsal WHERE dept_name = 'Physics';



-- 5: CREATE A TRIGGER TO UPDATE THE TOTAL SALARY OF A DEPARTMENT WHEN AN INSTRUCTOR TUPLE IS MODIFIED
 
-- Keeps department total salary accurate when an instructor’s salary or department changes
DELIMITER //

CREATE TRIGGER after_instructor_update
AFTER UPDATE ON instructor
FOR EACH ROW
BEGIN
    IF OLD.dept_name = NEW.dept_name THEN
        -- Same department: just update the salary difference
        UPDATE deptsal
        SET total_salary = total_salary - OLD.salary + NEW.salary
        WHERE dept_name = NEW.dept_name;
    ELSE
        -- Moved to a different department
        UPDATE deptsal
        SET total_salary = total_salary - OLD.salary
        WHERE dept_name = OLD.dept_name;

        UPDATE deptsal
        SET total_salary = total_salary + NEW.salary
        WHERE dept_name = NEW.dept_name;
    END IF;
END //

DELIMITER ;

-- Test: Update instructor's salary or department
UPDATE instructor
SET salary = 60000
WHERE ID = '99992';

-- OR: Move them to a different department
-- UPDATE instructor
-- SET dept_name = 'Mathematics'
-- WHERE ID = '99991';

-- Verify: Check both old and new departments
SELECT * FROM deptsal;

