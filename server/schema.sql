CREATE TABLE IF NOT EXISTS animals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category ENUM('donate','adopt') NOT NULL,
  name VARCHAR(120) NOT NULL,
  gender VARCHAR(20) DEFAULT NULL,
  breed VARCHAR(80) DEFAULT NULL,
  age VARCHAR(40) DEFAULT NULL,
  shelter VARCHAR(160) DEFAULT NULL,
  medical_needs TEXT,
  about TEXT,
  fb_link TEXT,
  image_url TEXT,
  goal_amount INT DEFAULT 0,
  raised_amount INT DEFAULT 0,
  status ENUM('active','completed','finalized') NOT NULL DEFAULT 'active',
  receipt_url TEXT,
  completed_at DATETIME DEFAULT NULL,
  finalized_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  animal_id INT DEFAULT NULL,
  clerk_user_id VARCHAR(191) NOT NULL,
  donor_name VARCHAR(120) DEFAULT NULL,
  amount INT NOT NULL,
  status ENUM('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  paymongo_checkout_id VARCHAR(191) DEFAULT NULL,
  paymongo_payment_id VARCHAR(191) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT donations_animal_fk
    FOREIGN KEY (animal_id)
    REFERENCES animals(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  animal_id INT DEFAULT NULL,
  message VARCHAR(255) NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_animal_fk
    FOREIGN KEY (animal_id)
    REFERENCES animals(id)
    ON DELETE SET NULL
);
