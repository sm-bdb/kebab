// Main application logic
class KebabReviewApp {
    constructor() {
        this.restaurants = [];
        this.criteria = [];
        this.themes = [];
        this.currentRestaurantId = null;
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderRestaurantList();
    }

    async loadData() {
        try {
            // Load restaurants, criteria, and themes in parallel
            [this.restaurants, this.criteria, this.themes] = await Promise.all([
                api.getRestaurants(),
                api.getCriteria(),
                api.getThemesWithCriteria()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Fout bij het laden van gegevens. Controleer je internetverbinding.');
        }
    }

    setupEventListeners() {
        // Close modal
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal when clicking outside
        document.getElementById('review-modal').addEventListener('click', (e) => {
            if (e.target.id === 'review-modal') {
                this.closeModal();
            }
        });

        // Form submission
        document.getElementById('review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });
    }

    transformRestaurantData(restaurantData) {
        // Transform the view data to the format expected by createRestaurantCard
        const criteriaAverages = {};

        if (restaurantData.criterium_averages && Array.isArray(restaurantData.criterium_averages)) {
            restaurantData.criterium_averages.forEach(criterium => {
                if (criterium.average_rating !== null) {
                    criteriaAverages[criterium.criterium_name] = criterium.average_rating;
                }
            });
        }

        return {
            criteriaAverages,
            overallAverage: restaurantData.average_rating || 0
        };
    }

    async renderRestaurantList() {
        const container = document.getElementById('restaurant-list');
        container.innerHTML = '<div class="text-center">Restaurants laden...</div>';

        try {
            // Sort restaurants by visitation_date in descending order (most recent first)
            const sortedRestaurants = [...this.restaurants].sort((a, b) => {
                // Handle null/undefined dates by putting them at the end
                if (!a.visitation_date && !b.visitation_date) return 0;
                if (!a.visitation_date) return 1;
                if (!b.visitation_date) return -1;

                // Sort by date descending
                return new Date(b.visitation_date) - new Date(a.visitation_date);
            });

            const restaurantCards = await Promise.all(
                sortedRestaurants.map(async (restaurant) => {
                    // Fetch restaurant data with averages using the view (single API call)
                    const restaurantData = await api.getRestaurantWithAverages(restaurant.id);

                    // Transform the data from the view to the format expected by createRestaurantCard
                    const averages = this.transformRestaurantData(restaurantData);

                    // Get comments from the view data
                    const commentsWithContent = restaurantData.comments || [];

                    return await this.createRestaurantCard(restaurant, averages, commentsWithContent);
                })
            );

            container.innerHTML = restaurantCards.join('');

            // Add click handlers for review buttons
            sortedRestaurants.forEach(restaurant => {
                const button = document.getElementById(`review-btn-${restaurant.id}`);
                button.addEventListener('click', () => this.openReviewModal(restaurant));
            });

            // Add click handlers for comment toggles
            sortedRestaurants.forEach(restaurant => {
                const toggle = document.getElementById(`comments-toggle-${restaurant.id}`);
                if (toggle) {
                    toggle.addEventListener('click', () => this.toggleComments(restaurant.id));
                }
            });

        } catch (error) {
            console.error('Error rendering restaurants:', error);
            container.innerHTML = '<div class="text-center text-red-600">Fout bij het laden van restaurants.</div>';
        }
    }

    async createRestaurantCard(restaurant, averages, comments) {
        const visitationDate = restaurant.visitation_date
            ? new Date(restaurant.visitation_date).toLocaleDateString('nl-NL')
            : 'Nog niet bezocht';

        const criteriaByTheme = this.groupCriteriaByTheme(averages.criteriaAverages);
        const criteriaList = Object.entries(criteriaByTheme)
            .map(([theme, criteria]) => 
                `<div class="mb-3">
                    <h5 class="font-bold text-verge-green text-sm capitalize tracking-wide">${theme}</h5>
                    ${criteria.map(([criterium, rating]) => 
                        `<div class="flex justify-between text-xs ml-2 py-0.5">
                            <span class="text-gray-300">${criterium}:</span>
                            <span class="font-medium text-white">${this.renderStars(rating)} (${rating})</span>
                        </div>`
                    ).join('')}
                </div>`
            ).join('');

        const hasComments = comments.length > 0;
        const commentsSection = hasComments ? `
            <div class="mt-4">
                <button id="comments-toggle-${restaurant.id}" class="text-verge-green hover:text-green-300 text-sm font-semibold">
                    💬 ${comments.length} reactie${comments.length !== 1 ? 's' : ''} - Tonen/Verbergen
                </button>
                <div id="comments-${restaurant.id}" class="hidden mt-2 space-y-2">
                    ${comments.map(comment => `
                        <div class="bg-gray-800 p-3 rounded border border-gray-700 text-sm">
                            <div class="font-semibold text-verge-green">${comment.username}</div>
                            <div class="text-gray-300 mt-1">${comment.comment}</div>
                            <div class="text-xs text-gray-500 mt-1">${new Date(comment.review_date).toLocaleDateString('nl-NL')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        return `
            <div class="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-all duration-200">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                            <h2 class="text-2xl font-bold text-white tracking-tight">${restaurant.name}</h2>
                            ${averages.overallAverage > 0 ? `
                                <span class="flex items-center gap-1 text-lg font-bold text-verge-green">
                                    ${this.renderStars(averages.overallAverage)} (${averages.overallAverage})
                                </span>
                            ` : ''}
                        </div>
                        <p class="text-gray-400 font-medium">Bezocht: ${visitationDate}</p>
                    </div>
                    <button id="review-btn-${restaurant.id}"
                            class="bg-verge-green hover:bg-green-300 text-black px-4 py-2 rounded font-semibold text-sm transition-all duration-200 whitespace-nowrap shrink-0">
                        + Review toevoegen
                    </button>
                </div>
                
                ${averages.overallAverage > 0 ? `
                    <div class="mb-4">
                        
                        ${criteriaList ? `
                            <div class="bg-gray-800 p-4 rounded border border-gray-700">
                                ${criteriaList}
                            </div>
                        ` : ''}
                    </div>
                ` : `
                    <div class="mb-4 text-gray-500 text-center py-4">
                        Nog geen beoordelingen
                    </div>
                `}
                
                ${commentsSection}
            </div>
        `;
    }

    groupCriteriaByTheme(criteriaAverages) {
        const grouped = {};

        this.themes.forEach(theme => {
            theme.criteria.forEach(criterium => {
                if (criteriaAverages[criterium.name]) {
                    if (!grouped[theme.name]) {
                        grouped[theme.name] = [];
                    }
                    grouped[theme.name].push([criterium.name, criteriaAverages[criterium.name]]);
                }
            });
        });

        return grouped;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Full stars (filled green)
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<svg class="inline w-4 h-4 text-verge-green fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }

        // Half star (if applicable)
        if (hasHalfStar) {
            starsHtml += '<svg class="inline w-4 h-4 text-verge-green fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
        
        // Empty stars (gray)
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<svg class="inline w-4 h-4 text-gray-300 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
        }
        
        return starsHtml;
    }

    toggleComments(restaurantId) {
        const commentsDiv = document.getElementById(`comments-${restaurantId}`);
        commentsDiv.classList.toggle('hidden');
    }

    openReviewModal(restaurant) {
        this.currentRestaurantId = restaurant.id;
        document.getElementById('modal-title').textContent = `Review voor ${restaurant.name}`;

        // Reset form
        document.getElementById('review-form').reset();

        // Load criteria grouped by theme
        this.renderCriteriaForm();

        // Show modal
        document.getElementById('review-modal').classList.remove('hidden');
        document.getElementById('review-modal').classList.add('flex');
    }

    renderCriteriaForm() {
        const container = document.getElementById('criteria-list');

        try {
            const criteriaHtml = this.themes.map(theme => {
                const criteriaItems = theme.criteria.map(criterium => `
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-300 mb-2">${criterium.name}</label>
                        <div class="flex space-x-1" data-criterium="${criterium.id}">
                            ${[1, 2, 3, 4, 5].map(rating => `
                                <label class="flex items-center star-rating" data-rating="${rating}">
                                    <input type="radio" name="criterium_${criterium.id}" value="${rating}" 
                                           class="sr-only">
                                    <svg class="cursor-pointer w-6 h-6 text-gray-300 fill-current star-icon" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </label>
                            `).join('')}
                            <label class="flex items-center ml-4">
                                <input type="radio" name="criterium_${criterium.id}" value="" checked class="sr-only">
                                <span class="cursor-pointer text-sm text-verge-green skip-option">Geen beoordeling</span>
                            </label>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="mb-6">
                        <h4 class="text-lg font-bold text-verge-green mb-3 capitalize tracking-wide">${theme.name}</h4>
                        <div class="pl-4 border-l-2 border-gray-700">
                            ${criteriaItems}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = criteriaHtml;
            
            // Add star rating interaction
            this.setupStarRating();
        } catch (error) {
            console.error('Error loading criteria:', error);
            container.innerHTML = '<div class="text-red-600">Fout bij het laden van criteria.</div>';
        }
    }

    setupStarRating() {
        const starContainers = document.querySelectorAll('[data-criterium]');
        
        starContainers.forEach(container => {
            const stars = container.querySelectorAll('.star-rating');
            const skipOption = container.querySelector('.skip-option').parentElement.querySelector('input');
            
            // Add event listener for skip option
            skipOption.addEventListener('change', () => {
                if (skipOption.checked) {
                    this.updateStarDisplay(container);
                    this.updateSkipOption(container);
                }
            });
            
            stars.forEach((star, index) => {
                const starIcon = star.querySelector('.star-icon');
                const input = star.querySelector('input');
                
                // Hover effect
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(container, index + 1, 'hover');
                });
                
                // Remove hover effect
                container.addEventListener('mouseleave', () => {
                    this.updateStarDisplay(container);
                });
                
                // Click effect
                input.addEventListener('change', () => {
                    if (input.checked) {
                        this.updateStarDisplay(container);
                        this.updateSkipOption(container);
                    }
                });
            });
        });
    }
    
    highlightStars(container, rating, type) {
        const stars = container.querySelectorAll('.star-icon');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add(type === 'hover' ? 'text-green-300' : 'text-verge-green');
            } else {
                star.classList.remove('text-green-300', 'text-verge-green');
                star.classList.add('text-gray-300');
            }
        });
    }
    
    updateStarDisplay(container) {
        const checkedInput = container.querySelector('input[type="radio"]:checked');
        const stars = container.querySelectorAll('.star-icon');

        // Reset all stars
        stars.forEach(star => {
            star.classList.remove('text-green-300', 'text-verge-green');
            star.classList.add('text-gray-300');
        });

        // Highlight selected stars
        if (checkedInput && checkedInput.value !== '') {
            const rating = parseInt(checkedInput.value);
            this.highlightStars(container, rating, 'selected');
        }
    }

    updateSkipOption(container) {
        const checkedInput = container.querySelector('input[type="radio"]:checked');
        const skipOption = container.querySelector('.skip-option');

        if (checkedInput && checkedInput.value === '') {
            // Skip option is selected - highlight it
            skipOption.classList.remove('text-gray-400');
            skipOption.classList.add('text-verge-green');
        } else {
            // A star rating is selected - make skip option grey
            skipOption.classList.remove('text-verge-green');
            skipOption.classList.add('text-gray-400');
        }
    }

    closeModal() {
        document.getElementById('review-modal').classList.add('hidden');
        document.getElementById('review-modal').classList.remove('flex');
        this.currentRestaurantId = null;
    }

    async submitReview() {
        try {
            const formData = new FormData(document.getElementById('review-form'));
            const username = formData.get('username');
            const comment = formData.get('comment');

            if (!username.trim()) {
                this.showError('Voer een gebruikersnaam in.');
                return;
            }

            // Create review
            const reviewData = {
                username: username.trim(),
                comment: comment ? comment.trim() : null,
                restaurant_id: this.currentRestaurantId,
                review_date: new Date().toISOString().split('T')[0]
            };
	    
	    console.log(reviewData);

            const newReview = await api.createReview(reviewData);

            // Collect ratings
            const reviewDetails = [];
            this.criteria.forEach(criterium => {
                const rating = formData.get(`criterium_${criterium.id}`);
                if (rating && rating !== '') {
                    reviewDetails.push({
                        rating: parseInt(rating),
                        review_id: newReview.id,
                        criterium_id: criterium.id
                    });
                }
            });

            // Save ratings if any were provided
            if (reviewDetails.length > 0) {
                await api.createReviewDetails(reviewDetails);
            }

            this.closeModal();
            this.showSuccess('Review succesvol opgeslagen!');
            
            // Refresh the restaurant list
            await this.renderRestaurantList();

        } catch (error) {
            console.error('Error submitting review:', error);
            this.showError('Fout bij het opslaan van de review. Probeer het opnieuw.');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
            type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new KebabReviewApp();
});
