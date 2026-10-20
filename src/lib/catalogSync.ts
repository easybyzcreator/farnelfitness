import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { initialCategories, initialProducts } from '../data/defaultCatalog';
import { Product, Category } from '../types';

let isSeeding = false;
let hasSeeded = false;

/**
 * Ensures that all default categories and products are seeded into Firestore.
 * Does NOT overwrite existing user edits (uses merge: true or only writes if missing).
 */
export async function ensureCatalogSeeded(): Promise<void> {
  if (isSeeding || hasSeeded) return;
  isSeeding = true;

  try {
    // 1. Check existing categories
    const catSnap = await getDocs(collection(db, 'categorias'));
    const existingCatIds = new Set(catSnap.docs.map(d => d.id));

    for (const cat of initialCategories) {
      if (!existingCatIds.has(cat.id)) {
        await setDoc(doc(db, 'categorias', cat.id), cat, { merge: true });
      }
    }

    // 2. Check existing products
    const prodSnap = await getDocs(collection(db, 'produtos'));
    const existingProdIds = new Set(prodSnap.docs.map(d => d.id));
    const existingTitles = new Set(prodSnap.docs.map(d => (d.data().title || '').trim().toLowerCase()));

    for (const prod of initialProducts) {
      const titleLower = (prod.title || '').trim().toLowerCase();
      // If neither ID nor exact title exists in Firestore, seed it!
      if (!existingProdIds.has(prod.id) && !existingTitles.has(titleLower)) {
        await setDoc(doc(db, 'produtos', prod.id), prod, { merge: true });
      }
    }

    hasSeeded = true;
  } catch (error) {
    console.warn('Catalog auto-seed notice:', error);
  } finally {
    isSeeding = false;
  }
}

/**
 * Merges Firestore products with default initial products so that no items ever disappear.
 * Products from Firestore (which contain user edits) always take precedence over defaults.
 */
export function mergeProductsWithDefaults(fetched: Product[]): Product[] {
  if (!fetched || fetched.length === 0) {
    return initialProducts;
  }

  const merged: Product[] = [];
  const fetchedUsedIds = new Set<string>();

  // 1. Process all initial products in their canonical order
  for (const ip of initialProducts) {
    const ipTitle = (ip.title || '').trim().toLowerCase();
    const matchingFetched = fetched.find(
      p => p.id === ip.id || ((p.title || '').trim().toLowerCase() === ipTitle && ipTitle.length > 0)
    );

    if (matchingFetched) {
      // Use the version from Firestore (user's edited price, image, description, etc.)
      const finalImage = matchingFetched.image || ip.image || '';
      merged.push({
        ...ip,
        ...matchingFetched,
        image: finalImage
      });
      fetchedUsedIds.add(matchingFetched.id);
    } else {
      // Keep default item if not in Firestore
      merged.push(ip);
    }
  }

  // 2. Add any newly created or custom products that were added by the user
  for (const p of fetched) {
    if (!fetchedUsedIds.has(p.id)) {
      merged.push(p);
    }
  }

  return merged;
}

/**
 * Merges Firestore categories with default initial categories.
 */
export function mergeCategoriesWithDefaults(fetched: Category[]): Category[] {
  if (!fetched || fetched.length === 0) {
    return initialCategories;
  }

  const merged: Category[] = [];
  const fetchedUsedIds = new Set<string>();

  for (const ic of initialCategories) {
    const matchingFetched = fetched.find(c => c.id === ic.id || c.title?.trim().toLowerCase() === ic.title?.trim().toLowerCase());
    if (matchingFetched) {
      merged.push(matchingFetched);
      fetchedUsedIds.add(matchingFetched.id);
    } else {
      merged.push(ic);
    }
  }

  for (const c of fetched) {
    if (!fetchedUsedIds.has(c.id)) {
      merged.push(c);
    }
  }

  merged.sort((a, b) => (typeof a.order === 'number' ? a.order : 999) - (typeof b.order === 'number' ? b.order : 999));
  return merged;
}
