import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createBetterAuthUser(
  email: string,
  password: string,
  name: string,
  role: string,
  extra: Record<string, string | undefined> = {},
) {
  // Hash password using scrypt (Better Auth's default)
  const { scryptSync, randomBytes } = await import('crypto');
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  const hashedPassword = `${salt}:${hash}`;

  const id = (await import('crypto')).randomUUID();

  const user = await prisma.user.create({
    data: {
      id,
      email,
      name,
      role,
      emailVerified: false,
      ...Object.fromEntries(
        Object.entries(extra).filter(([, v]) => v !== undefined),
      ),
    },
  });

  await prisma.account.create({
    data: {
      id: (await import('crypto')).randomUUID(),
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: hashedPassword,
    },
  });

  return user;
}

async function main() {
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

  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: 'corporate-gift-sets' }, update: {}, create: { name: 'Corporate Gift Sets', slug: 'corporate-gift-sets', description: 'Premium gift sets for corporate clients and employees', sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'drinkware' }, update: {}, create: { name: 'Drinkware', slug: 'drinkware', description: 'Custom branded bottles, mugs, and tumblers', sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'bags-backpacks' }, update: {}, create: { name: 'Bags & Backpacks', slug: 'bags-backpacks', description: 'Branded bags, backpacks, and tote bags', sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: 'apparel' }, update: {}, create: { name: 'Apparel', slug: 'apparel', description: 'Custom t-shirts, polo shirts, and jackets', sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: 'tech-gadgets' }, update: {}, create: { name: 'Tech & Gadgets', slug: 'tech-gadgets', description: 'USB drives, power banks, and tech accessories', sortOrder: 5 } }),
    prisma.category.upsert({ where: { slug: 'stationery' }, update: {}, create: { name: 'Stationery', slug: 'stationery', description: 'Pens, notebooks, and desk accessories', sortOrder: 6 } }),
    prisma.category.upsert({ where: { slug: 'eco-friendly' }, update: {}, create: { name: 'Eco Friendly', slug: 'eco-friendly', description: 'Sustainable and eco-conscious gift options', sortOrder: 7 } }),
    prisma.category.upsert({ where: { slug: 'trophies-awards' }, update: {}, create: { name: 'Trophies & Awards', slug: 'trophies-awards', description: 'Custom trophies, mementos, and award plaques', sortOrder: 8 } }),
  ]);

  const products = [
    { name: 'Executive Gift Box', slug: 'executive-gift-box', description: 'Premium executive gift box with pen, diary, and card holder. Perfect for corporate gifting.', shortDesc: 'Pen + Diary + Card Holder set', sku: 'LG-GS-001', priceFrom: 1499, priceTo: 2499, wholesalePrice: 1199, wholesaleMinQty: 25, categoryId: categories[0].id, minOrderQty: 10, isFeatured: true, isWholesale: true },
    { name: 'Welcome Swag Pack', slug: 'welcome-swag-pack', description: 'Complete employee onboarding kit with branded t-shirt, notebook, pen, mug, and welcome card.', shortDesc: 'T-shirt + Notebook + Pen + Mug', sku: 'LG-GS-002', priceFrom: 999, priceTo: 1799, wholesalePrice: 799, wholesaleMinQty: 50, categoryId: categories[0].id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Festive Gift Hamper', slug: 'festive-gift-hamper', description: 'Curated festive hamper with dry fruits, chocolates, and branded accessories.', shortDesc: 'Dry fruits + Chocolates + Accessories', sku: 'LG-GS-003', priceFrom: 799, priceTo: 1999, wholesalePrice: 649, wholesaleMinQty: 50, categoryId: categories[0].id, minOrderQty: 20, isFeatured: true, isWholesale: true },
    { name: 'Stainless Steel Bottle', slug: 'stainless-steel-bottle', description: 'Premium insulated stainless steel water bottle with laser-engraved branding.', shortDesc: '500ml insulated bottle', sku: 'LG-DW-001', priceFrom: 349, priceTo: 599, wholesalePrice: 279, wholesaleMinQty: 50, categoryId: categories[1].id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Ceramic Coffee Mug', slug: 'ceramic-coffee-mug', description: 'Custom printed ceramic mug with full-color branding. Microwave and dishwasher safe.', shortDesc: '330ml ceramic mug', sku: 'LG-DW-002', priceFrom: 149, priceTo: 299, wholesalePrice: 119, wholesaleMinQty: 100, categoryId: categories[1].id, minOrderQty: 50, isWholesale: true },
    { name: 'Laptop Backpack', slug: 'laptop-backpack', description: 'Premium laptop backpack with USB charging port. Fits up to 15.6" laptops.', shortDesc: 'USB charging backpack', sku: 'LG-BG-001', priceFrom: 899, priceTo: 1499, wholesalePrice: 719, wholesaleMinQty: 25, categoryId: categories[2].id, minOrderQty: 10, isFeatured: true, isWholesale: true },
    { name: 'Custom Polo T-Shirt', slug: 'custom-polo-tshirt', description: 'Premium cotton polo t-shirt with embroidered logo. Available in multiple colors.', shortDesc: 'Cotton polo with embroidery', sku: 'LG-AP-001', priceFrom: 399, priceTo: 699, wholesalePrice: 319, wholesaleMinQty: 50, categoryId: categories[3].id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Power Bank 10000mAh', slug: 'power-bank-10000', description: 'Slim portable power bank with dual USB output and LED display.', shortDesc: '10000mAh dual USB', sku: 'LG-TG-001', priceFrom: 599, priceTo: 999, wholesalePrice: 479, wholesaleMinQty: 50, categoryId: categories[4].id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Premium Metal Pen Set', slug: 'premium-metal-pen-set', description: 'Luxury metal pen set with gift box and custom laser engraving.', shortDesc: 'Metal pen with gift box', sku: 'LG-ST-001', priceFrom: 199, priceTo: 499, wholesalePrice: 159, wholesaleMinQty: 100, categoryId: categories[5].id, minOrderQty: 50, isFeatured: true, isWholesale: true },
    { name: 'Bamboo Pen + Notebook Set', slug: 'bamboo-pen-notebook-set', description: 'Eco-friendly bamboo pen and recycled paper notebook set.', shortDesc: 'Bamboo pen + recycled notebook', sku: 'LG-EC-001', priceFrom: 349, priceTo: 599, wholesalePrice: 279, wholesaleMinQty: 50, categoryId: categories[6].id, minOrderQty: 25, isFeatured: true, isWholesale: true },
    { name: 'Crystal Trophy', slug: 'crystal-trophy', description: 'Premium crystal trophy with 3D laser engraving for corporate awards.', shortDesc: 'Crystal with 3D engraving', sku: 'LG-TA-001', priceFrom: 599, priceTo: 1999, wholesalePrice: 479, wholesaleMinQty: 10, categoryId: categories[7].id, minOrderQty: 5, isFeatured: true, isWholesale: true },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { sku: p.sku }, update: {}, create: { ...p, stock: 500 } });
  }

  await prisma.client.upsert({ where: { email: 'procurement@techcorp.in' }, update: {}, create: { companyName: 'TechCorp Solutions', contactName: 'Rajesh Kumar', email: 'procurement@techcorp.in', phone: '+91 9876543212', address: '123 Tech Park, Whitefield', city: 'Bangalore', state: 'Karnataka', zipCode: '560066' } });
  await prisma.client.upsert({ where: { email: 'hr@startupinc.com' }, update: {}, create: { companyName: 'StartupInc', contactName: 'Priya Sharma', email: 'hr@startupinc.com', phone: '+91 9876543213', address: '45 Koramangala, 4th Block', city: 'Bangalore', state: 'Karnataka', zipCode: '560034' } });
  await prisma.client.upsert({ where: { email: 'admin@globalfirm.com' }, update: {}, create: { companyName: 'Global Firm Ltd', contactName: 'Amit Patel', email: 'admin@globalfirm.com', phone: '+91 9876543214', address: '78 Business Hub, Andheri East', city: 'Mumbai', state: 'Maharashtra', zipCode: '400069' } });

  const testimonials = [
    { clientName: 'Rajesh Kumar', company: 'TechCorp Solutions', content: 'Lotus Gift delivered 500 welcome kits for our new hires. Exceptional quality and met our tight deadline.', rating: 5 },
    { clientName: 'Priya Sharma', company: 'StartupInc', content: 'Amazing customization options and incredibly responsive support team throughout the process.', rating: 5 },
    { clientName: 'Amit Patel', company: 'Global Firm Ltd', content: 'Outstanding quality! The festive gift hampers for our clients were beautifully curated.', rating: 5 },
  ];
  for (const t of testimonials) await prisma.testimonial.create({ data: t });

  const banners = [
    { title: 'Corporate Gifting Made Effortless', subtitle: 'We Design. We Brand. We Deliver.', ctaText: 'Explore Gifts', ctaLink: '/products', isActive: true, sortOrder: 1 },
    { title: 'Wholesale Program', subtitle: 'Get up to 40% off on bulk orders', ctaText: 'Get Wholesale Pricing', ctaLink: '/request-quote', isActive: true, sortOrder: 2 },
  ];
  for (const b of banners) await prisma.banner.create({ data: b });

  const settings = [
    { key: 'site_name', value: 'Lotus Gift' },
    { key: 'site_tagline', value: 'Premium Promotional Products & Corporate Gifts' },
    { key: 'contact_email', value: 'info@lotusgift.com' },
    { key: 'contact_phone', value: '+91 9876543210' },
    { key: 'whatsapp_number', value: '+919876543210' },
    { key: 'address', value: '123 Business Park, Coimbatore, Tamil Nadu 641001' },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  console.log('Seed completed!');
  console.log('Admin: admin@lotusgift.com / admin123');
  console.log('Client: client@example.com / client123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
