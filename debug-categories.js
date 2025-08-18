// Script de debug pentru verificarea categoriilor și postărilor
const { MongoClient } = require('mongodb');

async function debugCategories() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-app');
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('=== VERIFICARE CATEGORII ===');
    const categories = await db.collection('categories').find({}).toArray();
    console.log(`Total categorii găsite: ${categories.length}`);
    
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.slug}): ${cat.isActive ? 'ACTIVĂ' : 'INACTIVĂ'} - ${cat.postCount} postări`);
    });
    
    console.log('\n=== VERIFICARE POSTĂRI PE CATEGORII ===');
    for (const category of categories) {
      const postsCount = await db.collection('posts').countDocuments({ category: category.slug });
      const actualPostCount = category.postCount || 0;
      
      console.log(`Categoria "${category.name}" (${category.slug}):`);
      console.log(`  - Postări în DB: ${postsCount}`);
      console.log(`  - PostCount în categorie: ${actualPostCount}`);
      console.log(`  - Status: ${category.isActive ? 'ACTIVĂ' : 'INACTIVĂ'}`);
      
      if (postsCount !== actualPostCount) {
        console.log(`  ⚠️  NECONCORDANȚĂ: postCount trebuie actualizat!`);
      }
      
      if (!category.isActive && postsCount > 0) {
        console.log(`  ⚠️  PROBLEMĂ: Categoria inactivă cu postări existente!`);
      }
      
      console.log('');
    }
    
    console.log('=== POSTĂRI FĂRĂ CATEGORIE VALIDĂ ===');
    const allCategorySlugs = categories.map(cat => cat.slug);
    const orphanPosts = await db.collection('posts').find({
      $or: [
        { category: { $nin: allCategorySlugs } },
        { category: null },
        { category: '' }
      ]
    }).toArray();
    
    if (orphanPosts.length > 0) {
      console.log(`⚠️  Găsite ${orphanPosts.length} postări fără categorie validă:`);
      orphanPosts.forEach(post => {
        console.log(`  - "${post.title}" (categoria: "${post.category || 'null'}")`);
      });
    } else {
      console.log('✅ Toate postările au categorii valide');
    }
    
  } catch (error) {
    console.error('Eroare la verificarea bazei de date:', error);
  } finally {
    await client.close();
  }
}

debugCategories();
