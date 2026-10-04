
const KEY='metro_eats_v2';
const OLD_KEY='metro_eats_v1';
const categories={
 'Appetizers & Snacks':['Dips & Spreads','Finger Foods','Chips & Nachos','Wings','Charcuterie','Party Snacks'],
 'Breakfast & Brunch':['Eggs','Breakfast Meats','Pancakes & Waffles','French Toast','Biscuits & Gravy','Breakfast Casseroles','Brunch'],
 'Soups, Salads & Sandwiches':['Soups','Stews','Chili','Salads','Sandwiches','Burgers','Wraps'],
 'Main Dishes':['Beef','Pork','Chicken','Turkey','Seafood','Pasta','Casseroles','Meatless','Slow Cooker','One-Pot Meals'],
 'Mexican & Latin':['Tacos','Burritos','Enchiladas','Fajitas','Quesadillas','Nachos','Mexican Sides','Latin American'],
 'Italian':['Pasta','Pizza','Italian Beef','Chicken','Sauces','Italian Sides'],
 'BBQ & Grilling':['Steaks','Burgers','Ribs','Brisket','Pulled Pork','Chicken','Grilled Seafood','BBQ Sauces & Rubs'],
 'Side Dishes':['Potatoes','Rice','Vegetables','Mac & Cheese','Pasta Sides','Casseroles','Beans','Bread & Rolls'],
 'Sauces, Gravies & Condiments':['Sauces','Gravies','Marinades','Rubs','Dressings','Dips'],
 'Bread & Baking':['Breads','Biscuits','Rolls','Muffins','Cakes','Cookies','Pies','Pastries'],
 'Desserts':['Cakes','Pies','Cookies','Brownies & Bars','Ice Cream','Puddings','Fruit Desserts'],
 'Drinks':['Cocktails','Beer Drinks','Wine Drinks','Non-Alcoholic','Coffee','Tea','Smoothies & Shakes'],
 'Other':['Other']
};
const restaurantTypes=['American','Bar & Grill','BBQ','Burgers','Breakfast & Brunch','Cafés & Coffee','Chinese','Deli','Fast Food','Fine Dining','French','Indian','Italian','Japanese','Korean','Mediterranean','Mexican','Middle Eastern','Pizza','Seafood','Southern / Soul Food','Steakhouse','Thai','Vietnamese','Vegetarian / Vegan','Food Truck','Bakery','Dessert / Ice Cream','Brewery / Brewpub','Gastropub','Sports Bar','Other'];
const surveyQuestions=[['Overall Experience','Your overall impression of the visit.'],['Food Quality','Taste, freshness, preparation and consistency.'],['Menu & Selection','Variety, creativity and choices.'],['Service','Attentiveness, friendliness, professionalism and timing.'],['Atmosphere','Ambiance, comfort, noise level and vibe.'],['Cleanliness','Dining area, tables, restrooms and overall cleanliness.'],['Value for Money','Pricing, portions, quality and whether it felt worth it.'],['Drinks & Bar','Drink quality, selection, presentation and service.'],['Location & Accessibility','Parking, access, seating and convenience.'],['Would You Return?','How likely you are to return to this restaurant.']];

/* FINAL FOOD CRITIC CONFIG — initialized before any app rendering */
var ME_CRITIC_QUESTIONS=[
  ['Overall Experience','Your overall impression of the visit.'],
  ['Food Quality','Calculated from the individual dishes and drinks you rated.'],
  ['Service','Attentiveness, friendliness, professionalism and timing.'],
  ['Value','Pricing, portions, quality and whether it felt worth it.']
];
var ME_CRITIC_CATS=['Appetizers','Entrées','Salads','Soups','Sides','Desserts','Drinks'];
var ME_CRITIC_SUGGESTIONS={
  Pizza:['Pizza','Wings','Toasted Ravioli','Garlic Bread','Pasta','House Salad'],
  Mexican:['Tacos','Burrito','Enchiladas','Fajitas','Quesadilla','Nachos','Rice','Beans','Chips & Salsa'],
  BBQ:['Brisket','Ribs','Pulled Pork','Chicken','Sausage','Baked Beans','Coleslaw','Potato Salad'],
  Steakhouse:['Steak','Prime Rib','Burger','Chicken','Pork Chop','Salmon','Baked Potato','House Salad'],
  Italian:['Pizza','Pasta','Lasagna','Chicken Parmesan','Italian Beef','Calzone','Garlic Bread','Tiramisu'],
  Chinese:['Egg Rolls','Crab Rangoon','Fried Rice','Lo Mein','General Tso Chicken','Orange Chicken','Beef & Broccoli'],
  Japanese:['Sushi','Sashimi','Ramen','Teriyaki','Tempura','Gyoza','Miso Soup'],
  Indian:['Samosas','Tandoori Chicken','Chicken Tikka Masala','Butter Chicken','Biryani','Naan','Saag'],
  Thai:['Pad Thai','Drunken Noodles','Curry','Tom Yum Soup','Fried Rice','Spring Rolls'],
  Seafood:['Fish & Chips','Grilled Fish','Fried Shrimp','Crab Cakes','Salmon','Seafood Pasta','Coleslaw'],
  Burgers:['Burger','Chicken Sandwich','Wings','Fries','Onion Rings','Tater Tots','Side Salad'],
  'Breakfast & Brunch':['Eggs','Omelet','Pancakes','Waffles','French Toast','Biscuits & Gravy','Bacon','Sausage'],
  'Bar & Grill':['Wings','Burger','Steak','Chicken','Fish','Sandwich','Pretzel','Fries','Side Salad'],
  Other:['Appetizer','Entrée','Sandwich','Burger','Pizza','Salad','Soup','Side','Dessert']
};
var ME_CRITIC_ALIASES={'American':'Other','Deli':'Other','Fast Food':'Burgers','Fine Dining':'Steakhouse','French':'Steakhouse','Korean':'Other','Mediterranean':'Other','Middle Eastern':'Other','Vietnamese':'Other','Vegetarian / Vegan':'Other','Food Truck':'Other','Bakery':'Other','Dessert / Ice Cream':'Other','Brewery / Brewpub':'Bar & Grill','Gastropub':'Bar & Grill','Sports Bar':'Bar & Grill','Cafés & Coffee':'Breakfast & Brunch'};

