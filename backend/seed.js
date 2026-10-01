const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Recipe = require('./models/Recipe');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database...');

    // Clear existing data
    await User.deleteMany();
    await Recipe.deleteMany();
    console.log('[Seed] Cleared existing users and recipes.');

    // Create demo users
    const chefUser = await User.create({
      name: 'Chef Gordon',
      email: 'chef@cook.com',
      password: 'Password123!',
      role: 'admin',
    });

    const homeCook = await User.create({
      name: 'Jane Foodie',
      email: 'jane@cook.com',
      password: 'Password123!',
      role: 'user',
    });

    console.log(`[Seed] Created users: ${chefUser.email} (Admin), ${homeCook.email} (User)`);

    // Sample gourmet recipes
    const sampleRecipes = [
      {
        title: 'Authentic Italian Carbonara',
        ingredients: [
          '400g Spaghetti',
          '150g Guanciale or Pancetta',
          '4 Large Fresh Egg Yolks',
          '50g Pecorino Romano (Freshly Grated)',
          '50g Parmigiano Reggiano',
          'Freshly Cracked Black Pepper',
          'Sea Salt to taste',
        ],
        instructions:
          '1. Bring a large pot of salted water to a gentle boil and cook spaghetti al dente.\n2. In a skillet, sauté diced guanciale over medium heat until golden and crispy.\n3. Whisk egg yolks with grated Pecorino and Parmigiano until thick and creamy.\n4. Reserve 1/2 cup pasta water. Remove skillet from heat.\n5. Toss hot pasta with guanciale and fat. Let cool slightly.\n6. Pour egg mixture over pasta, tossing vigorously to create a silky emulsion. Add splashes of pasta water as needed.\n7. Finish with abundant cracked black pepper.',
        image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
        category: 'pasta',
        createdBy: chefUser._id,
      },
      {
        title: 'Classic Butter Chicken (Murgh Makhani)',
        ingredients: [
          '600g Boneless Chicken Thighs',
          '1 cup Plain Greek Yogurt',
          '2 tbsp Ginger-Garlic Paste',
          '1 tbsp Kashmiri Chili Powder',
          '1 tbsp Garam Masala',
          '400g Canned Crushed Tomatoes',
          '100g Butter',
          '1/2 cup Heavy Cream',
          '1 tbsp Dried Fenugreek Leaves (Kasuri Methi)',
        ],
        instructions:
          '1. Marinate chicken in yogurt, ginger-garlic paste, chili powder, and garam masala for 1 hour.\n2. Sear chicken pieces in butter until charred on both sides.\n3. In the same pot, simmer tomatoes, cashews, and spices until soft, then blend into a velvet-smooth gravy.\n4. Return sauce to pot, add butter, cream, and cooked chicken. Simmer for 10 minutes.\n5. Crush kasuri methi over the curry and serve piping hot with fragrant basmati rice.',
        image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
        category: 'curry',
        createdBy: chefUser._id,
      },
      {
        title: 'Artisan Neapolitan Margherita Pizza',
        ingredients: [
          '500g Tipo 00 Flour',
          '325ml Lukewarm Water',
          '10g Fine Sea Salt',
          '3g Active Dry Yeast',
          '250g San Marzano Tomatoes (Crushed)',
          '200g Fresh Mozzarella di Bufala',
          'Fresh Basil Leaves',
          'Extra Virgin Olive Oil',
        ],
        instructions:
          '1. Combine flour, water, yeast, and salt. Knead for 10 minutes until smooth and elastic.\n2. Proof dough for 24 hours in the refrigerator for maximum flavor development.\n3. Stretch dough gently by hand into a 12-inch disc, preserving an airy crust rim.\n4. Spread crushed San Marzano tomatoes, tear fresh mozzarella over top, and drizzle olive oil.\n5. Bake on a preheated pizza stone at maximum oven temperature (500°F/260°C) for 6-8 minutes until blistered.\n6. Garnish with fragrant fresh basil leaves before serving.',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
        category: 'pizza',
        createdBy: homeCook._id,
      },
      {
        title: 'Acai Berry Energy Smoothie Bowl',
        ingredients: [
          '2 Frozen Acai Puree Packets',
          '1 Frozen Banana',
          '1/2 cup Frozen Blueberries',
          '1/4 cup Almond Milk',
          '1 tbsp Chia Seeds',
          '1/2 cup Homemade Granola',
          'Fresh Strawberries & Coconut Flakes for topping',
        ],
        instructions:
          '1. Add frozen acai, banana, blueberries, and almond milk into a high-powered blender.\n2. Blend on low speed using a tamper until thick and sorbet-like in consistency.\n3. Pour mixture into a chilled bowl.\n4. Top neatly with rows of granola, sliced fresh strawberries, blueberries, chia seeds, and toasted coconut flakes.\n5. Enjoy immediately with a spoon!',
        image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80',
        category: 'breakfast',
        createdBy: homeCook._id,
      },
      {
        title: 'Japanese Miso Glazed Salmon',
        ingredients: [
          '4 Fresh Salmon Fillets (6oz each)',
          '3 tbsp White Miso Paste',
          '2 tbsp Mirin',
          '1 tbsp Sake or Rice Vinegar',
          '1 tbsp Brown Sugar',
          '1 tsp Sesame Oil',
          'Toasted Sesame Seeds & Scallions for garnish',
        ],
        instructions:
          '1. Whisk white miso, mirin, sake, brown sugar, and sesame oil in a shallow dish.\n2. Coat salmon fillets generously with marinade and chill for 30 minutes.\n3. Preheat broiler on high with rack 6 inches from heat source.\n4. Place salmon on a foil-lined baking sheet and broil for 6-8 minutes until caramelized and flaky.\n5. Garnish with toasted sesame seeds and thinly sliced green scallions.',
        image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        category: 'seafood',
        createdBy: chefUser._id,
      },
    ];

    const inserted = await Recipe.insertMany(sampleRecipes);
    console.log(`[Seed] Successfully seeded ${inserted.length} gourmet recipes!`);
    console.log('[Seed] Seeding complete.');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
