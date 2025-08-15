-- Insert sample users
INSERT IGNORE INTO users (name, email, password) VALUES
('John Doe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm'),
('Jane Smith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm'),
('Bob Wilson', 'bob@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm');

-- Insert expense categories
INSERT IGNORE INTO categories (name, icon, color) VALUES
('Food & Dining', '🍽️', '#FF6B6B'),
('Transportation', '🚗', '#4ECDC4'),
('Entertainment', '🎬', '#45B7D1'),
('Shopping', '🛍️', '#96CEB4'),
('Utilities', '💡', '#FFEAA7'),
('Travel', '✈️', '#DDA0DD'),
('Healthcare', '🏥', '#98D8C8'),
('General', '📝', '#95A5A6');
