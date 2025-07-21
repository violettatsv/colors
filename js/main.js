let allProducts = [];
let activeFilters = new Set();
let cart = [];

function loadCartFromStorage() {
    const stored = localStorage.getItem('cart');
    if (stored) {
        const raw = JSON.parse(stored);
        cart = raw
            .map(item => {
                if (item && item.product && typeof item.qty === 'number') {
                    return item;
                }
                if (item && item.id) {
                    return { product: item, qty: 1 };
                }
                return null;
            })
            .filter(Boolean);
    } else {
        cart = [];
    }
    updateCartCounter();
}
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function changeQty(productId, delta) {
    const entry = cart.find(e => e.product.id == productId);
    if (!entry) return;

    entry.qty += delta;
    if (entry.qty < 1) {
        cart = cart.filter(e => e.product.id != productId);
    }
    saveCartToStorage();
    updateCartCounter();
    renderCartList();
}

function renderCartList() {
    const counts = {};
    const seen = new Set();
    const unique = [];

    cart.forEach(({ product, qty }) => {
        const id = product.id;
        counts[id] = (counts[id] || 0) + qty;
        if (!seen.has(id)) {
            seen.add(id);
            unique.push(product);
        }
    });

    const totalSum = unique.reduce((sum, product) => {
        return sum + product.price * counts[product.id];
    }, 0);
    document.querySelector('.cart-modal__total-sum').textContent =
        totalSum.toLocaleString('ru-RU') + ' ₽';

    const total = Object.values(counts).reduce((s, n) => s + n, 0);
    cartModalCount.textContent = `${total} товаров`;

    cartModalList.innerHTML = '';
    if (unique.length === 0) {
        cartModalList.innerHTML = '<li class="cart-modal__item empty">Корзина пуста</li>';
        return;
    }

    unique.forEach(product => {
        const qty = counts[product.id];
        const img = product.imageUrl.replace('./', '/');
        const li = document.createElement('li');
        li.className = 'cart-modal__item';
        if (!product.category.includes('available')) li.classList.add('disabled');

        li.innerHTML = `
      <img src="${img}" class="cart-modal__img" alt="${product.title}">
      <div class="cart-modal__info">
        <span class="cart-modal__name">${product.title}</span>
        <span class="cart-modal__price">${product.price} ₽</span>
      </div>
      <div class="cart-modal__qty">
        <button class="qty-btn decrease" data-id="${product.id}">–</button>
        <span class="qty-number">${qty}</span>
        <button class="qty-btn increase" data-id="${product.id}">+</button>
      </div>
    `;
        cartModalList.appendChild(li);
    });

    cartModalList.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', e => changeQty(e.currentTarget.dataset.id, +1));
    });
    cartModalList.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', e => changeQty(e.currentTarget.dataset.id, -1));
    });
}


document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    axios
        .get('https://68751556dd06792b9c96af9f.mockapi.io/api/v1/colors/products')
        .then(response => {
            allProducts = response.data;
            renderCatalog(allProducts);
        }

        )
        .catch(error => console.error('Ошибка при загрузке товаров:', error));
});

const burgerOverlayToggle = () => {
    document.querySelector('.menu-modal-overlay').classList.toggle('open');
    document.querySelector('.header__burger').classList.toggle('open');
};

document.querySelector('.header__burger')
    .addEventListener('click', burgerOverlayToggle);

document.querySelector('.menu-modal__close')
    .addEventListener('click', burgerOverlayToggle);

document.querySelector('.menu-modal-overlay')
    .addEventListener('click', e => {
        if (e.target.classList.contains('menu-modal-overlay')) {
            burgerOverlayToggle();
        }
    });

const filterBtn = document.querySelector('.catalog__filter-btn');
const filtersOverlay = document.querySelector('.filters-modal-overlay');
const filtersPanel = document.querySelector('.filters-modal');

function openFilters() {
    filtersOverlay.classList.add('open');
    filtersPanel.classList.add('open');
}
function closeFilters() {
    filtersPanel.classList.remove('open');
    filtersPanel.addEventListener('transitionend', () => {
        filtersOverlay.classList.remove('open');
    }, { once: true });
}

filterBtn.addEventListener('click', openFilters);
filtersOverlay.addEventListener('click', e => {
    if (e.target === filtersOverlay) {
        closeFilters();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('catalog__filter-input')) {
        const category = e.target.dataset.category;
        if (e.target.checked) {
            activeFilters.add(category);
        } else {
            activeFilters.delete(category);
        }
        filterAndRender();
    }
});

document.addEventListener('change', (e) => {
    if (e.target.classList.contains('catalog__filter-input')) {
        const category = e.target.dataset.category;

        if (e.target.checked) {
            activeFilters.add(category);
        } else {
            activeFilters.delete(category);
        }

        filterAndRender();
    }
});

function addToCart(product) {
    const entry = cart.find(e => e.product.id === product.id);
    if (entry) {
        entry.qty++;
    } else {
        cart.push({ product, qty: 1 });
    }
    saveCartToStorage();
    updateCartCounter();
}

function updateCartCounter() {
    const counter = document.querySelector('.header__cart-count');
    const totalQty = cart.reduce((sum, e) => sum + e.qty, 0);
    counter.textContent = totalQty;
}


function filterAndRender() {
    let filtered = allProducts;

    if (activeFilters.size > 0) {
        filtered = allProducts.filter(product =>
            product.category.some(cat => activeFilters.has(cat))
        );
    }

    renderCatalog(filtered);
}

function renderCatalog(products) {
    const catalog = document.getElementById('catalog');
    catalog.innerHTML = '';
    const countEl = document.getElementById('product-count');

    countEl.textContent = products.length;

    products.forEach(product => {
        const imageUrl = product.imageUrl.replace('./', '/');

        const card = document.createElement('div');
        card.className = 'article-card';
        card.innerHTML = `
      <img class="article-card__image" src="${imageUrl}" alt="${product.title}">
      <h3 class="article-card__title">${product.title}</h3>
      <p class="article-card__price">${product.price} ₽</p>
      <button class="article-card__btn" data-id="${product.id}">+</button>
    `;

        card.querySelector('.article-card__btn').addEventListener('click', () => {
            addToCart(product);
        });

        catalog.appendChild(card);
    });
}

const cartModalOverlay = document.querySelector('.cart-modal-overlay');
const cartModalList = document.querySelector('.cart-modal__list');
const cartModalClose = document.querySelector('.cart-modal__close');
const cartButton = document.getElementById('cart-button');

const cartModalCount = document.querySelector('.cart-modal__count');
const cartModalClear = document.querySelector('.cart-modal__clear');

cartButton.addEventListener('click', openCartModal);

cartModalClose.addEventListener('click', closeCartModal);
cartModalOverlay.addEventListener('click', e => {
    if (e.target === cartModalOverlay) closeCartModal();
});

cartModalClear.addEventListener('click', () => {
    cart = [];
    saveCartToStorage();
    updateCartCounter();
    closeCartModal();
});

function openCartModal() {
    renderCartList();
    cartModalOverlay.classList.remove('hidden');
}
function closeCartModal() {
    cartModalOverlay.classList.add('hidden');
}

let currentSort = document.getElementById('sort').value || 'price_high';

function sortProducts(list) {
    const sorted = [...list];
    switch (currentSort) {
        case 'price_low':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price_high':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'new':
            sorted.sort((a, b) => {
                const dA = a.createdAt ? new Date(a.createdAt) : null;
                const dB = b.createdAt ? new Date(b.createdAt) : null;
                if (dA && dB) return dB - dA;
                return parseInt(b.id, 10) - parseInt(a.id, 10);
            });
            break;
        case 'popular':
            if (typeof list[0]?.popularity === 'number') {
                sorted.sort((a, b) => b.popularity - a.popularity);
            }
            break;
    }
    return sorted;
}

const originalRenderCatalog = renderCatalog;
renderCatalog = function (products) {
    const sorted = sortProducts(products);
    originalRenderCatalog(sorted);
};

function onSortChange(value) {
    currentSort = value;
    document.getElementById('sort').value = value;
    document.getElementById('sort-mobile').value = value;
    filterAndRender();
}

document.getElementById('sort').addEventListener('change', e => {
    onSortChange(e.target.value);
});
document.getElementById('sort-mobile').addEventListener('change', e => {
    onSortChange(e.target.value);
});

document.querySelectorAll('.custom-select').forEach(custom => {
    const trigger = custom.querySelector('.custom-select__trigger');
    const current = custom.querySelector('.custom-select__current');
    const options = custom.querySelectorAll('.custom-select__option');

    trigger.addEventListener('click', () => {
        custom.classList.toggle('open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {
            const val = option.dataset.value;
            current.textContent = option.textContent;
            custom.classList.remove('open');
            onSortChange(val);
        });
    });
});

document.addEventListener('click', e => {
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select.open')
            .forEach(cs => cs.classList.remove('open'));
    }
});

const defaultText = document.getElementById('sort')
    .options[document.getElementById('sort').selectedIndex]
    .textContent;

document.querySelectorAll('.custom-select').forEach(custom => {
    const current = custom.querySelector('.custom-select__current');
    current.textContent = defaultText;
});
