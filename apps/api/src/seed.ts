import mongoose from 'mongoose';
import { UserSchema } from './schemas/user.schema';
import { AccountSchema } from './schemas/account.schema';
import { CategorySchema } from './schemas/category.schema';
import { ProductSchema } from './schemas/product.schema';
import { ClientSchema } from './schemas/client.schema';
import { TestimonialSchema } from './schemas/testimonial.schema';
import { BannerSchema } from './schemas/banner.schema';
import { SiteSettingSchema } from './schemas/site-setting.schema';

const UserModel = mongoose.model('User', UserSchema);
const AccountModel = mongoose.model('Account', AccountSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const ProductModel = mongoose.model('Product', ProductSchema);
const ClientModel = mongoose.model('Client', ClientSchema);
const TestimonialModel = mongoose.model('Testimonial', TestimonialSchema);
const BannerModel = mongoose.model('Banner', BannerSchema);
const SiteSettingModel = mongoose.model('SiteSetting', SiteSettingSchema);

async function createBetterAuthUser(
  email: string,
  password: string,
  name: string,
  role: string,
  extra: Record<string, string | undefined> = {},
) {
  const { scryptSync, randomBytes, randomUUID } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const hashedPassword = `${salt}:${hash}`;

  const id = randomUUID();

  const user = await UserModel.create({
    _id: id,
    email,
    name,
    role,
    emailVerified: false,
    ...Object.fromEntries(
      Object.entries(extra).filter(([, v]) => v !== undefined),
    ),
  });

  await AccountModel.create({
    _id: randomUUID(),
    accountId: user._id,
    providerId: 'credential',
    userId: user._id,
    password: hashedPassword,
  });

  return user;
}

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lotusgift';
  await mongoose.connect(uri);
  console.log('Seeding database...');

  await createBetterAuthUser(
    'admin@lotusgift.com',
    'admin123',
    'Admin User',
    'admin',
    { phone: '+91 9876543210' },
  );

  await createBetterAuthUser(
    'client@example.com',
    'client123',
    'Demo Client',
    'client',
    { phone: '+91 9876543211', company: 'Demo Corp' },
  );

  const categoryData = [
    { name: 'Corporate Gift Sets', slug: 'corporate-gift-sets', description: 'Premium gift sets for corporate clients and employees', sortOrder: 1 },
    { name: 'Drinkware', slug: 'drinkware', description: 'Custom branded bottles, mugs, and tumblers', sortOrder: 2 },
    { name: 'Bags & Backpacks', slug: 'bags-backpacks', description: 'Branded bags, backpacks, and tote bags', sortOrder: 3 },
    { name: 'Apparel', slug: 'apparel', description: 'Custom t-shirts, polo shirts, and jackets', sortOrder: 4 },
    { name: 'Tech & Gadgets', slug: 'tech-gadgets', description: 'USB drives, power banks, and tech accessories', sortOrder: 5 },
    { name: 'Stationery', slug: 'stationery', description: 'Pens, notebooks, and desk accessories', sortOrder: 6 },
    { name: 'Eco Friendly', slug: 'eco-friendly', description: 'Sustainable and eco-conscious gift options', sortOrder: 7 },
    { name: 'Trophies & Awards', slug: 'trophies-awards', description: 'Custom trophies, mementos, and award plaques', sortOrder: 8 },
  ];

  const categories = await Promise.all(
    categoryData.map((cat) =>
      CategoryModel.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true }),
    ),
  );

  const products = [
    { name: 'Executive Gift Box', slug: 'executive-gift-box', description: 'Premium executive gift box with pen, diary, and card holder. Perfect for corporate gifting.', shortDesc: 'Pen + Diary + Card Holder set', sku: 'LG-GS-001', priceFrom: 1499, priceTo: 2499, wholesalePrice: 1199, wholesaleMinQty: 25, categoryId: categories[0]!._id, minOrderQty: 10, isFeatured: true, isWholesale: true },
    { name: 'Welcome Swag Pack', slug: 'welcome-swag-pack', description: 'Complete employee onboarding kit with branded t-shirt, notebook, pen, mug, and welcome card.', shortDesc: 'T-shirt + Notebook + Pen + Mug', sku: 'LG-GS-002', priceFrom: 999, priceTo: 1799, wholesalePrice: 799, wholesaleMinQty: 50, categoryId: categories[0]!._id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Festive Gift Hamper', slug: 'festive-gift-hamper', description: 'Curated festive hamper with dry fruits, chocolates, and branded accessories.', shortDesc: 'Dry fruits + Chocolates + Accessories', sku: 'LG-GS-003', priceFrom: 799, priceTo: 1999, wholesalePrice: 649, wholesaleMinQty: 50, categoryId: categories[0]!._id, minOrderQty: 20, isFeatured: true, isWholesale: true },
    { name: 'Stainless Steel Bottle', slug: 'stainless-steel-bottle', description: 'Premium insulated stainless steel water bottle with laser-engraved branding.', shortDesc: '500ml insulated bottle', sku: 'LG-DW-001', priceFrom: 349, priceTo: 599, wholesalePrice: 279, wholesaleMinQty: 50, categoryId: categories[1]!._id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Ceramic Coffee Mug', slug: 'ceramic-coffee-mug', description: 'Custom printed ceramic mug with full-color branding. Microwave and dishwasher safe.', shortDesc: '330ml ceramic mug', sku: 'LG-DW-002', priceFrom: 149, priceTo: 299, wholesalePrice: 119, wholesaleMinQty: 100, categoryId: categories[1]!._id, minOrderQty: 50, isWholesale: true },
    { name: 'Laptop Backpack', slug: 'laptop-backpack', description: 'Premium laptop backpack with USB charging port. Fits up to 15.6" laptops.', shortDesc: 'USB charging backpack', sku: 'LG-BG-001', priceFrom: 899, priceTo: 1499, wholesalePrice: 719, wholesaleMinQty: 25, categoryId: categories[2]!._id, minOrderQty: 10, isFeatured: true, isWholesale: true },
    { name: 'Custom Polo T-Shirt', slug: 'custom-polo-tshirt', description: 'Premium cotton polo t-shirt with embroidered logo. Available in multiple colors.', shortDesc: 'Cotton polo with embroidery', sku: 'LG-AP-001', priceFrom: 399, priceTo: 699, wholesalePrice: 319, wholesaleMinQty: 50, categoryId: categories[3]!._id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Power Bank 10000mAh', slug: 'power-bank-10000', description: 'Slim portable power bank with dual USB output and LED display.', shortDesc: '10000mAh dual USB', sku: 'LG-TG-001', priceFrom: 599, priceTo: 999, wholesalePrice: 479, wholesaleMinQty: 50, categoryId: categories[4]!._id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Premium Metal Pen Set', slug: 'premium-metal-pen-set', description: 'Luxury metal pen set with gift box and custom laser engraving.', shortDesc: 'Metal pen with gift box', sku: 'LG-ST-001', priceFrom: 199, priceTo: 499, wholesalePrice: 159, wholesaleMinQty: 100, categoryId: categories[5]!._id, minOrderQty: 50, isFeatured: true, isWholesale: true },
    { name: 'Bamboo Pen + Notebook Set', slug: 'bamboo-pen-notebook-set', description: 'Eco-friendly bamboo pen and recycled paper notebook set.', shortDesc: 'Bamboo pen + recycled notebook', sku: 'LG-EC-001', priceFrom: 349, priceTo: 599, wholesalePrice: 279, wholesaleMinQty: 50, categoryId: categories[6]!._id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Crystal Trophy', slug: 'crystal-trophy', description: 'Premium crystal trophy with 3D laser engraving for corporate awards.', shortDesc: 'Crystal with 3D engraving', sku: 'LG-TA-001', priceFrom: 599, priceTo: 1999, wholesalePrice: 479, wholesaleMinQty: 10, categoryId: categories[7]!._id, minOrderQty: 5, isFeatured: true, isWholesale: true },
  ];

  for (const p of products) {
    await ProductModel.findOneAndUpdate(
      { sku: p.sku },
      { ...p, stock: 500 },
      { upsert: true, new: true },
    );
  }

  const clientsData = [
    { companyName: 'TechCorp Solutions', contactName: 'Rajesh Kumar', email: 'procurement@techcorp.in', phone: '+91 9876543212', address: '123 Tech Park, Whitefield', city: 'Bangalore', state: 'Karnataka', zipCode: '560066' },
    { companyName: 'StartupInc', contactName: 'Priya Sharma', email: 'hr@startupinc.com', phone: '+91 9876543213', address: '45 Koramangala, 4th Block', city: 'Bangalore', state: 'Karnataka', zipCode: '560034' },
    { companyName: 'Global Firm Ltd', contactName: 'Amit Patel', email: 'admin@globalfirm.com', phone: '+91 9876543214', address: '78 Business Hub, Andheri East', city: 'Mumbai', state: 'Maharashtra', zipCode: '400069' },
  ];
  for (const c of clientsData) {
    await ClientModel.findOneAndUpdate({ email: c.email }, c, { upsert: true, new: true });
  }

  const testimonials = [
    { clientName: 'Rajesh Kumar', company: 'TechCorp Solutions', content: 'Lotus Gift delivered 500 welcome kits for our new hires. Exceptional quality and met our tight deadline.', rating: 5 },
    { clientName: 'Priya Sharma', company: 'StartupInc', content: 'Amazing customization options and incredibly responsive support team throughout the process.', rating: 5 },
    { clientName: 'Amit Patel', company: 'Global Firm Ltd', content: 'Outstanding quality! The festive gift hampers for our clients were beautifully curated.', rating: 5 },
  ];
  for (const t of testimonials) await TestimonialModel.create(t);

  const banners = [
    { title: 'Corporate Gifting Made Effortless', subtitle: 'We Design. We Brand. We Deliver.', ctaText: 'Explore Gifts', ctaLink: '/products', isActive: true, sortOrder: 1 },
    { title: 'Wholesale Program', subtitle: 'Get up to 40% off on bulk orders', ctaText: 'Get Wholesale Pricing', ctaLink: '/request-quote', isActive: true, sortOrder: 2 },
  ];
  for (const b of banners) await BannerModel.create(b);

  const settings = [
    { key: 'site_name', value: 'Lotus Gift' },
    { key: 'site_tagline', value: 'Premium Promotional Products & Corporate Gifts' },
    { key: 'contact_email', value: 'info@lotusgift.com' },
    { key: 'contact_phone', value: '+91 9876543210' },
    { key: 'whatsapp_number', value: '+919876543210' },
    { key: 'address', value: '123 Business Park, Coimbatore, Tamil Nadu 641001' },
  ];
  for (const s of settings) {
    await SiteSettingModel.findOneAndUpdate({ key: s.key }, s, { upsert: true, new: true });
  }

  console.log('Seed completed!');
  console.log('Admin: admin@lotusgift.com / admin123');
  console.log('Client: client@example.com / client123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await mongoose.disconnect(); });
