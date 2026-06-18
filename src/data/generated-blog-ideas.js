// 30 SEO-optimized blog ideas with outlines and sample content
const blogIdeas = [
  {
    id: 1,
    title: "Ultimate Guide to Healthy Meal Planning: Save Time & Eat Better",
    outline: [
      "Why meal planning matters",
      "Setting realistic goals",
      "Building a balanced weekly plan",
      "Shopping list and batch-cooking tips",
      "Sample 7-day plan"
    ],
    sample: "Meal planning reduces stress and food waste. Start by defining dietary goals, choose nutrient-dense recipes, and batch-cook staples to simplify weeknight dinners."
  },
  {
    id: 2,
    title: "Protein-Packed Recipes for Muscle Building and Recovery",
    outline: ["Protein basics","Best whole-food sources","10 high-protein recipes","Post-workout meals","Meal timing tips"],
    sample: "Protein supports muscle repair. Combine lean meats, legumes, and dairy with whole grains to create satisfying, recovery-focused meals."
  },
  {
    id: 3,
    title: "Budget-Friendly Healthy Recipes: Eat Well Without Overspending",
    outline: ["Cost-saving strategies","Pantry staples","7 low-cost recipes","Seasonal buying","Leftover transforms"],
    sample: "Eating healthy on a budget is achievable by buying seasonal produce, using legumes, and planning meals around store sales."
  },
  {
    id: 4,
    title: "5 Easy Plant-Based Weeknight Dinners for Busy Families",
    outline: ["Benefits of plant-based meals","Pantry swap list","5 quick recipes","Kid-friendly tips","Time-saving shortcuts"],
    sample: "Plant-based dinners can be fast and family-approved—think one-pan chickpea curry or sheet-pan roasted veggies with quinoa."
  },
  {
    id: 5,
    title: "Ingredient Substitutions: Make Any Recipe Fit Your Diet",
    outline: ["Common allergens","Dairy-free swaps","Gluten-free alternatives","Vegan egg substitutes","Flavor-preserving swaps"],
    sample: "Need to swap an ingredient? Use applesauce or mashed banana for eggs in many baking recipes. Learn proportions and flavor notes."
  },
  {
    id: 6,
    title: "Meal Prep for Weight Loss: Balanced Plans That Work",
    outline: ["Calorie basics","Macronutrient balance","Sample meal prep plan","Snack ideas","Tracking tips"],
    sample: "Combine portion-controlled meals with high-fiber vegetables and lean protein to support sustainable weight loss. Consistency matters more than perfection."
  },
  {
    id: 7,
    title: "Quick 30-Minute Recipes for Weeknights",
    outline: ["Time-saving techniques","Pantry-powered meals","5 recipes under 30 minutes","Speedy sides","Cleanup hacks"],
    sample: "A simple stir-fry with pre-cut vegetables and a quick sauce can deliver dinner in under 20 minutes without sacrificing flavor."
  },
  {
    id: 8,
    title: "How to Read Nutrition Labels: A Beginner's Guide",
    outline: ["Serving sizes","Calories vs. nutrients","Added sugars","Healthy fats","Practical examples"],
    sample: "Understanding serving sizes is the first step—labels show nutrients per serving, not per package. Learn to compare products quickly."
  },
  {
    id: 9,
    title: "Kid-Friendly Healthy Lunchbox Ideas",
    outline: ["Balancing nutrients","Portable favorites","Allergy-aware swaps","Snack ideas","Make-ahead options"],
    sample: "Pack protein, fruit, and a crunchy veg to keep kids energized. Mini pita pockets and yogurt parfaits are great starting points."
  },
  {
    id: 10,
    title: "Comfort Food, Made Healthier: Swaps That Work",
    outline: ["Classic comfort dishes","Healthy ingredient swaps","Lower-fat cooking methods","Portion control","Recipes"],
    sample: "You can enjoy mac and cheese with cauliflower puree blended into the sauce for extra fiber and a lighter texture."
  },
  {
    id: 11,
    title: "Mediterranean Diet: Meal Ideas and Weekly Plan",
    outline: ["What is the Mediterranean diet","Core foods","7-day sample menu","Snack ideas","Benefits & evidence"],
    sample: "The Mediterranean pattern emphasizes olive oil, vegetables, legumes, and fish. Try grilled fish with a chickpea salad for a quick, nutritious meal."
  },
  {
    id: 12,
    title: "Healthy Breakfasts That Keep You Full Until Lunch",
    outline: ["Importance of breakfast","High-protein options","Fiber-rich choices","5 recipes","Prep tips"],
    sample: "Overnight oats with Greek yogurt, chia seeds, and berries provide fiber and protein to keep you satisfied through midday."
  },
  {
    id: 13,
    title: "Guide to Cooking with Spices: Boost Flavor, Reduce Salt",
    outline: ["Spice basics","Flavor pairing","Spice blends to try","Recipes using spices","Storing spices"],
    sample: "Cumin and smoked paprika add depth to tomato-based dishes—use spice to reduce reliance on salt for flavour."
  },
  {
    id: 14,
    title: "How to Batch-Cook and Freeze Meals for Busy Weeks",
    outline: ["Best freezer-friendly recipes","Storage tips","Reheating safely","Labeling system","2-hour batch plan"],
    sample: "Chili, stews and casseroles freeze exceptionally well. Cool quickly, portion, and label with date and reheating instructions."
  },
  {
    id: 15,
    title: "Gluten-Free Baking: Tips and Foolproof Recipes",
    outline: ["Ingredient swaps","Binders and structure","Best flours","Top recipes","Troubleshooting"],
    sample: "Use a blend of rice flour, tapioca starch, and xanthan gum for structure. Measure carefully and don't overmix."
  },
  {
    id: 16,
    title: "Healthy Meal Ideas for Athletes and Active People",
    outline: ["Energy needs","Meal timing","High-performance snacks","Hydration","Recovery meals"],
    sample: "Athletes benefit from carbs for fuel and protein for recovery—try a salmon bowl with sweet potato and greens post-workout."
  },
  {
    id: 17,
    title: "Fermentation at Home: Simple Recipes for Gut Health",
    outline: ["Benefits of fermentation","Easy kimchi and sauerkraut","Yogurt and kefir basics","Safety tips","How to use fermented foods"],
    sample: "Quick sauerkraut requires only cabbage and salt—ferment at room temperature for 3-7 days for tangy results."
  },
  {
    id: 18,
    title: "Vegetarian Dinner Ideas That Even Meat-Lovers Will Eat",
    outline: ["Satisfying vegetarian proteins","Umami boosters","Top 10 recipes","Meal assembly tips","Sides and salads"],
    sample: "Use roasted mushrooms, miso, and parmesan to add savory depth to vegetarian pasta dishes that please omnivores."
  },
  {
    id: 19,
    title: "Smart Grocery Shopping: Build a Healthy Pantry on Any Budget",
    outline: ["Pantry essentials","Buying seasonal","How to read labels","Storing produce","Weekly shopping list"],
    sample: "Keep dried beans, brown rice, canned tomatoes, and frozen vegetables on hand to build quick, nutritious meals."
  },
  {
    id: 20,
    title: "Quick Weeknight Salads That Are Actually Filling",
    outline: ["Balance of protein, fat, carbs","10 hearty salad recipes","Dressings that stick","Meal-prep tips","Add-ins to avoid sogginess"],
    sample: "Start with a sturdy green, add roasted vegetables, a grain, and a protein for salads that feel like dinner."
  },
  {
    id: 21,
    title: "Low-Carb Dinner Recipes That Don’t Sacrifice Flavor",
    outline: ["Low-carb swaps","Vegetable bases","Sauce ideas","5 dinner recipes","Dessert options"],
    sample: "Swap pasta for spiralized zucchini or spaghetti squash and use rich, flavorful sauces to keep meals satisfying."
  },
  {
    id: 22,
    title: "How to Build a Balanced Plate: Practical Portion Guide",
    outline: ["Plate method explained","Portion visuals","Examples for different goals","Kid-friendly plates","Measuring without a scale"],
    sample: "Use half your plate for vegetables, a quarter for lean protein, and a quarter for whole grains or starchy veg for balanced meals."
  },
  {
    id: 23,
    title: "Seasonal Cooking: Summer Recipes Using Fresh Produce",
    outline: ["What's in season","5 summer recipes","Grilling tips","Preserving extras","Pairing with drinks"],
    sample: "Tomato and corn salads shine in summer—bright herbs and a squeeze of lemon lift flavors."
  },
  {
    id: 24,
    title: "One-Pot Meals: Minimal Cleanup, Maximum Flavor",
    outline: ["Benefits of one-pot cooking","Top techniques","5 one-pot recipes","Safety and timing","Storage"],
    sample: "A one-pot chicken and rice with aromatics and broth becomes a comforting, easy weeknight winner."
  },
  {
    id: 25,
    title: "How to Meal Plan for Special Diets (Keto, Vegan, Paleo)",
    outline: ["Diet basics","Recipe swaps","Sample weekly menus","Common pitfalls","Shopping lists"],
    sample: "Planning for special diets is easier when you map staples and build variety across proteins, vegetables, and fats."
  },
  {
    id: 26,
    title: "Healthy Desserts: Satisfy Sweet Tooth Without the Crash",
    outline: ["Healthy sweeteners","Portion control","5 dessert recipes","Make-ahead treats","Pairings"],
    sample: "Dark chocolate and roasted fruit create a decadent dessert with antioxidants and real flavor."
  },
  {
    id: 27,
    title: "Cooking for Two: Scaled Recipes and Romantic Dinners",
    outline: ["Scaling tips","Dinner ideas","Meal-prep for two","Leftover strategies","Presentation tips"],
    sample: "Scale recipes by halving ingredients and adjust cooking times for smaller pans—serve with a simple fresh salsa."
  },
  {
    id: 28,
    title: "Fermented Drinks: Home Kombucha and Water Kefir Basics",
    outline: ["Health benefits","Safety tips","Step-by-step recipes","Flavoring ideas","Storage"],
    sample: "Kombucha is a tangy, fizzy drink made from a SCOBY—ferment carefully and flavor with fruit for variety."
  },
  {
    id: 29,
    title: "Guide to Healthy Snacking: Protein-Packed and Portable Options",
    outline: ["Snack principles","Top portable snacks","Recipes","Packing tips","Kids and snacks"],
    sample: "Roasted chickpeas, nut butter with apple slices, and boiled eggs are portable, protein-rich snacks that keep hunger at bay."
  },
  {
    id: 30,
    title: "Food Safety at Home: Storing, Reheating, and Avoiding Waste",
    outline: ["Safe temperatures","Storing leftovers","Reheating tips","When to discard","Reducing waste"],
    sample: "Cool leftovers quickly, refrigerate within two hours, and reheat to steaming hot to reduce risk—label containers with dates."
  }
];

export default blogIdeas;
