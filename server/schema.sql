CREATE TABLE animals (
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
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active','completed','finalized') NOT NULL DEFAULT 'active',
  receipt_url TEXT,
  completed_at DATETIME DEFAULT NULL,
  finalized_at DATETIME DEFAULT NULL
);

CREATE TABLE donations (
  id int NOT NULL AUTO_INCREMENT,
  animal_id int DEFAULT NULL,
  clerk_user_id varchar(191) NOT NULL,
  donor_name varchar(120) NULL,
  amount int NOT NULL,
  status enum('pending','paid','failed','cancelled') NOT NULL DEFAULT 'pending',
  paymongo_checkout_id varchar(191) DEFAULT NULL,
  paymongo_payment_id varchar(191) DEFAULT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY animal_id (animal_id),
  CONSTRAINT donations_ibfk_1 FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  animal_id INT DEFAULT NULL,
  message VARCHAR(255) NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY animal_id (animal_id),
  CONSTRAINT notifications_ibfk_1 FOREIGN KEY (animal_id) REFERENCES animals (id) ON DELETE SET NULL
);

