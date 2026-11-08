import { MealAPI, ProductAPI } from './api/mealdb.js';
import { AppState, NutritionEstimator } from './state/appState.js';
import { Components, Notify } from './ui/components.js';

class App {
  constructor() {
    this.mealAPI = new MealAPI();
    this.productAPI = new ProductAPI();
    this.state = new AppState();
    this.meals = [];
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    const overlay = document.getElementById('app-loading-overlay');
    if (overlay) {
      setTimeout(() => {
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.style.display = 'none', 500);
      }, 300);
    }
  }

  setupEventListeners() {
    const menuBtn = document.getElementById('header-menu-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');

    const toggleSidebar = (open) => {
      if (open) { sidebar.classList.add('open'); overlay.classList.add('active'); }
      else { sidebar.classList.remove('open'); overlay.classList.remove('active'); }
    };

    if (menuBtn) menuBtn.addEventListener('click', () => toggleSidebar(true));
    if (closeBtn) closeBtn.addEventListener('click', () => toggleSidebar(false));
    if (overlay) overlay.addEventListener('click', () => toggleSidebar(false));

    document.querySelectorAll('.nav-link').forEach((link, idx) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSidebar(false);
        if (idx === 0) window.location.hash = '#meals';
        else if (idx === 1) window.location.hash = '#products';
        else if (idx === 2) window.location.hash = '#foodlog';
      });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          const query = e.target.value.trim();
          const results = query ? await this.mealAPI.searchMeals(query) : this.meals;
          this.loadMeals(results);
        }, 300);
      });
    }

    const searchProductBtn = document.getElementById('search-product-btn');
    const productSearchInput = document.getElementById('product-search-input');
    if (searchProductBtn && productSearchInput) {
      searchProductBtn.addEventListener('click', async () => {
        const query = productSearchInput.value.trim();
        if (!query) return;
        const products = await this.productAPI.searchProducts(query);
        this.renderProducts(products);
      });
    }

    const lookupBarcodeBtn = document.getElementById('lookup-barcode-btn');
    const barcodeInput = document.getElementById('barcode-input');
    if (lookupBarcodeBtn && barcodeInput) {
      lookupBarcodeBtn.addEventListener('click', async () => {
        const barcode = barcodeInput.value.trim();
        if (!barcode) return;
        try {
          const product = await this.productAPI.getProductByBarcode(barcode);
          this.renderProducts([product]);
        } catch { Notify.error('Product not found.'); }
      });
    }

    const clearLogBtn = document.getElementById('clear-foodlog');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        this.state.clearLogForDate(new Date().toISOString().split('T')[0]);
        this.updateFoodLogUI();
        Notify.success('Food log cleared for today.');
      });
    }
  }

  async handleRoute() {
    const hash = window.location.hash || '#meals';
    const sections = ['search-filters-section', 'meal-categories-section', 'all-recipes-section', 'meal-details', 'products-section', 'foodlog-section'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    if (hash.startsWith('#meal/')) {
      document.getElementById('meal-details').style.display = '';
      await this.loadMealDetails(hash.split('/')[1]);
    } else if (hash === '#products') {
      document.getElementById('products-section').style.display = '';
      if (!this.productsLoaded) {
        this.productsLoaded = true;
        this.renderProducts(await this.productAPI.searchProducts('a'));
      }
    } else if (hash === '#foodlog') {
      document.getElementById('foodlog-section').style.display = '';
      this.updateFoodLogUI();
    } else {
      document.getElementById('search-filters-section').style.display = '';
      document.getElementById('meal-categories-section').style.display = '';
      document.getElementById('all-recipes-section').style.display = '';
      if (!this.mealsInitialized) {
        this.mealsInitialized = true;
        const categories = await this.mealAPI.getCategories();
        const catGrid = document.getElementById('categories-grid');
        if (catGrid) {
          catGrid.innerHTML = categories.map(cat => Components.renderCategoryCard(cat)).join('');
          catGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', async () => {
              this.loadMeals(await this.mealAPI.filterByCategory(card.dataset.category));
            });
          });
        }
        this.meals = await this.mealAPI.getInitialMeals();
        this.loadMeals(this.meals);
      }
    }
  }

  loadMeals(meals) {
    const grid = document.getElementById('recipes-grid');
    const countEl = document.getElementById('recipes-count');
    if (countEl) countEl.textContent = `Showing ${meals.length} recipes`;
    if (!grid) return;
    grid.innerHTML = meals.map(m => Components.renderRecipeCard(m)).join('');
    grid.querySelectorAll('.recipe-card').forEach(card => {
      card.addEventListener('click', () => { window.location.hash = `#meal/${card.dataset.mealId}`; });
    });
  }

  async loadMealDetails(id) {
    const meal = await this.mealAPI.getMealById(id);
    if (!meal) { Notify.error('Meal not found'); window.location.hash = '#meals'; return; }
    const nutrition = NutritionEstimator.estimate(meal);

    document.getElementById('meal-details').querySelector('img').src = meal.strMealThumb;
    document.getElementById('meal-details').querySelector('h1').textContent = meal.strMeal;
    document.getElementById('hero-servings').textContent = `${nutrition.servings} servings`;
    document.getElementById('hero-calories').textContent = `${nutrition.perServing.calories} cal/serving`;

    const logBtn = document.getElementById('log-meal-btn');
    const newLogBtn = logBtn.cloneNode(true);
    logBtn.parentNode.replaceChild(newLogBtn, logBtn);
    newLogBtn.addEventListener('click', () => {
      this.state.addLogItem({ name: meal.strMeal, category: meal.strCategory || 'Meal', ...nutrition.perServing });
      Notify.success(`Logged "${meal.strMeal}"!`);
      if (this.state.getTodayTotals().calories > this.state.goals.calories) {
        Notify.warning(`Warning: Exceeded daily calorie goal of ${this.state.goals.calories} kcal!`);
      }
    });

    document.getElementById('back-to-meals-btn').onclick = (e) => { e.preventDefault(); window.location.hash = '#meals'; };
  }

  renderProducts(products) {
    const grid = document.getElementById('products-grid');
    document.getElementById('products-count').textContent = `Showing ${products.length} products`;
    if (!grid) return;
    grid.innerHTML = products.map(p => Components.renderProductCard(p)).join('');
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const prod = products.find(p => (p.code || p._id) === card.dataset.barcode);
        if (prod) {
          const est = NutritionEstimator.estimateProduct(prod);
          Swal.fire({
            title: prod.product_name,
            text: `${est.calories} kcal per serving`,
            showCancelButton: true,
            confirmButtonText: 'Log Product',
            confirmButtonColor: '#10b981'
          }).then(res => {
            if (res.isConfirmed) {
              this.state.addLogItem({ name: prod.product_name, category: 'Product', calories: est.calories, protein: est.protein, carbs: est.carbs, fat: est.fat });
              Notify.success('Product logged!');
              if (this.state.getTodayTotals().calories > this.state.goals.calories) {
                Notify.warning('Daily calorie limit exceeded!');
              }
            }
          });
        }
      });
    });
  }

  updateFoodLogUI() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    document.getElementById('foodlog-date').textContent = today;
    const totals = this.state.getTodayTotals();
    const goals = this.state.goals;
    const progressDivs = document.querySelectorAll('#foodlog-today-section .grid > div');

    const updateBar = (div, curr, goal, unit) => {
      if (!div) return;
      div.querySelector('.text-sm.text-gray-500').textContent = `${Math.round(curr)} / ${goal} ${unit}`;
      div.querySelector('.rounded-full div').style.width = `${Math.min(100, (curr / goal) * 100)}%`;
    };

    updateBar(progressDivs[0], totals.calories, goals.calories, 'kcal');
    updateBar(progressDivs[1], totals.protein, goals.protein, 'g');
    updateBar(progressDivs[2], totals.carbs, goals.carbs, 'g');
    updateBar(progressDivs[3], totals.fat, goals.fat, 'g');

    document.querySelector('#foodlog-today-section h4').textContent = `Logged Items (${totals.items.length})`;
    document.getElementById('clear-foodlog').style.display = totals.items.length > 0 ? '' : 'none';

    const listEl = document.getElementById('logged-items-list');
    listEl.innerHTML = totals.items.length === 0 ? '<p class="text-center py-8 text-gray-500">No meals logged today</p>' : totals.items.map(item => Components.renderLogItem(item)).join('');
    listEl.querySelectorAll('.delete-log-btn').forEach(btn => {
      btn.addEventListener('click', () => { this.state.removeLogItem(btn.dataset.id); this.updateFoodLogUI(); Notify.success('Item removed.'); });
    });

    const weekly = this.state.getWeeklyData();
    const chartEl = document.getElementById('weekly-chart');
    if (chartEl && window.Plotly) {
      Plotly.newPlot(chartEl, [{ x: weekly.days, y: weekly.calories, type: 'scatter', mode: 'lines+markers', line: { color: '#10b981', width: 3 } }], { title: { text: 'Weekly Calorie Intake', font: { size: 14 } }, margin: { t: 30, r: 20, l: 40, b: 30 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' }, { responsive: true, displayModeBar: false });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => { new App(); });