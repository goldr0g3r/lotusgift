import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../schemas';
import { Category, CategoryDocument } from '../schemas';
import { ProductImage, ProductImageDocument } from '../schemas';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(ProductImage.name) private productImageModel: Model<ProductImageDocument>,
  ) {}

  async findAll(params: {
    search?: string;
    categoryId?: string;
    isWholesale?: string;
    isFeatured?: string;
    slug?: string;
  }) {
    const filter: Record<string, unknown> = { isActive: true };

    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { description: { $regex: params.search, $options: 'i' } },
        { sku: { $regex: params.search, $options: 'i' } },
      ];
    }

    if (params.categoryId) filter.categoryId = params.categoryId;
    if (params.isWholesale !== undefined) filter.isWholesale = params.isWholesale === 'true';
    if (params.isFeatured !== undefined) filter.isFeatured = params.isFeatured === 'true';

    if (params.slug) {
      const cat = await this.categoryModel.findOne({ slug: params.slug });
      if (cat) filter.categoryId = cat._id;
    }

    const products = await this.productModel.find(filter).sort({ createdAt: -1 }).lean();
    return this.attachCategoriesAndImages(products);
  }

  async findAllAdmin(params: { search?: string; categoryId?: string }) {
    const filter: Record<string, unknown> = {};
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: 'i' } },
        { sku: { $regex: params.search, $options: 'i' } },
      ];
    }
    if (params.categoryId) filter.categoryId = params.categoryId;

    const products = await this.productModel.find(filter).sort({ createdAt: -1 }).lean();
    return this.attachCategories(products);
  }

  /**
   * Public detail lookup. Inactive products are hidden so guessing an id can
   * never leak unpublished SKUs. Admins should use {@link findOneAdmin}.
   */
  async findOne(id: string) {
    const product = await this.productModel
      .findOne({ _id: id, isActive: true })
      .lean();
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    const [results] = await this.attachCategoriesAndImages([product]);
    return results;
  }

  async findOneAdmin(id: string) {
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    const [results] = await this.attachCategoriesAndImages([product]);
    return results;
  }

  /**
   * Public slug lookup. Inactive products are hidden.
   */
  async findBySlug(slug: string) {
    const product = await this.productModel
      .findOne({ slug, isActive: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    const [result] = await this.attachCategoriesAndImages([product]);
    return result;
  }

  async create(dto: CreateProductDto): Promise<any> {
    const product = await this.productModel.create(dto);
    const category = await this.categoryModel.findById(product.categoryId).lean();
    return { ...product.toObject(), id: product._id, category };
  }

  async update(id: string, dto: UpdateProductDto): Promise<any> {
    await this.findOneAdmin(id);
    const product = await this.productModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    const category = await this.categoryModel.findById(product!.categoryId).lean();
    return { ...product, id: product!._id, category };
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    return this.productModel.findByIdAndDelete(id);
  }

  private async attachCategories(products: any[]) {
    const catIds = [...new Set(products.map((p) => p.categoryId))];
    const categories = await this.categoryModel.find({ _id: { $in: catIds } }).lean();
    const catMap = new Map(categories.map((c) => [c._id, c]));
    return products.map((p) => ({ ...p, id: p._id, category: catMap.get(p.categoryId) || null }));
  }

  private async attachCategoriesAndImages(products: any[]) {
    const catIds = [...new Set(products.map((p) => p.categoryId))];
    const productIds = products.map((p) => p._id);

    const [categories, images] = await Promise.all([
      this.categoryModel.find({ _id: { $in: catIds } }).lean(),
      this.productImageModel.find({ productId: { $in: productIds } }).sort({ sortOrder: 1 }).lean(),
    ]);

    const catMap = new Map(categories.map((c) => [c._id, c]));
    const imgMap = new Map<string, typeof images>();
    for (const img of images) {
      if (!imgMap.has(img.productId)) imgMap.set(img.productId, []);
      imgMap.get(img.productId)!.push(img);
    }

    return products.map((p) => ({
      ...p,
      id: p._id,
      category: catMap.get(p.categoryId) || null,
      images: imgMap.get(p._id) || [],
    }));
  }
}
