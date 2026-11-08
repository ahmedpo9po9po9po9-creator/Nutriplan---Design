export class AppState {
  constructor() {
    this.storageKey = 'nutriplan_food_log';
    this.goalsKey = 'nutriplan_goals';
    this.goals = JSON.parse(localStorage.getItem(this.goalsKey)) || {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65
    };
  }

  getLog() {
    return JSON.parse(localStorage.getItem(this.storageKey)) || [];
  }

  saveLog(log) {
    localStorage.setItem(this.storageKey, JSON.stringify(log));
  }

  addLogItem(item) {
    const log = this.getLog();
    const newItem = {
      id: Date.now().toString(),
      date: item.date || new Date().toISOString().split('T')[0],
      name: item.name,
      category: item.category || 'Meal',
      calories: Number(item.calories) || 0,
      protein: Number(item.protein) || 0,
      carbs: Number(item.carbs) || 0,
      fat: Number(item.fat) || 0,
      timestamp: new Date().toISOString()
    };
    log.push(newItem);
    this.saveLog(log);
    return newItem;
  }

  removeLogItem(id) {
    let log = this.getLog();
    log = log.filter(item => item.id !== id);
    this.saveLog(log);
  }

  clearLogForDate(dateStr) {
    let log = this.getLog();
    log = log.filter(item => item.date !== dateStr);
    this.saveLog(log);
  }

  getTodayTotals() {
    const today = new Date().toISOString().split('T')[0];
    const log = this.getLog();
    const todayItems = log.filter(item => item.date === today);

    return todayItems.reduce((acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, count: todayItems.length, items: todayItems });
  }

  getWeeklyData() {
    const log = this.getLog();
    const days = [];
    const calories = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayTotal = log
        .filter(item => item.date === dateStr)
        .reduce((sum, item) => sum + item.calories, 0);

      days.push(dayName);
      calories.push(dayTotal);
    }

    return { days, calories };
  }
}

export class NutritionEstimator {
  static estimate(meal) {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim()) count++;
    }
    count = Math.max(count, 4);
    const totalCalories = count * 110;
    const servings = 4;
    const perServingCalories = Math.round(totalCalories / servings);

    return {
      servings,
      perServing: {
        calories: perServingCalories,
        protein: Math.round(perServingCalories * 0.25 / 4),
        carbs: Math.round(perServingCalories * 0.45 / 4),
        fat: Math.round(perServingCalories * 0.30 / 9),
        fiber: 4,
        sugar: 8
      },
      total: { calories: totalCalories }
    };
  }

  static estimateProduct(product) {
    const nutriments = product.nutriments || {};
    const servingSize = product.serving_quantity || 100;
    const factor = servingSize / 100;

    return {
      calories: Math.round((nutriments['energy-kcal_100g'] || 250) * factor),
      protein: Math.round((nutriments['proteins_100g'] || 10) * factor * 10) / 10,
      carbs: Math.round((nutriments['carbohydrates_100g'] || 30) * factor * 10) / 10,
      fat: Math.round((nutriments['fat_100g'] || 8) * factor * 10) / 10
    };
  }
}