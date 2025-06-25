CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'expert', 'admin') NOT NULL,
    skills TEXT, 
    description TEXT, -- only used for experts
    files TEXT -- comma-separated list of uploaded file names
    approved TINYINT(1) DEFAULT 0 -- 0 = not approved, 1 = approved
);
CREATE TABLE IF NOT EXISTS mpesa_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20),
    amount DECIMAL(10,2),
    mpesa_code VARCHAR(20),
    transaction_date DATETIME,
    service_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE session_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_requested VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    expert_id INT DEFAULT NULL,
    requested_time DATETIME NOT NULL,
    status ENUM('pending', 'accepted', 'completed', 'rejected') DEFAULT 'pending',
    student_completed BOOLEAN DEFAULT FALSE,
    expert_completed BOOLEAN DEFAULT FALSE,
    meeting_link TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (expert_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    type VARCHAR(50) NOT NULL, -- e.g., 'Registration', 'Expert Approval'
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
