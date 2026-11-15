const SUGGESTIONS = {
  "American": {
    "Appetizers": ["Fried pickles", "Mozzarella sticks", "Loaded nachos", "Wings"],
    "Entrées": ["Cheeseburger", "Chicken sandwich", "Meatloaf", "Ribs"],
    "Salads": ["Cobb salad", "Caesar salad", "House salad"],
    "Soups": ["Tomato soup", "French onion soup", "Chili"],
    "Sides": ["French fries", "Onion rings", "Mac and cheese", "Coleslaw"],
    "Desserts": ["Apple pie", "Brownie sundae", "Cheesecake"],
    "Drinks": ["Milkshake", "Lemonade", "Draft beer", "Iced tea"]
  },
  "BBQ": {
    "Appetizers": ["Smoked wings", "Burnt ends", "Fried pickles"],
    "Entrées": ["Brisket", "Pulled pork", "Smoked ribs", "Sausage"],
    "Salads": ["BBQ chicken salad", "Potato salad"],
    "Soups": ["Brisket chili", "Smoked chicken soup"],
    "Sides": ["Baked beans", "Coleslaw", "Mac and cheese", "Cornbread"],
    "Desserts": ["Peach cobbler", "Banana pudding"],
    "Drinks": ["Sweet tea", "Lemonade", "Root beer"]
  },
  "Bakery & Cafe": {
    "Appetizers": ["Avocado toast", "Quiche", "Scones"],
    "Entrées": ["Breakfast sandwich", "Panini", "Turkey club"],
    "Salads": ["Chicken salad", "Cobb salad", "Caprese salad"],
    "Soups": ["Tomato basil soup", "Soup of the day"],
    "Sides": ["Fruit cup", "Chips", "Roasted potatoes"],
    "Desserts": ["Croissant", "Cinnamon roll", "Chocolate chip cookie"],
    "Drinks": ["Latte", "Cappuccino", "Cold brew", "Chai latte"]
  },
  "Chinese": {
    "Appetizers": ["Crab rangoon", "Egg rolls", "Pot stickers"],
    "Entrées": ["General Tso's chicken", "Kung pao chicken", "Beef and broccoli", "Fried rice"],
    "Salads": ["Chinese chicken salad", "Seaweed salad"],
    "Soups": ["Hot and sour soup", "Egg drop soup", "Wonton soup"],
    "Sides": ["Steamed rice", "Spring rolls", "Scallion pancakes"],
    "Desserts": ["Sesame balls", "Fortune cookie"],
    "Drinks": ["Jasmine tea", "Milk tea", "Plum juice"]
  },
  "French": {
    "Appetizers": ["Escargot", "French onion soup", "Pâté"],
    "Entrées": ["Coq au vin", "Steak frites", "Croque monsieur"],
    "Salads": ["Nicoise salad", "Frisée salad"],
    "Soups": ["French onion soup", "Potage"],
    "Sides": ["Pommes frites", "Ratatouille", "Gratin dauphinois"],
    "Desserts": ["Crème brûlée", "Profiteroles", "Tarte tatin"],
    "Drinks": ["Café au lait", "Espresso", "French wine"]
  },
  "Greek": {
    "Appetizers": ["Spanakopita", "Dolmades", "Saganaki"],
    "Entrées": ["Gyro", "Chicken souvlaki", "Moussaka"],
    "Salads": ["Greek salad", "Horiatiki salad"],
    "Soups": ["Avgolemono soup", "Fasolada"],
    "Sides": ["Tzatziki and pita", "Lemon potatoes", "Hummus"],
    "Desserts": ["Baklava", "Galaktoboureko"],
    "Drinks": ["Greek coffee", "Frappé", "Ouzo"]
  },
  "Indian": {
    "Appetizers": ["Samosas", "Pakora", "Papadum"],
    "Entrées": ["Chicken tikka masala", "Butter chicken", "Palak paneer", "Biryani"],
    "Salads": ["Kachumber salad", "Chana salad"],
    "Soups": ["Mulligatawny soup", "Dal soup"],
    "Sides": ["Garlic naan", "Basmati rice", "Raita"],
    "Desserts": ["Gulab jamun", "Kheer", "Mango kulfi"],
    "Drinks": ["Mango lassi", "Masala chai", "Sweet lassi"]
  },
  "Italian": {
    "Appetizers": ["Toasted ravioli", "Bruschetta", "Calamari"],
    "Entrées": ["Lasagna", "Chicken parmesan", "Fettuccine Alfredo", "Margherita pizza"],
    "Salads": ["Caprese salad", "Caesar salad", "House salad"],
    "Soups": ["Minestrone", "Italian wedding soup", "Pasta e fagioli"],
    "Sides": ["Garlic bread", "Risotto", "Roasted vegetables"],
    "Desserts": ["Tiramisu", "Cannoli", "Panna cotta"],
    "Drinks": ["Espresso", "Aperol spritz", "Italian red wine"]
  },
  "Japanese": {
    "Appetizers": ["Edamame", "Gyoza", "Tempura"],
    "Entrées": ["Chicken teriyaki", "Ramen", "Sushi roll", "Chicken katsu"],
    "Salads": ["Seaweed salad", "Sunomono"],
    "Soups": ["Miso soup", "Tonkotsu ramen"],
    "Sides": ["Miso eggplant", "Steamed rice", "Agedashi tofu"],
    "Desserts": ["Mochi", "Matcha cheesecake", "Dorayaki"],
    "Drinks": ["Matcha latte", "Sake", "Japanese lager"]
  },
  "Korean": {
    "Appetizers": ["Kimchi pancakes", "Mandu", "Korean fried chicken"],
    "Entrées": ["Bibimbap", "Bulgogi", "Galbi", "Kimchi jjigae"],
    "Salads": ["Korean cucumber salad", "Japchae"],
    "Soups": ["Sundubu jjigae", "Doenjang jjigae"],
    "Sides": ["Kimchi", "Tteokbokki", "Steamed rice"],
    "Desserts": ["Hotteok", "Bingsu"],
    "Drinks": ["Korean barley tea", "Soju", "Korean rice wine"]
  },
  "Mediterranean": {
    "Appetizers": ["Hummus", "Falafel", "Baba ganoush"],
    "Entrées": ["Chicken shawarma", "Falafel wrap", "Lamb kebab"],
    "Salads": ["Tabbouleh", "Fattoush", "Greek salad"],
    "Soups": ["Lentil soup", "Harira"],
    "Sides": ["Pita bread", "Couscous", "Tzatziki"],
    "Desserts": ["Baklava", "Halva", "Rice pudding"],
    "Drinks": ["Mint tea", "Turkish coffee", "Ayran"]
  },
  "Mexican": {
    "Appetizers": ["Guacamole", "Queso dip", "Street corn"],
    "Entrées": ["Carne asada tacos", "Chicken enchiladas", "Burrito", "Chiles rellenos"],
    "Salads": ["Taco salad", "Avocado salad"],
    "Soups": ["Pozole", "Tortilla soup", "Menudo"],
    "Sides": ["Mexican rice", "Refried beans", "Elote"],
    "Desserts": ["Churros", "Flan", "Tres leches cake"],
    "Drinks": ["Horchata", "Margarita", "Agua fresca"]
  },
  "Middle Eastern": {
    "Appetizers": ["Hummus", "Falafel", "Baba ganoush"],
    "Entrées": ["Chicken shawarma", "Lamb kebab", "Kofta"],
    "Salads": ["Tabbouleh", "Fattoush"],
    "Soups": ["Lentil soup", "Shorbat adas"],
    "Sides": ["Pita bread", "Rice pilaf", "Labneh"],
    "Desserts": ["Baklava", "Kunafa", "Ma'amoul"],
    "Drinks": ["Mint tea", "Turkish coffee", "Ayran"]
  },
  "Pizza": {
    "Appetizers": ["Toasted ravioli", "Garlic knots", "Fried mozzarella"],
    "Entrées": ["Pepperoni pizza", "Margherita pizza", "Sausage pizza", "Calzone"],
    "Salads": ["House salad", "Antipasto salad", "Caesar salad"],
    "Soups": ["Tomato basil soup", "Minestrone"],
    "Sides": ["Garlic bread", "Wings", "Breadsticks"],
    "Desserts": ["Cannoli", "Tiramisu", "Fried dough"],
    "Drinks": ["Soda", "Italian soda", "Draft beer"]
  },
  "Seafood": {
    "Appetizers": ["Crab cakes", "Calamari", "Shrimp cocktail"],
    "Entrées": ["Fish and chips", "Lobster roll", "Shrimp scampi", "Grilled salmon"],
    "Salads": ["Seafood salad", "Cobb salad"],
    "Soups": ["Clam chowder", "Lobster bisque", "Gumbo"],
    "Sides": ["Hush puppies", "Coleslaw", "French fries"],
    "Desserts": ["Key lime pie", "Bread pudding"],
    "Drinks": ["Lemonade", "Mojito", "White wine"]
  },
  "Southern / Soul Food": {
    "Appetizers": ["Fried green tomatoes", "Deviled eggs", "Pimento cheese"],
    "Entrées": ["Fried chicken", "Shrimp and grits", "Chicken and waffles"],
    "Salads": ["Southern house salad", "Chicken salad"],
    "Soups": ["Gumbo", "Chicken and dumplings"],
    "Sides": ["Collard greens", "Mac and cheese", "Cornbread", "Fried okra"],
    "Desserts": ["Peach cobbler", "Banana pudding", "Pecan pie"],
    "Drinks": ["Sweet tea", "Mint julep", "Lemonade"]
  },
  "Thai": {
    "Appetizers": ["Fresh spring rolls", "Satay", "Crispy wontons"],
    "Entrées": ["Pad Thai", "Green curry", "Drunken noodles", "Massaman curry"],
    "Salads": ["Papaya salad", "Larb"],
    "Soups": ["Tom yum", "Tom kha gai"],
    "Sides": ["Jasmine rice", "Sticky rice", "Cucumber salad"],
    "Desserts": ["Mango sticky rice", "Coconut ice cream"],
    "Drinks": ["Thai iced tea", "Coconut water", "Lemongrass tea"]
  },
  "Vietnamese": {
    "Appetizers": ["Fresh spring rolls", "Egg rolls", "Banh xeo"],
    "Entrées": ["Pho", "Banh mi", "Bun cha", "Lemongrass chicken"],
    "Salads": ["Papaya salad", "Bun noodle salad"],
    "Soups": ["Pho", "Bun bo Hue"],
    "Sides": ["Vietnamese pickles", "Jasmine rice", "Fried egg rolls"],
    "Desserts": ["Che ba mau", "Vietnamese flan"],
    "Drinks": ["Vietnamese iced coffee", "Sugarcane juice", "Jasmine tea"]
  },
  "Other": {
    "Appetizers": ["House appetizer", "Fried pickles", "Bruschetta"],
    "Entrées": ["Chef's special", "House specialty", "Grilled chicken"],
    "Salads": ["House salad", "Caesar salad"],
    "Soups": ["Soup of the day", "Tomato soup"],
    "Sides": ["French fries", "Roasted vegetables"],
    "Desserts": ["Cheesecake", "Chocolate cake"],
    "Drinks": ["House drink", "Lemonade", "Iced tea"]
  }
};

export function restaurantDishSuggestions(cuisine, category) {
  const type = String(cuisine || "").trim();
  const suggestions = SUGGESTIONS[type] || SUGGESTIONS.Other;
  return [...(suggestions[category] || [])];
}
