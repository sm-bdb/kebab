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

    // Get restaurant with averages from the combined view
    async getRestaurantWithAverages(restaurantId) {
        const { data, error } = await this.client
            .from('restaurant_averages_combined')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .single();

        if (error) {
            console.error('Error fetching restaurant averages:', error);
            throw error;
        }

        return data;
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
