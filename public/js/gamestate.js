// ============================================================
// GAME STATE & ECONOMY ENGINE
// ============================================================
window.PRODUCTS = [
  { id:'bread',    name:'Хлеб',        buyPrice:0.5,  sellPrice:1.2,  demand:90,  shelf:'grocery', emoji:'🍞', weight:0.5 },
  { id:'water',    name:'Вода',         buyPrice:0.3,  sellPrice:0.8,  demand:85,  shelf:'drinks',  emoji:'💧', weight:1.0 },
  { id:'milk',     name:'Молоко',       buyPrice:0.8,  sellPrice:1.8,  demand:80,  shelf:'dairy',   emoji:'🥛', weight:1.0 },
  { id:'canned',   name:'Консервы',     buyPrice:0.6,  sellPrice:1.5,  demand:60,  shelf:'grocery', emoji:'🥫', weight:0.8 },
  { id:'eggs',     name:'Яйца',         buyPrice:1.2,  sellPrice:2.5,  demand:75,  shelf:'dairy',   emoji:'🥚', weight:0.6 },
  { id:'butter',   name:'Масло',        buyPrice:1.5,  sellPrice:3.0,  demand:65,  shelf:'dairy',   emoji:'🧈', weight:0.4 },
  { id:'cheese',   name:'Сыр',          buyPrice:2.0,  sellPrice:4.5,  demand:55,  shelf:'dairy',   emoji:'🧀', weight:0.5 },
  { id:'apple',    name:'Яблоки',       buyPrice:0.4,  sellPrice:1.0,  demand:70,  shelf:'produce', emoji:'🍎', weight:1.0 },
  { id:'banana',   name:'Бананы',       buyPrice:0.5,  sellPrice:1.2,  demand:72,  shelf:'produce', emoji:'🍌', weight:1.0 },
  { id:'potato',   name:'Картофель',    buyPrice:0.3,  sellPrice:0.9,  demand:78,  shelf:'produce', emoji:'🥔', weight:2.0 },
  { id:'soda',     name:'Газировка',    buyPrice:0.7,  sellPrice:1.8,  demand:65,  shelf:'drinks',  emoji:'🥤', weight:1.0 },
  { id:'juice',    name:'Сок',          buyPrice:1.0,  sellPrice:2.5,  demand:60,  shelf:'drinks',  emoji:'🧃', weight:1.0 },
  { id:'chips',    name:'Чипсы',        buyPrice:0.8,  sellPrice:2.0,  demand:68,  shelf:'snacks',  emoji:'🍟', weight:0.2 },
  { id:'coffee',   name:'Кофе',         buyPrice:2.5,  sellPrice:5.5,  demand:70,  shelf:'grocery', emoji:'☕', weight:0.3 },
  { id:'sugar',    name:'Сахар',        buyPrice:0.6,  sellPrice:1.4,  demand:75,  shelf:'grocery', emoji:'🍬', weight:1.0 },
  { id:'flour',    name:'Мука',         buyPrice:0.5,  sellPrice:1.2,  demand:55,  shelf:'grocery', emoji:'🌾', weight:1.0 },
  { id:'rice',     name:'Рис',          buyPrice:0.7,  sellPrice:1.6,  demand:65,  shelf:'grocery', emoji:'🍚', weight:1.0 },
  { id:'pasta',    name:'Макароны',     buyPrice:0.6,  sellPrice:1.4,  demand:68,  shelf:'grocery', emoji:'🍝', weight:0.5 },
  { id:'soap',     name:'Мыло',         buyPrice:0.5,  sellPrice:1.5,  demand:60,  shelf:'hygiene', emoji:'🧼', weight:0.1 },
  { id:'shampoo',  name:'Шампунь',      buyPrice:1.5,  sellPrice:3.5,  demand:50,  shelf:'hygiene', emoji:'🧴', weight:0.3 },
];

window.STAFF_TYPES = {
  cashier:  { name:'Кассир',    salary:15,  skill:'speed',    emoji:'🧑‍💼', maxLevel:10 },
  loader:   { name:'Грузчик',   salary:12,  skill:'strength', emoji:'💪',   maxLevel:10 },
  cleaner:  { name:'Уборщик',   salary:10,  skill:'cleanliness', emoji:'🧹', maxLevel:10 },
  guard:    { name:'Охранник',  salary:14,  skill:'security', emoji:'💂',   maxLevel:10 },
  manager:  { name:'Менеджер',  salary:25,  skill:'management', emoji:'👔', maxLevel:10 },
};

window.UPGRADES = [
  { id:'better_shelves', name:'Новые стеллажи', cost:500,   effect:'capacity+20%',   level:1, icon:'🗄️' },
  { id:'pos_system',     name:'POS-система',     cost:1000,  effect:'speed+30%',      level:2, icon:'💻' },
  { id:'ac',             name:'Кондиционер',     cost:800,   effect:'satisfaction+10', level:2, icon:'❄️' },
  { id:'cctv',           name:'Видеонаблюдение', cost:600,   effect:'theft-50%',      level:2, icon:'📹' },
  { id:'freezer',        name:'Морозильник',     cost:1500,  effect:'dairy+unlock',   level:3, icon:'🧊' },
  { id:'bakery',         name:'Пекарня',         cost:3000,  effect:'bakery+unlock',  level:4, icon:'🥖' },
  { id:'warehouse',      name:'Склад',            cost:5000,  effect:'stock+200%',     level:5, icon:'🏭' },
  { id:'expansion',      name:'Расширение зала', cost:8000,  effect:'floor+50%',      level:6, icon:'📐' },
  { id:'brand',          name:'Собственный бренд', cost:15000, effect:'margin+15%',  level:7, icon:'™️' },
  { id:'second_store',   name:'Второй магазин',  cost:50000, effect:'chain+1',        level:8, icon:'🏪' },
];

class GameState {
  constructor(savedData) {
    const d = savedData || {};
    this.money = d.money ?? 100;
    this.day = d.day ?? 1;
    this.hour = d.hour ?? 8;
    this.reputation = d.reputation ?? 50;
    this.xp = d.xp ?? 0;
    this.level = d.level ?? 1;
    this.skills = d.skills ?? { trade:0, marketing:0, logistics:0, hr:0, finance:0 };
    this.inventory = d.inventory ?? {};        // { productId: { stock, shelfStock, price, expiry } }
    this.staff = d.staff ?? [];
    this.upgrades = d.upgrades ?? [];
    this.stats = d.stats ?? { totalSales:0, totalCustomers:0, totalRevenue:0, totalExpenses:0, daysPlayed:0, thefts:0, inspections:0 };
    this.events = d.events ?? [];
    this.notifications = [];
    this.inflation = d.inflation ?? 1.0;
    this.taxes = d.taxes ?? 0.15;
    this.rent = d.rent ?? 50;
    this.utilities = d.utilities ?? 30;
    this.loanAmount = d.loanAmount ?? 0;
    this.loanRate = d.loanRate ?? 0.1;
    this.chainStores = d.chainStores ?? 1;
    this.cleanlinessLevel = d.cleanlinessLevel ?? 100;
    this.marketingBudget = d.marketingBudget ?? 0;
    this.loyaltyProgram = d.loyaltyProgram ?? false;
    this.advertLevel = d.advertLevel ?? 0;

    // Init inventory with default prices
    PRODUCTS.forEach(p => {
      if (!this.inventory[p.id]) {
        this.inventory[p.id] = {
          stock: 0, shelfStock: 0,
          price: p.sellPrice,
          buyPrice: p.buyPrice,
          demand: p.demand,
          expiry: null
        };
      }
    });
  }

  addNotification(msg, type='info') {
    this.notifications.push({ msg, type, id: Date.now() + Math.random() });
    if (this.notifications.length > 8) this.notifications.shift();
  }

  gainXP(amount) {
    this.xp += amount;
    const xpNeeded = this.level * 500;
    if (this.xp >= xpNeeded) {
      this.xp -= xpNeeded;
      this.level++;
      this.addNotification(`🎉 Уровень ${this.level}! Разблокированы новые возможности!`, 'success');
    }
  }

  buyStock(productId, quantity) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return false;
    const inv = this.inventory[productId];
    const cost = product.buyPrice * this.inflation * quantity;
    if (this.money < cost) {
      this.addNotification(`❌ Недостаточно средств! Нужно $${cost.toFixed(2)}`, 'error');
      return false;
    }
    this.money -= cost;
    inv.stock += quantity;
    this.stats.totalExpenses += cost;
    this.addNotification(`📦 Куплено: ${product.emoji} ${product.name} x${quantity} за $${cost.toFixed(2)}`, 'info');
    this.gainXP(quantity * 2);
    return true;
  }

  stockShelf(productId, quantity) {
    const inv = this.inventory[productId];
    if (!inv || inv.stock < quantity) return false;
    inv.stock -= quantity;
    inv.shelfStock += quantity;
    return true;
  }

  setPrice(productId, price) {
    if (this.inventory[productId]) {
      this.inventory[productId].price = price;
    }
  }

  hireStaff(type) {
    const staffType = STAFF_TYPES[type];
    if (!staffType) return false;
    const cost = staffType.salary * 30; // monthly salary upfront
    if (this.money < cost) {
      this.addNotification(`❌ Недостаточно средств для найма!`, 'error');
      return false;
    }
    this.money -= cost;
    this.staff.push({
      id: Date.now(),
      type, name: this.generateName(),
      level: 1, mood: 100, efficiency: 70 + Math.random() * 30,
      salary: staffType.salary,
      hiredDay: this.day
    });
    this.addNotification(`👋 Нанят новый ${staffType.name}: ${this.staff[this.staff.length-1].name}`, 'success');
    this.gainXP(100);
    return true;
  }

  generateName() {
    const names = ['Иван','Мария','Алексей','Елена','Дмитрий','Ольга','Сергей','Наталья','Андрей','Татьяна','Михаил','Анна'];
    return names[Math.floor(Math.random() * names.length)];
  }

  buyUpgrade(upgradeId) {
    const upg = UPGRADES.find(u => u.id === upgradeId);
    if (!upg || this.upgrades.includes(upgradeId)) return false;
    if (this.level < upg.level) {
      this.addNotification(`🔒 Нужен уровень ${upg.level}!`, 'error');
      return false;
    }
    if (this.money < upg.cost) {
      this.addNotification(`❌ Недостаточно средств! Нужно $${upg.cost}`, 'error');
      return false;
    }
    this.money -= upg.cost;
    this.upgrades.push(upgradeId);
    this.applyUpgradeEffect(upg);
    this.addNotification(`✅ Улучшение "${upg.name}" куплено!`, 'success');
    this.gainXP(500);
    return true;
  }

  applyUpgradeEffect(upg) {
    if (upg.effect.includes('theft')) this.addNotification('🔒 Кражи снижены на 50%', 'success');
    if (upg.effect.includes('chain')) { this.chainStores++; this.addNotification('🏪 Открыт новый магазин!', 'success'); }
  }

  takeLoan(amount) {
    this.money += amount;
    this.loanAmount += amount;
    this.addNotification(`🏦 Кредит $${amount} получен. Долг: $${this.loanAmount.toFixed(0)}`, 'info');
    this.gainXP(50);
  }

  repayLoan(amount) {
    const pay = Math.min(amount, this.loanAmount);
    if (this.money < pay) { this.addNotification('❌ Недостаточно средств', 'error'); return; }
    this.money -= pay;
    this.loanAmount -= pay;
    this.addNotification(`✅ Погашено $${pay.toFixed(0)} долга`, 'success');
  }

  simulateCustomers() {
    // How many customers come based on hour, reputation, marketing
    const baseCustomers = Math.floor(3 + this.reputation / 20 + this.advertLevel * 2);
    const hourMultiplier = [0.1,0.05,0.05,0.05,0.1,0.2,0.5,0.8,1.2,1.5,1.8,2.0,2.5,2.2,2.0,1.8,2.2,2.5,2.0,1.5,1.0,0.7,0.4,0.2][this.hour] || 1;
    const count = Math.floor(baseCustomers * hourMultiplier + Math.random() * 3);

    let totalRevenue = 0;
    let totalSold = 0;
    let theftChance = this.upgrades.includes('cctv') ? 0.02 : 0.05;

    for (let i = 0; i < count; i++) {
      // Each customer buys 1-5 items
      const itemsToBuy = Math.floor(1 + Math.random() * 5);
      const budget = 5 + Math.random() * 45;
      let spent = 0;

      // Theft check
      if (Math.random() < theftChance) {
        this.stats.thefts++;
        const stolenItem = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
        const inv = this.inventory[stolenItem.id];
        if (inv && inv.shelfStock > 0) {
          inv.shelfStock = Math.max(0, inv.shelfStock - 1);
          this.addNotification(`🚨 Кража! Украден: ${stolenItem.emoji} ${stolenItem.name}`, 'error');
        }
        continue;
      }

      for (let j = 0; j < itemsToBuy && spent < budget; j++) {
        // Pick a random product from shelf
        const availableProducts = PRODUCTS.filter(p => {
          const inv = this.inventory[p.id];
          return inv && inv.shelfStock > 0 && inv.price <= (budget - spent);
        });
        if (availableProducts.length === 0) break;

        const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
        const inv = this.inventory[product.id];

        // Demand-based purchase probability
        const priceRatio = product.sellPrice / inv.price;
        const purchaseChance = (inv.demand / 100) * (priceRatio > 1 ? priceRatio : 1);

        if (Math.random() < purchaseChance) {
          inv.shelfStock--;
          const salePrice = inv.price;
          spent += salePrice;
          totalRevenue += salePrice;
          totalSold++;
        }
      }

      this.stats.totalCustomers++;
    }

    if (totalRevenue > 0) {
      const tax = totalRevenue * this.taxes;
      this.money += totalRevenue - tax;
      this.stats.totalRevenue += totalRevenue;
      this.stats.totalSales += totalSold;
      this.gainXP(Math.floor(totalSold * 5));
    }

    return { count, totalRevenue, totalSold };
  }

  advanceHour() {
    const result = this.simulateCustomers();
    this.hour++;

    if (this.hour >= 24) {
      this.hour = 0;
      this.endDay();
    }

    // Random events
    this.checkRandomEvents();

    return result;
  }

  endDay() {
    this.day++;
    this.stats.daysPlayed++;

    // Pay staff
    const staffCost = this.staff.reduce((sum, s) => sum + s.salary, 0);
    this.money -= staffCost;
    this.stats.totalExpenses += staffCost;

    // Pay rent & utilities
    const fixedCosts = this.rent + this.utilities + this.marketingBudget;
    this.money -= fixedCosts;
    this.stats.totalExpenses += fixedCosts;

    // Loan interest
    if (this.loanAmount > 0) {
      const interest = this.loanAmount * this.loanRate / 365;
      this.money -= interest;
      this.loanAmount += interest;
    }

    // Inflation tick (very slow)
    this.inflation += 0.0002;

    // Cleanliness decay
    const cleaners = this.staff.filter(s => s.type === 'cleaner').length;
    this.cleanlinessLevel = Math.max(0, this.cleanlinessLevel - 10 + cleaners * 8);

    // Reputation
    const avgShelfFill = PRODUCTS.reduce((sum, p) => {
      const inv = this.inventory[p.id];
      return sum + (inv ? Math.min(1, inv.shelfStock / 10) : 0);
    }, 0) / PRODUCTS.length;
    const repChange = (avgShelfFill * 10) - 5 + (this.cleanlinessLevel / 20) - 3;
    this.reputation = Math.max(0, Math.min(100, this.reputation + repChange));

    // Skill gains
    if (this.stats.daysPlayed % 7 === 0) {
      const skillKeys = Object.keys(this.skills);
      skillKeys.forEach(k => { if (this.skills[k] < 100) this.skills[k] = Math.min(100, this.skills[k] + 1); });
    }

    this.addNotification(`🌅 День ${this.day}. Доход сегодня: $${(this.stats.totalRevenue).toFixed(0)}`, 'info');

    if (this.money < 0) {
      this.addNotification('⚠️ ВНИМАНИЕ: Баланс отрицательный!', 'error');
    }
  }

  checkRandomEvents() {
    const rand = Math.random();
    if (rand < 0.005) {
      // Health inspection
      this.stats.inspections++;
      const fine = this.cleanlinessLevel < 50 ? 500 : 0;
      if (fine > 0) {
        this.money -= fine;
        this.addNotification(`🔍 Проверка санэпидемстанции! Штраф $${fine}!`, 'error');
      } else {
        this.addNotification('🔍 Проверка санэпидемстанции — всё в порядке!', 'success');
      }
    } else if (rand < 0.01) {
      // Equipment breakdown
      const repairCost = 50 + Math.random() * 200;
      this.money -= repairCost;
      this.addNotification(`🔧 Поломка оборудования! Ремонт: $${repairCost.toFixed(0)}`, 'error');
    } else if (rand < 0.015) {
      // Price surge from supplier
      this.inflation += 0.05;
      this.addNotification('📈 Поставщики подняли цены!', 'error');
    } else if (rand < 0.018) {
      // Good event
      this.reputation = Math.min(100, this.reputation + 5);
      this.addNotification('⭐ Позитивный отзыв в интернете! Репутация +5', 'success');
    } else if (rand < 0.02) {
      // Economic crisis
      PRODUCTS.forEach(p => { this.inventory[p.id].demand = Math.max(20, this.inventory[p.id].demand - 10); });
      this.addNotification('📉 Экономический кризис! Спрос снизился.', 'error');
    }
  }

  toJSON() {
    return {
      money: this.money, day: this.day, hour: this.hour,
      reputation: this.reputation, xp: this.xp, level: this.level,
      skills: this.skills, inventory: this.inventory, staff: this.staff,
      upgrades: this.upgrades, stats: this.stats, inflation: this.inflation,
      taxes: this.taxes, rent: this.rent, utilities: this.utilities,
      loanAmount: this.loanAmount, loanRate: this.loanRate,
      chainStores: this.chainStores, cleanlinessLevel: this.cleanlinessLevel,
      marketingBudget: this.marketingBudget, loyaltyProgram: this.loyaltyProgram,
      advertLevel: this.advertLevel
    };
  }
}

window.GameState = GameState;
