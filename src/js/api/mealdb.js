export class MealAPI {
  constructor() {
    this.baseUrl = 'https://www.themealdb.com/api/json/v1/1';
  }

  async getCategories() {
    const res = await fetch(`${this.baseUrl}/categories.php`);
    const data = await res.json();
    return data.categories || [];
  }

  async searchMeals(query = '') {
    const res = await fetch(`${this.baseUrl}/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.meals || [];
  }

  async getMealById(id) {
    const res = await fetch(`${this.baseUrl}/lookup.php?i=${id}`);
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
  }

  async filterByCategory(category) {
    const res = await fetch(`${this.baseUrl}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();
    return data.meals || [];
  }

  async getInitialMeals() {
    const meals = await this.searchMeals('a');
    if (meals.length < 25) {
      const chicken = await this.searchMeals('chicken');
      const combined = [...meals, ...chicken];
      const unique = Array.from(new Map(combined.map(m => [m.idMeal, m])).values());
      return unique.slice(0, 25);
    }
    return meals.slice(0, 25);
  }
}

export class ProductAPI {
  constructor() {
    this.searchUrl = 'https://world.openfoodfacts.org/cgi/search.pl';
    this.productUrl = 'https://world.openfoodfacts.org/api/v2/product';
  }

  async searchProducts(query, nutriScore = '') {
    let url = `${this.searchUrl}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=24`;
    if (nutriScore) url += `&nutriscore_grade=${nutriScore.toLowerCase()}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.products || [];
  }

  async getProductByBarcode(barcode) {
    const res = await fetch(`${this.productUrl}/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) return data.product;
    throw new Error('Product not found');
  }
}