// API functions using Supabase JavaScript client
class SupabaseAPI {
    constructor() {
        this.client = supabaseClient;
    }

    // Get all restaurants
    async getRestaurants() {
        const { data, error } = await this.client
            .from('restaurants')
            .select('*')
            .order('id');
        
        if (error) {
            console.error('Error fetching restaurants:', error);
            throw error;
        }
        
        return data;
    }

    // Get all themes with criteria
    async getThemesWithCriteria() {
        const { data, error } = await this.client
            .from('themes')
            .select('*, criteria(*)');
        
        if (error) {
            console.error('Error fetching themes with criteria:', error);
            throw error;
        }
        
        return data;
    }

    // Get all criteria
    async getCriteria() {
        const { data, error } = await this.client
            .from('criteria')
            .select('*, themes(*)');
        
        if (error) {
            console.error('Error fetching criteria:', error);
            throw error;
        }
        
        return data;
    }

    // Get reviews for a specific restaurant
    async getReviewsForRestaurant(restaurantId) {
        const { data, error } = await this.client
            .from('reviews')
            .select('*')
            .eq('restaurant_id', restaurantId);
        
        if (error) {
            console.error('Error fetching reviews:', error);
            throw error;
        }
        
        return data;
    }

    // Get review details with criteria for reviews
    async getReviewDetails(reviewIds = null) {
        let query = this.client
            .from('review_details')
            .select('*, criteria(*)');
        
        if (reviewIds && reviewIds.length > 0) {
            query = query.in('review_id', reviewIds);
        }
        
        const { data, error } = await query;
        
        if (error) {
            console.error('Error fetching review details:', error);
            throw error;
        }
        
        return data;
    }

    // Get average ratings for a restaurant
    async getAverageRatings(restaurantId) {
        // Get all reviews for the restaurant
        const reviews = await this.getReviewsForRestaurant(restaurantId);
        if (reviews.length === 0) return { criteriaAverages: {}, overallAverage: 0 };

        const reviewIds = reviews.map(r => r.id);
        // Note: Already optimized - we need the reviews first to get reviewIds
        const reviewDetails = await this.getReviewDetails(reviewIds);

        // Calculate averages per criterium
        const criteriaAverages = {};
        const criteriaGroups = {};

        reviewDetails.forEach(detail => {
            const criteriumId = detail.criterium_id;
            const criteriumName = detail.criteria.name;
            
            if (!criteriaGroups[criteriumId]) {
                criteriaGroups[criteriumId] = {
                    name: criteriumName,
                    ratings: []
                };
            }
            criteriaGroups[criteriumId].ratings.push(detail.rating);
        });

        Object.keys(criteriaGroups).forEach(criteriumId => {
            const group = criteriaGroups[criteriumId];
            const average = group.ratings.reduce((sum, rating) => sum + rating, 0) / group.ratings.length;
            criteriaAverages[group.name] = Math.round(average * 10) / 10; // Round to 1 decimal
        });

        // Calculate overall average
        const allRatings = reviewDetails.map(detail => detail.rating);
        const overallAverage = allRatings.length > 0 
            ? Math.round((allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 10) / 10
            : 0;

        return { criteriaAverages, overallAverage };
    }

    // Create a new review
    async createReview(reviewData) {
        const { data, error } = await this.client
            .from('reviews')
            .insert([reviewData])
            .select();
        
        if (error) {
            console.error('Error creating review:', error);
            throw error;
        }
        
        return data[0];
    }

    // Create review details (ratings)
    async createReviewDetails(reviewDetailsArray) {
        const { data, error } = await this.client
            .from('review_details')
            .insert(reviewDetailsArray)
            .select();
        
        if (error) {
            console.error('Error creating review details:', error);
            throw error;
        }
        
        return data;
    }
}

// Create global API instance
const api = new SupabaseAPI();
