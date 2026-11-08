export class Components {
  static renderCategoryCard(cat) {
    return `
      <div class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group" data-category="${cat.strCategory}">
        <div class="flex items-center gap-2.5">
          <img src="${cat.strCategoryThumb}" alt="${cat.strCategory}" class="w-9 h-9 rounded-lg object-cover shadow-sm group-hover:scale-110 transition-transform"/>
          <div><h3 class="text-sm font-bold text-gray-900">${cat.strCategory}</h3></div>
        </div>
      </div>
    `;
  }

  static renderRecipeCard(meal) {
    return `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-meal-id="${meal.idMeal}">
        <div class="relative h-48 overflow-hidden bg-gray-100">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy"/>
          <div class="absolute bottom-3 left-3 flex gap-2">
            ${meal.strCategory ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">${meal.strCategory}</span>` : ''}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${meal.strMeal}</h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">Delicious recipe to try!</p>
        </div>
      </div>
    `;
  }

  static renderProductCard(product) {
    const nutriScore = (product.nutriscore_grade || 'unknown').toUpperCase();
    return `
      <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${product.code || product._id}">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden p-2">
          <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${product.image_front_url || 'https://images.openfoodfacts.org/images/products/316/893/015/9742/front_fr.54.400.jpg'}" alt="${product.product_name || 'Product'}" loading="lazy"/>
          ${nutriScore !== 'UNKNOWN' ? `<div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">Nutri-Score ${nutriScore}</div>` : ''}
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${product.brands || 'Unknown Brand'}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">${product.product_name || 'Unnamed Product'}</h3>
        </div>
      </div>
    `;
  }

  static renderLogItem(item) {
    return `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
        <div>
          <p class="font-bold text-gray-900 text-sm">${item.name}</p>
          <p class="text-xs text-gray-500">${item.category} • ${item.calories} kcal | P: ${item.protein}g | C: ${item.carbs}g | F: ${item.fat}g</p>
        </div>
        <button class="delete-log-btn text-red-400 hover:text-red-600 p-2" data-id="${item.id}" title="Remove item"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }
}

export class Notify {
  static success(message) {
    if (window.Swal) Swal.fire({ icon: 'success', title: 'Success', text: message, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
    else alert(message);
  }
  static warning(message) {
    if (window.Swal) Swal.fire({ icon: 'warning', title: 'Calorie Warning', text: message, confirmButtonColor: '#10b981' });
    else alert('Warning: ' + message);
  }
  static error(message) {
    if (window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#ef4444' });
    else alert('Error: ' + message);
  }
}