-- Seed data for Kebab Restaurant Review application

-- Insert restaurants
INSERT INTO restaurants (name, visitation_date) VALUES
('Ada Eethuis', '2025-04-28'),
('Ali Baba', '2025-09-02');

-- Insert themes
INSERT INTO themes (name) VALUES
('maaltijd'),
('service'),
('gesprek');

-- Insert criteria for each theme
-- Maaltijd criteria
INSERT INTO criteria (name, theme_id) VALUES
('knapperigheid brood', (SELECT id FROM themes WHERE name = 'maaltijd')),
('niet-wakheid frieten', (SELECT id FROM themes WHERE name = 'maaltijd')),
('verse groenten', (SELECT id FROM themes WHERE name = 'maaltijd')),
('sappig vlees', (SELECT id FROM themes WHERE name = 'maaltijd')),
('krokante falafel', (SELECT id FROM themes WHERE name = 'maaltijd')),
('grootte portie', (SELECT id FROM themes WHERE name = 'maaltijd'));

-- Service criteria
INSERT INTO criteria (name, theme_id) VALUES
('vriendelijkheid', (SELECT id FROM themes WHERE name = 'service')),
('snelheid', (SELECT id FROM themes WHERE name = 'service')),
('interieur', (SELECT id FROM themes WHERE name = 'service'));

-- Gesprek criteria
INSERT INTO criteria (name, theme_id) VALUES
('vlotheid', (SELECT id FROM themes WHERE name = 'gesprek')),
('diepgang', (SELECT id FROM themes WHERE name = 'gesprek')),
('ongemakkelijke stiltes', (SELECT id FROM themes WHERE name = 'gesprek'));