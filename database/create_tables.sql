-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'expert') DEFAULT 'expert',
    skills TEXT,             -- For experts only
    description TEXT,        -- For experts only
    files TEXT,              -- For experts only
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved TINYINT(1) DEFAULT 0, -- 0 = not approved, 1 = approved
    reset_token VARCHAR(255),
    reset_token_expires DATETIME
);
-- Payment Table
CREATE TABLE IF NOT EXISTS mpesa_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20),
    amount DECIMAL(10,2),
    mpesa_code VARCHAR(20),
    transaction_date DATETIME,
    service_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    
);
-- Session Requests table
CREATE TABLE session_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_id INT,
    skill_requested VARCHAR(100) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    student_email VARCHAR(100) NOT NULL,
    expert_id VARCHAR(36) DEFAULT NULL,
    requested_time DATETIME NOT NULL,
    status ENUM('pending', 'accepted', 'completed', 'rejected') DEFAULT 'pending',
    student_completed BOOLEAN DEFAULT FALSE,
    expert_completed BOOLEAN DEFAULT FALSE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (expert_id) REFERENCES users(id),
    FOREIGN KEY (skill_id) REFERENCES skills(id)
);

-- Table for activities happening in the system
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    type VARCHAR(50) NOT NULL, -- e.g., 'Registration', 'Expert Approval'
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expert_id INT NOT NULL,
    skill_name VARCHAR(100),
    hourly_rate DECIMAL(10, 2),
    description TEXT,
    proof_files VARCHAR(1000) NOT NULL DEFAULT '',
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES users(id),
);
-- Session feedback table
CREATE TABLE IF NOT EXISTS session_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES session_requests(id)
);
-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);