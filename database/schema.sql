-- Kebab Restaurant Review Database Schema

-- Create tables
CREATE TABLE restaurants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    visitation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE criteria (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    theme_id INTEGER REFERENCES themes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    comment TEXT,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_details (
    id SERIAL PRIMARY KEY,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
    criterium_id INTEGER REFERENCES criteria(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, criterium_id)
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_review_details_review_id ON review_details(review_id);
CREATE INDEX idx_review_details_criterium_id ON review_details(criterium_id);
CREATE INDEX idx_criteria_theme_id ON criteria(theme_id);

-- View to calculate average rating per criterium per restaurant
CREATE OR REPLACE VIEW restaurant_criterium_averages AS
SELECT
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    c.id AS criterium_id,
    c.name AS criterium_name,
    t.id AS theme_id,
    t.name AS theme_name,
    ROUND(AVG(rd.rating), 1) AS average_rating
FROM restaurants r
CROSS JOIN criteria c
LEFT JOIN themes t ON c.theme_id = t.id
LEFT JOIN reviews rev ON rev.restaurant_id = r.id
LEFT JOIN review_details rd ON rd.review_id = rev.id AND rd.criterium_id = c.id
GROUP BY r.id, r.name, c.id, c.name, t.id, t.name;

-- View to calculate total average rating per restaurant (across all criteria)
CREATE OR REPLACE VIEW restaurant_total_averages AS
SELECT
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    ROUND(AVG(rd.rating), 1) AS average_rating,
    json_agg(
        jsonb_build_object(
            'id', rev.id,
            'username', rev.username,
            'comment', rev.comment,
            'review_date', rev.review_date
        )
    ) FILTER (WHERE rev.comment IS NOT NULL AND rev.comment != '') AS comments
FROM restaurants r
LEFT JOIN reviews rev ON rev.restaurant_id = r.id
LEFT JOIN review_details rd ON rd.review_id = rev.id
GROUP BY r.id, r.name;

-- Combined view with restaurant info, total average, criterium averages, and comments as JSON
CREATE OR REPLACE VIEW restaurant_averages_combined AS
SELECT
    rta.restaurant_id,
    rta.restaurant_name,
    rta.average_rating,
    rta.comments,
    json_agg(
        jsonb_build_object(
            'criterium_id', rca.criterium_id,
            'criterium_name', rca.criterium_name,
            'theme_id', rca.theme_id,
            'theme_name', rca.theme_name,
            'average_rating', rca.average_rating
        )
    ) AS criterium_averages
FROM restaurant_total_averages rta
LEFT JOIN restaurant_criterium_averages rca ON rta.restaurant_id = rca.restaurant_id
GROUP BY rta.restaurant_id, rta.restaurant_name, rta.average_rating, rta.comments;