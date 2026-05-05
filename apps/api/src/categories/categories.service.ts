import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas';
import { Product, ProductDocument } from '../schemas';
import { ProductImage, ProductImageDocument } from '../schemas';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductImage.name) private productImageModel: Model<ProductImageDocument>,
  ) {}

  async findAll(): Promise<any> {
    const categories = await this.categoryModel.find().sort({ sortOrder: 1 }).lean();
    const counts = await this.productModel.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    return categories.map((cat) => ({
      ...cat,
      id: cat._id,
      _count: { products: countMap.get(cat._id) || 0 },
    }));
  }

  async findBySlug(slug: string): Promise<any> {
    const category = await this.categoryModel.findOne({ slug }).lean();
    if (!category) throw new NotFoundException('Category not found');

    const products = await this.productModel
      .find({ categoryId: category._id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = products.map((p) => p._id);
    const allImages = await this.productImageModel
      .find({ productId: { $in: productIds } })
      .sort({ sortOrder: 1 })
      .lean();
    const imageMap = new Map<string, typeof allImages>();
    for (const img of allImages) {
      if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
      imageMap.get(img.productId)!.push(img);
    }

    return {
      ...category,
      id: category._id,
      products: products.map((p) => ({
        ...p,
        id: p._id,
        images: (imageMap.get(p._id) || []).slice(0, 1),
      })),
    };
  }

  async findOne(id: string): Promise<any> {
    const category = await this.categoryModel.findById(id).lean();
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    // Mirror findBySlug: only active products are exposed via public id lookup.
    const products = await this.productModel
      .find({ categoryId: id, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return { ...category, id: category._id, products };
  }

  async create(dto: CreateCategoryDto) {
    return this.categoryModel.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.categoryModel.findByIdAndDelete(id);
  }
}
